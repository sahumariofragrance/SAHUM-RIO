import React from "react";

function Section({ heading, children }) {
  return (
    <div className="mt-6">
      {heading && <h2 className="text-base font-semibold text-[var(--color-text)]">{heading}</h2>}
      <div className="mt-1 space-y-2">{children}</div>
    </div>
  );
}

function P({ children }) {
  return <p className="text-sm text-[var(--color-text)] leading-relaxed">{children}</p>;
}

export default function PrivacyPolicyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>

      <Section>
        <P>
          SAHUMäRIO respects your privacy. This policy explains the information we collect
          when you use our website, create an account, place an order, or contact us, and
          how that information is used.
        </P>
      </Section>

      <Section heading="Information We Collect">
        <P>
          We may collect information you provide to us, including your name, email address,
          phone number, shipping address, account information, order details, and customer
          support communications.
        </P>
        <P>
          Our service providers may also process limited technical information needed to
          operate and secure the website, such as IP address, browser information, device
          information, and request logs.
        </P>
      </Section>

      <Section heading="Payments">
        <P>
          Online payments are processed by our payment gateway provider. SAHUMäRIO does not
          store your full card number, CVV, UPI PIN, or online-banking credentials. We may
          retain payment references, transaction status, amount, and related order
          information so that we can verify and support your purchase.
        </P>
      </Section>

      <Section heading="How We Use Your Information">
        <P>
          We use your information to create and manage your account, process and fulfil
          orders, verify payments, send transactional emails, provide shipment updates,
          respond to support requests, prevent fraud or misuse, and maintain the security
          and reliability of our services.
        </P>
      </Section>

      <Section heading="Service Providers">
        <P>
          We use third-party service providers for website hosting, authentication and
          database services, payment processing, transactional email, and delivery or
          courier services. We share information with them only as reasonably necessary to
          provide these services and operate our business.
        </P>
      </Section>

      <Section heading="Data Retention">
        <P>
          We retain account, order, payment-reference, and support information for as long
          as reasonably necessary for order fulfilment, customer support, record keeping,
          fraud prevention, dispute handling, and applicable legal or regulatory
          requirements.
        </P>
      </Section>

      <Section heading="Your Choices">
        <P>
          You can contact us to ask questions about your personal information or request
          appropriate corrections or account assistance. Some transaction records may need
          to be retained for legitimate business or legal purposes even after an account is
          no longer used.
        </P>
      </Section>

      <Section heading="Security">
        <P>
          We use reasonable technical and organisational measures intended to protect
          personal information. No online service can guarantee absolute security, so you
          should also keep your account password confidential and use a strong, unique
          password.
        </P>
      </Section>

      <Section heading="Children">
        <P>
          The website is not intended for children to create accounts or place orders on
          their own. Minors should use the website only with the involvement of a parent or
          legal guardian where permitted.
        </P>
      </Section>

      <Section heading="Changes to This Policy">
        <P>
          We may update this Privacy Policy from time to time. The current version will be
          posted on this page.
        </P>
      </Section>

      <Section heading="Contact Us">
        <P>
          For privacy questions or requests, contact us at{" "}
          <a href="mailto:sahumariofragrance@gmail.com" className="text-amber-600 hover:underline">
            sahumariofragrance@gmail.com
          </a>.
        </P>
      </Section>
    </section>
  );
}
