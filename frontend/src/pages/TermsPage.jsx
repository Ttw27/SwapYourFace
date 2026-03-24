import { motion } from 'framer-motion';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="font-['Anton'] text-xl text-[#252A34] tracking-wide mb-3">{title}</h2>
    <div className="text-gray-600 text-sm leading-relaxed space-y-3">{children}</div>
  </div>
);

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
            <h1 className="font-['Anton'] text-4xl sm:text-5xl text-[#252A34] mb-4 tracking-wide">TERMS OF SERVICE</h1>
            <p className="text-gray-500 text-sm">Last updated: March 2026</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">

          <Section title="1. ABOUT US">
            <p>Swap My Face Tees is a trading name of <strong>TEZL GROUP LTD</strong>, a company registered in England and Wales. Our registered address is Unit 1, 651 Melton Road, Leicester, LE4 8EB.</p>
            <p>You can contact us at <a href="mailto:support@swapmyface.co.uk" className="text-[#FF2E63] hover:underline">support@swapmyface.co.uk</a> or via WhatsApp on +44 7822 032847.</p>
          </Section>

          <Section title="2. ACCEPTANCE OF TERMS">
            <p>By placing an order on swapmyface.co.uk you agree to these Terms of Service. Please read them carefully before ordering. If you do not agree, please do not use our service.</p>
          </Section>

          <Section title="3. CUSTOM PRODUCTS & PROOF APPROVAL">
            <p>All products are custom-made to order. Before printing, we will send you a digital proof for approval via email. <strong>Nothing is printed until you give your explicit approval.</strong></p>
            <p>By approving your proof, you confirm that all text, images, and design elements are correct. We are not responsible for errors that you have approved.</p>
            <p>We reserve the right to refuse orders containing offensive, illegal, or inappropriate content.</p>
          </Section>

          <Section title="4. PRICING & PAYMENT">
            <p>All prices are shown in GBP (£) and include VAT where applicable. Prices are subject to change without notice, but any change will not affect orders already placed.</p>
            <p>Payment is taken at the time of ordering via Stripe, our secure payment processor. We accept all major credit and debit cards. By providing your payment details you confirm that you are authorised to use that payment method.</p>
          </Section>

          <Section title="5. DELIVERY">
            <p>Standard delivery is free and takes 5–8 working days from proof approval. Express delivery (3–5 working days) is available for £8.99. Delivery times are estimates and not guaranteed.</p>
            <p>We deliver to UK addresses only. Risk of damage or loss passes to you upon delivery.</p>
          </Section>

          <Section title="6. RETURNS & REFUNDS">
            <p>As all products are custom-made, we cannot accept returns for change of mind or sizing issues. We strongly recommend reviewing our size guide before ordering.</p>
            <p>If your order arrives damaged, faulty, or significantly different from the approved proof, we will offer a full refund or free reprint. Please contact us within 14 days of receiving your order with photos of the issue and your order number.</p>
            <p>Refunds are processed within 5–10 working days to the original payment method. Your statutory rights under the Consumer Rights Act 2015 are not affected by these terms.</p>
          </Section>

          <Section title="7. INTELLECTUAL PROPERTY & IMAGE RIGHTS">
            <p>By uploading a photo, you confirm that you have the right to use that image and grant us a limited licence to use it solely for the purpose of fulfilling your order.</p>
            <p>You must not upload images that infringe third-party copyright, are defamatory, obscene, or otherwise unlawful. We are not responsible for any claims arising from images you upload.</p>
            <p>All website content, branding, and designs are the property of TEZL GROUP LTD and may not be copied or reproduced without permission.</p>
          </Section>

          <Section title="8. DATA PROTECTION">
            <p>We collect and process your personal data in accordance with our Privacy Policy and the UK GDPR. Your data is used solely to fulfil your order and communicate with you about it. We do not sell your data to third parties.</p>
            <p>Photos uploaded to our service are stored securely and used only to create your custom product. They are not shared with third parties or used for any other purpose.</p>
          </Section>

          <Section title="9. LIABILITY">
            <p>Our liability to you shall not exceed the total value of your order. We are not liable for any indirect, consequential, or special loss arising from your use of our service.</p>
            <p>We are not responsible for delays caused by circumstances outside our control, including postal delays, extreme weather, or supplier issues.</p>
          </Section>

          <Section title="10. GOVERNING LAW">
            <p>These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </Section>

          <Section title="11. CHANGES TO TERMS">
            <p>We may update these terms from time to time. The latest version will always be available on our website. Continued use of our service after changes constitutes acceptance of the new terms.</p>
          </Section>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl text-xs text-gray-400">
            <p>If you have any questions about these terms please contact us at <a href="mailto:support@swapmyface.co.uk" className="text-[#FF2E63] hover:underline">support@swapmyface.co.uk</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
