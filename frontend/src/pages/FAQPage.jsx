import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const WHATSAPP = 'https://wa.me/447822032847?text=' + encodeURIComponent("Hi! I have a question about Swap My Face Tees 👋");

const faqs = [
  {
    category: 'Ordering',
    items: [
      { q: "How does the t-shirt builder work?", a: "Choose a template, upload your photo (we auto-remove the background), add your custom text, select your sizes and pay. After payment we'll create a digital proof and send it for your approval before printing anything." },
      { q: "Don't want to design it yourself?", a: "No problem at all! Just head to our Custom Order page and fill in a few details. We'll do the whole design for you, send a proof for approval and get it printed. You can also request a completely bespoke template if you don't see one you like." },
      { q: "Can I create different designs for each person?", a: "Yes! Use our Multi-Design mode to create individual designs for each person in your group — each with their own face and back name." },
      { q: "How many shirts is the minimum order?", a: "There's no minimum — you can order just one shirt if you want! Though obviously the more you order the better value it is." },
    ]
  },
  {
    category: 'Photos & Design',
    items: [
      { q: "What photo should I upload?", a: "A clear photo where the face is front-on and well-lit works best. Headshots or selfies are ideal. Avoid photos where the face is at an angle, partially covered, or in poor lighting." },
      { q: "What if my photo doesn't cut out properly?", a: "Don't worry — every order is manually checked by our team before printing. If your photo doesn't cut out cleanly we'll fix it, or contact you if we need a better quality photo." },
      { q: "Can I request a custom template?", a: "Absolutely! If you don't see a template you love, tell us your idea via our Custom Order page or WhatsApp and we'll create a bespoke template for you." },
      { q: "Can I add text to the back of the shirt?", a: "Yes — you can add a name to the back of each shirt for £2.50 per shirt. Great for adding names or numbers for a squad feel." },
      { q: "Do your templates support different skin tones?", a: "Our templates are stylised illustrations currently shown in one style. The face cutout uses your actual photo so your skin tone is always accurate. If you'd like a template body that better suits your group, get in touch via our Custom Order service — we can create bespoke artwork tailored to you." },
    ]
  },
  {
    category: 'Delivery',
    items: [
      { q: "How long does delivery take?", a: "Standard delivery is FREE and takes 5–8 working days from when you approve your proof. Express delivery is available for £8.99 and takes 3–5 working days from proof approval." },
      { q: "Do you deliver outside the UK?", a: "Currently we only deliver to UK addresses. International delivery may be available in the future — contact us to discuss." },
      { q: "Will I get a tracking number?", a: "Yes — once your order is dispatched you'll receive a tracking number via email so you can follow your delivery." },
    ]
  },
  {
    category: 'Payment & Returns',
    items: [
      { q: "How do I pay?", a: "We use Stripe for secure payment. You can pay by credit or debit card, Apple Pay or Google Pay. Payment is taken when you place your order." },
      { q: "Can I get a refund?", a: "As all our products are custom-made to order, we can't accept returns for change of mind. However if your order arrives damaged or we made an error, we'll offer a full refund or free reprint. See our Shipping & Returns page for full details." },
      { q: "Is it safe to pay on your website?", a: "Yes — payments are processed by Stripe, one of the world's most trusted payment platforms. We never store your card details." },
    ]
  },
];

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left gap-4">
        <span className="font-medium text-[#252A34] text-sm sm:text-base">{q}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} className="overflow-hidden">
            <p className="text-gray-600 text-sm pb-4 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
            <h1 className="font-['Anton'] text-4xl sm:text-5xl text-[#252A34] mb-4 tracking-wide">FAQS</h1>
            <p className="text-gray-500">Everything you need to know. Can't find your answer? <a href={WHATSAPP} target="_blank" rel="noreferrer" className="text-[#FF2E63] hover:underline">WhatsApp us</a></p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        {faqs.map(cat => (
          <div key={cat.category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">{cat.category.toUpperCase()}</h2>
            </div>
            <div className="px-6">
              {cat.items.map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="bg-[#252A34] rounded-2xl p-8 text-center">
          <h2 className="font-['Anton'] text-2xl text-white tracking-wide mb-2">STILL HAVE QUESTIONS?</h2>
          <p className="text-gray-400 mb-6">We're always happy to help — message us on WhatsApp for the fastest response</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={WHATSAPP} target="_blank" rel="noreferrer">
              <Button className="bg-[#25D366] hover:bg-[#20b958] text-white rounded-full px-8 py-3 font-bold uppercase tracking-wider gap-2 w-full sm:w-auto">
                <MessageCircle className="w-4 h-4" /> WhatsApp Us
              </Button>
            </a>
            <Link to="/custom-order">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#252A34] rounded-full px-8 py-3 font-bold uppercase tracking-wider w-full sm:w-auto">
                Custom Order Service
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
