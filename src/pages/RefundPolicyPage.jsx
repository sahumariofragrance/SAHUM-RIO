import React from "react";

function Section({ heading, children }) {
  return (
    <div className="mt-6">
      {heading && (
        <h2 className="text-base font-semibold text-[var(--color-text)]">{heading}</h2>
      )}
      <div className="mt-1 space-y-2">{children}</div>
    </div>
  );
}

function P({ children }) {
  return (
    <p className="text-sm text-[var(--color-text)] leading-relaxed">{children}</p>
  );
}

export default function RefundPolicyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Refund &amp; Return Policy</h1>

      <Section>
        <P>
          SAHUMÄRIO wishes its customers the best shopping experience to enhance their
          lives. As opened or used products cannot be reused or resold, items cannot be
          returned to the seller once delivered.
        </P>
        <P>
          Our products contain active natural extracts and ingredients. Damages due to
          neglect, improper usage or wrong application will not be covered under this
          Policy. This also does not cover repercussions arising out of specific
          sensitivities towards a product or ingredient — you are advised to do patch tests
          as cautioned in every product.
        </P>
      </Section>

      <Section heading="Refund Policy">
        <P>SAHUMÄRIO is not responsible for any damage after the delivery of the products.</P>
        <P>
          An unboxing video is mandatory with the original packaging in case of claims on
          missing items, leakage, breakage, damage, or incorrect product.
        </P>
        <P>
          To claim a refund, contact our customer care at{" "}
          <a href="tel:+919974599910" className="text-amber-600 hover:underline">
            +91-99745 99910
          </a>{" "}
          or write to us at{" "}
          <a
            href="mailto:sahumariofragrance@gmail.com"
            className="text-amber-600 hover:underline"
          >
            sahumariofragrance@gmail.com
          </a>{" "}
          with the necessary images and videos and subject line "Refund For —".
        </P>
        <P>
          If a package is tampered, damaged, or defective, please refuse to accept the
          package from the delivery partner on the spot.
        </P>
        <P>
          Contact customer care if the order is marked as delivered but not received,
          within 3 days of the product being marked delivered. No refunds shall be made
          after this period.
        </P>
        <P>The refund amount does not include delivery charges as they are non-refundable.</P>
        <P>
          Cash on delivery refunds shall be initiated to the bank account provided by the
          customer within 4–7 working days.
        </P>
        <P>A claim of refund should be made within 24 hours of order delivery.</P>
        <P>
          If accepted, your refund may take up to 15 days to be credited from the day of
          refund acceptance by SAHUMÄRIO. We will provide all details with relevant
          screenshots along with the transaction ID once the refund is initiated.
        </P>
      </Section>

      <Section heading="Return Policy">
        <P>
          In extreme cases of damaged product delivery (leakage, broken, or missing items)
          due to transit, a refund or exchange can be initiated after thorough verification
          of the refund policy.
        </P>
        <P>
          The customer should contact our customer care within 24–48 hours in the event
          you receive a damaged, broken, or leaked product.
        </P>
      </Section>

      <Section heading="Cancellation Policy">
        <P>
          Cancellation of orders can be processed before their dispatch from the warehouses
          only. A gateway charge of 2.5% shall be levied against your order for
          cancellation.
        </P>
        <P>
          A refund for paid orders shall be credited to the original payment account within
          15 days of cancellation acceptance.
        </P>
        <P>
          Orders cannot be cancelled once shipped from the warehouses. An amount of ₹75
          will be deducted if the order is shipped and returned to the seller
          (prepaid orders).
        </P>
      </Section>

      <Section heading="FAQs">
        <P>
          <strong>
            Q1. After acceptance of cancellation/refund, how long will it take to receive
            my funds?
          </strong>
        </P>
        <P>
          Refunds for paid orders shall be credited to the original payment account within
          15 days of cancellation acceptance. For COD orders, refund shall be issued to the
          bank account provided to the customer support team within 4–7 working days.
        </P>

        <P>
          <strong>Q2. Does the policy cover opened/used products?</strong>
        </P>
        <P>
          No. The policy only covers orders having leakage, broken, or missing items.
        </P>

        <P>
          <strong>Q3. How can I cancel my order if I placed it by mistake?</strong>
        </P>
        <P>
          You can cancel on the checkout order confirmation page within the first few hours,
          or reach out to customer care at{" "}
          <a href="tel:+919974599910" className="text-amber-600 hover:underline">
            +91-99745 99910
          </a>{" "}
          or{" "}
          <a
            href="mailto:sahumariofragrance@gmail.com"
            className="text-amber-600 hover:underline"
          >
            sahumariofragrance@gmail.com
          </a>
          .
        </P>
      </Section>
    </section>
  );
}
