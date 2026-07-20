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

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Terms &amp; Conditions</h1>

      <Section>
        <P>
          This document is an electronic record in terms of the Information Technology Act,
          2000 and rules framed thereunder as applicable, and the amended provisions
          relating to electronic records in various statutes in force as amended by the
          Information Technology Act, 2000. This document is published in accordance with
          the provisions of Rule 3(1) of the Information Technology (Intermediaries
          Guidelines) Rules, 2011.
        </P>
      </Section>

      <Section heading="User Agreement">
        <P>
          PLEASE READ THIS TERMS OF SERVICE AGREEMENT CAREFULLY. BY USING THIS WEBSITE OR
          ORDERING PRODUCTS FROM THIS WEBSITE YOU AGREE TO BE BOUND BY ALL THE TERMS AND
          CONDITIONS OF THIS AGREEMENT.
        </P>
        <P>
          This Terms of Service Agreement governs your use of{" "}
          <strong>www.sahumario.com</strong> (SAHUMÄRIO) and your purchase of products
          available on this Website. SAHUMÄRIO reserves the right to change or revise the
          terms and conditions of this Agreement at any time by posting changes on this
          Website.
        </P>
      </Section>

      <Section heading="Important Disclaimers">
        <P>
          SAHUMÄRIO, its associates, affiliates, and service providers make no
          representations or warranties about the accuracy, reliability, completeness,
          and/or timeliness of any content, information, software, text, graphics, links
          or communications provided on or through the use of the Website.
        </P>
        <P>
          You understand, agree and acknowledge that SAHUMÄRIO uses third-party service
          providers to store and process your personal information. SAHUMÄRIO provides no
          guarantee that such third-party service providers will protect your personal
          information and shall not be liable for any actions, omissions, misconduct, fraud
          or negligence of these third parties.
        </P>
      </Section>

      <Section heading="Membership Eligibility">
        <P>
          In order to use the services of SAHUMÄRIO through the website, you may use guest
          login or create your own SAHUMÄRIO account. To create your account, you must be
          eligible to enter into a contract under the Indian Contract Act, 1872. Any minor
          (a person below the age of 18 years) can use the website and transact only
          through their legal guardians or parents.
        </P>
      </Section>

      <Section heading="Your Account &amp; Registration Obligations">
        <P>
          If you use the Website as a Registered User, you are responsible for maintaining
          the confidentiality of your User ID and Password. You are responsible for all
          activities that occur under your User ID and Password. You agree to provide true,
          accurate, current and complete information about yourself as prompted by the
          Website registration form.
        </P>
      </Section>

      <Section heading="Electronic Communications">
        <P>
          When you use the Website or send emails or other data to us, you agree and
          understand that you are communicating with us through electronic records and you
          consent to receive communications via electronic records from us periodically.
        </P>
      </Section>

      <Section heading="Use of Products and Services">
        <P>
          The products and services provided by SAHUMÄRIO on this website are for personal
          use only. Selling or reselling of products and services obtained through SAHUMÄRIO
          website is completely prohibited. Our products are non-returnable due to the hygiene and personal care nature of the products.
        </P>
        <P>
          However, in the unlikely event of a damaged, defective or different item being
          delivered to you, kindly contact us within 24 hours.
        </P>
      </Section>

      <Section heading="Fees and Services">
        <P>
          Membership on this website is free. SAHUMÄRIO does not charge for browsing and
          purchasing products except for the sale price of the product, applicable taxes as
          per the laws of India, and delivery charges wherever applicable.
        </P>
      </Section>

      <Section heading="Use of the Website">
        <P>By using this website you agree, undertake and confirm that your use shall be strictly governed by the following binding principles:</P>
        <P>You are solely responsible for your information.</P>
        <P>
          You shall not host, display, upload, modify, publish, transmit, update or share
          any information that is grossly harmful, harassing, blasphemous, defamatory,
          obscene, pornographic, libelous, invasive of another's privacy, hateful, or
          racially or ethnically objectionable, or unlawful in any manner.
        </P>
        <P>You will not copy any content of this website which is the proprietary interest of SAHUMÄRIO.</P>
      </Section>

      <Section heading="Limitation of Liability">
        <P>
          In no event shall SAHUMÄRIO be liable for any indirect, incidental, special,
          consequential, punitive or exemplary damages, including but not limited to,
          damages for loss of profits, goodwill, use, data or other intangible losses
          arising out of or in connection with the Website, its services or this agreement.
        </P>
      </Section>

      <Section heading="Indemnity">
        <P>
          You shall fully indemnify, defend and hold harmless SAHUMÄRIO, its owners,
          licensees, subsidiaries, affiliates, and their respective shareholders, officers,
          directors, agents, and employees from any claim or demand made by any third party
          or penalty imposed due to or arising out of your breach of these terms of use or
          any violation of any law, rules or regulations or the rights of a third party.
        </P>
      </Section>

      <Section heading="Dispute Resolution">
        <P>
          In case any issue arises, SAHUMÄRIO has a Dispute Resolution process to resolve
          disputes amicably between buyers and SAHUMÄRIO. You can register your grievance
          at customer care or write to us at{" "}
          <a
            href="mailto:sahumariofragrance@gmail.com"
            className="text-amber-600 hover:underline"
          >
            sahumariofragrance@gmail.com
          </a>
          . SAHUMÄRIO will make its best possible effort to settle the issue amicably
          before taking any legal recourse.
        </P>
      </Section>

      <Section heading="Governing Law / Jurisdiction">
        <P>
          This User Agreement and all the rules and policies contained herein shall be
          governed and construed in accordance with the laws of India, subject to the
          exclusive jurisdiction of courts at Rajkot, India.
        </P>
      </Section>

      <Section heading="Grievance Officer">
        <P>
          In accordance with the provisions of Rule 3(11) of the Information Technology
          (Intermediaries Guidelines) Rules, 2011, any user who suffers as a result of a
          violation may notify their complaints to us at{" "}
          <a
            href="mailto:sahumariofragrance@gmail.com"
            className="text-amber-600 hover:underline"
          >
            sahumariofragrance@gmail.com
          </a>
          . The Grievance Officer shall acknowledge your communication within 36 hours and
          the complaint shall be redressed within 1 month from the date of receipt.
        </P>
      </Section>

      <Section heading="Disclaimer">
        <P>
          SAHUMÄRIO personal care products are based on natural and Ayurvedic formulations.
          Despite tremendous safeguards taken to deliver items safe for human use, certain
          ingredients may cause allergic reactions for certain individuals or unfavourably
          affect people with prior conditions. Please make yourself aware of the ingredients
          and usage instructions accompanying each of our products. It will be your sole
          responsibility to take proper precautions or seek professional medical or
          dermatological advice before using any of our products that you may be allergic
          to.
        </P>
      </Section>
    </section>
  );
}
