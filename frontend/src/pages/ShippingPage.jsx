import { motion } from 'framer-motion';
import { Truck, RotateCcw, Clock, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-[#FF2E63]/10 rounded-full flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-[#FF2E63]" />
      </div>
      <h2 className="font-['Anton'] text-xl text-[#252A34] tracking-wide">{title}</h2>
    </div>
    {children}
  </div>
);

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
            <h1 className="font-['Anton'] text-4xl sm:text-5xl text-[#252A34] mb-4 tracking-wide">SHIPPING & RETURNS</h1>
            <p className="text-gray-500">Everything you need to know about delivery and returns</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">

        <Section icon={Truck} title="DELIVERY OPTIONS">
          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-800">Standard Delivery</p>
                  <p className="text-sm text-gray-600 mt-0.5">5–8 working days from proof approval</p>
                  <p className="text-xs text-gray-400 mt-1">Tracked delivery to any UK address</p>
                </div>
              </div>
              <span className="font-['Anton'] text-xl text-green-700">FREE</span>
            </div>
            <div className="flex items-start justify-between p-4 bg-[#FF2E63]/5 border border-[#FF2E63]/20 rounded-xl">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-[#FF2E63] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-800">Express Delivery</p>
                  <p className="text-sm text-gray-600 mt-0.5">3–5 working days from proof approval</p>
                  <p className="text-xs text-gray-400 mt-1">Priority production + tracked delivery</p>
                </div>
              </div>
              <span className="font-['Anton'] text-xl text-[#FF2E63]">£8.99</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">* Delivery times are from the point you approve your digital proof, not from the order date.</p>
        </Section>

        <Section icon={Clock} title="HOW IT WORKS">
          <div className="space-y-3">
            {[
              { step: '1', title: 'Place your order', desc: 'Complete your design and pay securely via Stripe' },
              { step: '2', title: 'We create your proof', desc: 'Our team reviews your design and creates a digital proof (usually within 24 hours)' },
              { step: '3', title: 'You approve', desc: 'We email you the proof — nothing is printed until you say yes' },
              { step: '4', title: 'We print & dispatch', desc: 'Once approved we print your order and dispatch via tracked delivery' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#FF2E63] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{s.step}</div>
                <div>
                  <p className="font-medium text-gray-800">{s.title}</p>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section icon={Package} title="ORDER TRACKING">
          <p className="text-gray-600 text-sm leading-relaxed">Once your order is dispatched you will receive a tracking number via email. You can use this to track your delivery on the courier's website. If you have any issues with your delivery please contact us via WhatsApp or email.</p>
        </Section>

        <Section icon={RotateCcw} title="RETURNS & REFUNDS">
          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p><strong className="text-gray-800">Please note:</strong> As all our products are custom-made to order, we are unable to accept returns for change of mind or sizing issues. We strongly recommend checking our size guide before ordering.</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-2">We will offer a full refund or free reprint if:</p>
              <ul className="space-y-1 list-disc pl-4">
                <li>The product arrives damaged or faulty</li>
                <li>The print quality is significantly different from the approved proof</li>
                <li>We made an error with your order</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-2">To raise a claim please:</p>
              <ul className="space-y-1 list-disc pl-4">
                <li>Contact us within 14 days of receiving your order</li>
                <li>Send photos of the issue via WhatsApp or email</li>
                <li>Include your order number</li>
              </ul>
            </div>
            <p>We aim to resolve all issues within 3 working days. Your statutory rights are not affected.</p>
          </div>
        </Section>

        <div className="bg-[#252A34] rounded-2xl p-6 text-center">
          <h2 className="font-['Anton'] text-xl text-white tracking-wide mb-2">QUESTIONS?</h2>
          <p className="text-gray-400 text-sm mb-4">We're happy to help — message us on WhatsApp for the fastest response</p>
          <a href="https://wa.me/447822032847" target="_blank" rel="noreferrer"
            className="inline-block bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-8 py-3 font-bold uppercase tracking-wider transition-colors text-sm">
            WhatsApp Us
          </a>
        </div>
      </div>
    </div>
  );
}
