import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
  const whatsappUrl = 'https://wa.me/447822032847?text=' + encodeURIComponent("Hi! I have a question about Swap My Face Tees 👋");

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
            <h1 className="font-['Anton'] text-4xl sm:text-5xl text-[#252A34] mb-4 tracking-wide">GET IN TOUCH</h1>
            <p className="text-gray-500 text-lg">We're here to help — usually respond within the hour</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">

        {/* WhatsApp — primary */}
        <a href={whatsappUrl} target="_blank" rel="noreferrer"
          className="flex items-center gap-5 bg-[#25D366] text-white rounded-2xl p-6 shadow-sm hover:bg-[#20b958] transition-colors">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="font-['Anton'] text-xl tracking-wide">WHATSAPP US</p>
            <p className="text-white/90 mt-0.5">+44 7822 032847</p>
            <p className="text-white/70 text-sm mt-1">Fastest response — usually within the hour</p>
          </div>
        </a>

        {/* Email */}
        <a href="mailto:support@swapmyface.co.uk"
          className="flex items-center gap-5 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-[#FF2E63] transition-colors">
          <div className="w-14 h-14 bg-[#FF2E63]/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Mail className="w-7 h-7 text-[#FF2E63]" />
          </div>
          <div>
            <p className="font-['Anton'] text-xl text-[#252A34] tracking-wide">EMAIL US</p>
            <p className="text-gray-600 mt-0.5">support@swapmyface.co.uk</p>
            <p className="text-gray-400 text-sm mt-1">We aim to respond within 24 hours</p>
          </div>
        </a>

        {/* Address & Hours */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="flex items-start gap-5 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="w-14 h-14 bg-[#FF2E63]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-7 h-7 text-[#FF2E63]" />
            </div>
            <div>
              <p className="font-['Anton'] text-xl text-[#252A34] tracking-wide">ADDRESS</p>
              <p className="text-gray-600 mt-1 leading-relaxed">Unit 1, 651 Melton Road<br />Leicester<br />LE4 8EB</p>
            </div>
          </div>
          <div className="flex items-start gap-5 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="w-14 h-14 bg-[#FF2E63]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-7 h-7 text-[#FF2E63]" />
            </div>
            <div>
              <p className="font-['Anton'] text-xl text-[#252A34] tracking-wide">HOURS</p>
              <div className="text-gray-600 mt-1 space-y-0.5 text-sm">
                <p>Monday – Friday: 9am – 6pm</p>
                <p>Saturday: 10am – 4pm</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Custom design CTA */}
        <div className="bg-[#252A34] rounded-2xl p-6 text-center">
          <h2 className="font-['Anton'] text-2xl text-white tracking-wide mb-2">WANT US TO DESIGN IT FOR YOU?</h2>
          <p className="text-gray-400 mb-4">Just send us your photo and we'll handle everything</p>
          <a href={whatsappUrl} target="_blank" rel="noreferrer">
            <Button className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-8 py-3 font-bold uppercase tracking-wider">
              Message Us on WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
