import React from "react";
import { MessageCircle, Phone } from "lucide-react";
import { pixelContact } from "../lib/metaPixel";

// The shop's WhatsApp number (also on the policy pages), with India's code.
export const WHATSAPP_NUMBER = "919974599910";

export function whatsappLink(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/**
 * Floating "Chat with us" button: many shoppers want to ask something before
 * they pay. On a perfume page the message names that perfume.
 */
export default function WhatsAppButton({ productName }) {
  const text = productName
    ? `Hi SAHUMäRIO! I have a question about ${productName}.`
    : "Hi SAHUMäRIO! I have a question.";

  return (
    <a
      href={whatsappLink(text)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => pixelContact()}
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-4 right-4 z-40 flex items-center gap-2.5 sm:bottom-6 sm:right-6"
    >
      <span className="hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-medium text-[var(--color-text)] shadow-md transition group-hover:border-[var(--color-text)] sm:block">
        Questions? Chat with us
      </span>
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-1 ring-black/10 transition group-hover:scale-105 sm:h-14 sm:w-14">
        <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} aria-hidden="true" />
        <Phone className="absolute h-3 w-3 fill-white sm:h-3.5 sm:w-3.5" strokeWidth={0} aria-hidden="true" />
      </span>
    </a>
  );
}
