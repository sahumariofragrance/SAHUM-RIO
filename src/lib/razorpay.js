/**
 * Razorpay frontend SDK helpers.
 * Keeps all SDK-related logic in one place so CheckoutPage stays clean.
 */

const SDK_URL = "https://checkout.razorpay.com/v1/checkout.js";

// Module-level promise so concurrent calls share the same load operation
// instead of injecting the script tag multiple times.
let sdkLoadPromise = null;

/**
 * Lazily loads the Razorpay checkout script.
 * Safe to call multiple times — concurrent calls share one promise.
 */
export function loadRazorpayScript() {
  // Already loaded
  if (window.Razorpay) return Promise.resolve(true);

  // Already loading — share the in-flight promise
  if (sdkLoadPromise) return sdkLoadPromise;

  // Check if the script tag already exists (e.g. from a previous page load)
  if (document.querySelector(`script[src="${SDK_URL}"]`)) {
    sdkLoadPromise = new Promise((resolve, reject) => {
      // Script tag exists but Razorpay isn't on window yet — wait for it
      const check = setInterval(() => {
        if (window.Razorpay) {
          clearInterval(check);
          resolve(true);
        }
      }, 50);
      // Give up after 10s
      setTimeout(() => {
        clearInterval(check);
        reject(new Error("Payment SDK took too long to load. Please refresh and try again."));
      }, 10_000);
    });
    return sdkLoadPromise;
  }

  sdkLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src   = SDK_URL;
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => {
      sdkLoadPromise = null; // allow retry after failure
      reject(new Error("Failed to load payment SDK. Check your internet connection and try again."));
    };

    document.body.appendChild(script);
  });

  return sdkLoadPromise;
}

/**
 * Returns true when the key is a Razorpay test key (starts with "rzp_test_").
 * Used to show a test-mode badge in the UI.
 */
export function isTestMode(keyId) {
  return typeof keyId === "string" && keyId.startsWith("rzp_test_");
}

/**
 * Opens the Razorpay checkout modal and returns a Promise:
 *  - Resolves with { razorpay_payment_id, razorpay_order_id, razorpay_signature }
 *  - Rejects with Error("CANCELLED") when user dismisses
 *  - Rejects with a descriptive Error on payment failure
 */
export function openRazorpayCheckout(options) {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error("Payment SDK not loaded. Please refresh the page and try again."));
      return;
    }

    const rzp = new window.Razorpay({
      ...options,
      handler(response) {
        resolve(response);
      },
      modal: {
        ondismiss() {
          reject(new Error("CANCELLED"));
        },
      },
    });

    rzp.on("payment.failed", (response) => {
      reject(
        new Error(
          response?.error?.description ||
          response?.error?.reason ||
          "Payment failed. Please try a different payment method."
        )
      );
    });

    rzp.open();
  });
}
