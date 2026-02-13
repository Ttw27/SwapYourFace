import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export default function FAQPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      question: "How does the t-shirt builder work?",
      answer: "Our builder is super simple! Choose a funny body template, upload a photo (we'll auto-remove the background), add your custom text, and select your sizes. The whole process takes just a few minutes. You can create one design for the whole group or unique designs for each person."
    },
    {
      question: "What photo should I upload?",
      answer: "For best results, use a clear photo where the face is visible and well-lit. Headshots or selfies work great! Our background removal tool handles most photos automatically, but if you're not happy with the result, you can use the manual crop option."
    },
    {
      question: "Can I create different designs for each person?",
      answer: "Yes! Our Multi-Design mode lets you create a unique design for each person in your group. Each person can have their own photo, template choice, and back name. Perfect for personalizing everyone's shirt!"
    },
    {
      question: "What sizes are available?",
      answer: "We offer sizes from S to 3XL. All our t-shirts are unisex fit and made from high-quality cotton. Check our size guide for detailed measurements."
    },
    {
      question: "How long does delivery take?",
      answer: "Standard UK delivery takes 5-7 working days. We also offer express delivery options for last-minute orders. All orders include free shipping within the UK!"
    },
    {
      question: "Can I add names to the back of the shirts?",
      answer: "Absolutely! You can add a name (and optional number) to the back of each shirt for just £2.50 extra per shirt. In Bulk Mode, you can either use the same name for all shirts or provide a unique name for each one."
    },
    {
      question: "What if I'm not happy with my order?",
      answer: "We want you to love your shirts! If there's any issue with print quality or if you receive the wrong items, contact us and we'll make it right. Due to the custom nature of our products, we can't offer returns for change of mind, but we're always here to help with any problems."
    },
    {
      question: "Do you offer bulk discounts?",
      answer: "Yes! The more you order, the more you save. Orders of 10+ items get 5% off, 20+ items get 10% off, and 50+ items get 15% off. Discounts are automatically applied at checkout."
    },
    {
      question: "What format are the print files?",
      answer: "We generate high-resolution PNG files with transparent backgrounds, ready for printing. You'll receive both the front design and back design (if selected) for each shirt. We also keep your original uploaded photos on file in case any manual edits are needed."
    },
    {
      question: "How do I contact you?",
      answer: "You can reach us via email at hello@partytees.co.uk or through our contact form. We typically respond within 24 hours on business days."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7] py-12">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 mx-auto mb-6 bg-[#FF2E63]/10 rounded-2xl flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-[#FF2E63]" />
          </div>
          <h1 className="font-['Anton'] text-4xl sm:text-5xl text-[#252A34] mb-4 tracking-wide">
            FREQUENTLY ASKED QUESTIONS
          </h1>
          <p className="text-gray-600">
            Everything you need to know about our custom party t-shirts
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="card-party overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-6 flex items-center justify-between text-left"
                data-testid={`faq-${idx}`}
              >
                <span className="font-bold text-[#252A34] pr-4">{faq.question}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-5 h-5 text-[#FF2E63] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              
              {openFaq === idx && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="px-6 pb-6"
                >
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <a 
            href="/contact"
            className="inline-flex items-center text-[#FF2E63] font-bold hover:underline"
          >
            Contact us
          </a>
        </motion.div>
      </div>
    </div>
  );
}
