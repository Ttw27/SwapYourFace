import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { ArrowRight, Shirt, Users, Upload, Sparkles, Star, CheckCircle, MessageCircle, Palette } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WHATSAPP = 'https://wa.me/447822032847?text=' + encodeURIComponent("Hi! I'd like a custom order 👋");

export default function HomePage() {
  const { templates } = useStore();
  const [reviews, setReviews] = useState([]);
  const [pricingTiers, setPricingTiers] = useState([]);

  useEffect(() => {
    fetch(`${API}/reviews`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setReviews(data.slice(0, 3)))
      .catch(() => {});
    fetch(`${API}/pricing`)
      .then(r => r.ok ? r.json() : {})
      .then(data => setPricingTiers(data.tiers || []))
      .catch(() => {});
  }, []);

  const features = [
    { icon: Upload, title: 'Upload Photo', desc: 'Upload any photo and we auto-remove the background' },
    { icon: Shirt, title: 'Choose Template', desc: 'Pick from hilarious body templates' },
    { icon: Users, title: 'Add Your Group', desc: 'Create one design for all or unique designs per person' },
    { icon: Sparkles, title: 'Get Printed', desc: 'High-quality print delivered to your door' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FF2E63] via-[#c4003f] to-[#252A34] py-20 sm:py-28">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #FFE600 0%, transparent 50%), radial-gradient(circle at 80% 20%, #FF2E63 0%, transparent 50%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}>
            <span className="inline-block bg-[#FFE600] text-[#1C1C1C] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-6">Custom Face T-Shirts</span>
            <h1 className="font-['Anton'] text-5xl sm:text-6xl lg:text-7xl text-white mb-6 tracking-wide leading-tight">
              MAKE YOUR<br />PARTY<br /><span className="text-[#FFE600]">LEGENDARY</span>
            </h1>
            <p className="text-white/80 text-lg sm:text-xl max-w-2xl mx-auto mb-8">
              Upload a photo, pick a hilarious template, and create custom face t-shirts for your stag or hen party in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/builder">
                <Button className="bg-[#FFE600] hover:bg-yellow-400 text-[#1C1C1C] rounded-full px-8 py-4 text-lg font-bold uppercase tracking-wider gap-2 shadow-lg">
                  Start Creating <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/gallery">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#252A34] rounded-full px-8 py-4 text-lg font-bold uppercase tracking-wider">
                  View Templates
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
              {['Free UK Delivery', 'Digital Proof First', 'No Minimum Order'].map(b => (
                <div key={b} className="flex items-center gap-2 text-white/80 text-sm">
                  <CheckCircle className="w-4 h-4 text-[#FFE600]" /> {b}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="font-['Anton'] text-3xl sm:text-4xl text-[#252A34] tracking-wide mb-3">HOW IT WORKS</h2>
            <p className="text-gray-500">From photo to doorstep in just a few steps</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay: i*0.1 }}
                className="text-center p-6 rounded-2xl bg-[#F7F7F7] hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-[#FF2E63]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-7 h-7 text-[#FF2E63]" />
                </div>
                <div className="w-6 h-6 bg-[#FF2E63] text-white rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-3">{i+1}</div>
                <h3 className="font-bold text-[#252A34] mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/builder">
              <Button className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-10 py-4 text-lg font-bold uppercase tracking-wider">
                Create Your Shirts
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* "We'll do it for you" section */}
      <section className="py-16 bg-[#252A34]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }}>
              <span className="inline-block bg-[#FF2E63] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">Custom Design Service</span>
              <h2 className="font-['Anton'] text-3xl sm:text-4xl text-white tracking-wide mb-4">DON'T WANT TO DESIGN IT YOURSELF?</h2>
              <p className="text-gray-400 mb-4 leading-relaxed">No problem! Just send us your photo and tell us which template you like — we'll create the design for you, send a proof for your approval, and get it printed once you're happy.</p>
              <p className="text-gray-400 mb-6 leading-relaxed">Want something totally unique? We can create a completely bespoke template just for you — just describe your idea and we'll make it happen.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WHATSAPP} target="_blank" rel="noreferrer">
                  <Button className="bg-[#25D366] hover:bg-[#20b958] text-white rounded-full px-8 py-3 font-bold uppercase tracking-wider gap-2">
                    <MessageCircle className="w-4 h-4" /> WhatsApp Us
                  </Button>
                </a>
                <Link to="/custom-order">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 py-3 font-bold uppercase tracking-wider">
                    Custom Order Form
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity:0, x:20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }}
              className="grid grid-cols-2 gap-4">
              {[
                { icon: Upload, title: 'Send your photo', desc: 'Just WhatsApp or email us your photo' },
                { icon: Palette, title: 'Tell us your idea', desc: 'Pick a template or describe what you want' },
                { icon: Star, title: 'Approve your proof', desc: 'We\'ll send a digital proof before printing' },
                { icon: Sparkles, title: 'We handle the rest', desc: 'Printed and shipped to your door' },
              ].map((s,i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <s.icon className="w-6 h-6 text-[#FF2E63] mb-2" />
                  <p className="font-bold text-white text-sm mb-1">{s.title}</p>
                  <p className="text-gray-400 text-xs">{s.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured templates */}
      {templates.length > 0 && (
        <section className="py-16 bg-[#F7F7F7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="text-center mb-10">
              <h2 className="font-['Anton'] text-3xl sm:text-4xl text-[#252A34] tracking-wide mb-3">POPULAR TEMPLATES</h2>
              <p className="text-gray-500">Choose your favourite or let us create something unique</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.slice(0,3).map((t,i) => (
                <motion.div key={t.id} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="aspect-square overflow-hidden bg-gray-50">
                    <img src={t.product_image_url || t.body_image_url} alt={t.name} className="w-full h-full object-contain p-4" crossOrigin="anonymous" />
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-[#252A34] mb-3">{t.name}</p>
                    <Link to={`/builder?template=${t.id}`}>
                      <Button className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-2.5 font-bold uppercase tracking-wider text-sm">
                        Use This Template
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/gallery">
                <Button variant="outline" className="rounded-full px-8 py-3 font-bold uppercase tracking-wider border-[#252A34] text-[#252A34] hover:bg-[#252A34] hover:text-white">
                  View All Templates <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Pricing table */}
      {pricingTiers.length > 0 && (
        <section className="py-16 bg-[#F7F7F7]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="text-center mb-10">
              <h2 className="font-['Anton'] text-3xl sm:text-4xl text-[#252A34] tracking-wide mb-3">THE MORE YOU ORDER, THE LESS YOU PAY</h2>
              <p className="text-gray-500">Volume pricing — automatically applied at checkout</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {pricingTiers.map((tier, i) => {
                const isLowest = tier.price === Math.min(...pricingTiers.map(t => t.price));
                return (
                  <div key={i} className={`rounded-2xl p-4 text-center border-2 transition-all ${isLowest ? 'border-[#FF2E63] bg-[#FF2E63]/5 shadow-md' : 'border-gray-200 bg-white'}`}>
                    {isLowest && <span className="inline-block bg-[#FF2E63] text-white text-xs font-bold px-2 py-0.5 rounded-full mb-2 uppercase tracking-wide">Best Value</span>}
                    <p className="font-['Anton'] text-2xl text-[#252A34]">£{tier.price.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">per shirt</p>
                    <p className="text-sm font-medium text-gray-700 mt-2">{tier.label}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-gray-400 mt-6">All prices exclude back print add-on. Free UK delivery on all orders.</p>
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-10">
            <h2 className="font-['Anton'] text-3xl sm:text-4xl text-[#252A34] tracking-wide mb-3">WHAT OUR CUSTOMERS SAY</h2>
            <div className="flex items-center justify-center gap-2">
              {[1,2,3,4,5].map(i=><Star key={i} className="w-5 h-5 fill-[#FFE600] text-[#FFE600]"/>)}
              <span className="text-gray-500 text-sm ml-1">Rated 5 stars by our customers</span>
            </div>
          </div>

          {reviews.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {reviews.map((r,i) => (
                <motion.div key={r._id||r.id||i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}
                  className="bg-[#F7F7F7] rounded-2xl overflow-hidden">
                  {r.photo_url && (
                    <img src={r.photo_url} alt={r.name} className="w-full aspect-square object-cover" crossOrigin="anonymous" />
                  )}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-[#252A34]">{r.name}</p>
                        {r.event && <p className="text-xs text-gray-400">{r.event}</p>}
                      </div>
                      {r.verified && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">✓ Verified</span>}
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[1,2,3,4,5].map(i=><Star key={i} className={`w-3.5 h-3.5 ${i<=r.rating?'fill-[#FFE600] text-[#FFE600]':'text-gray-200'}`}/>)}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">"{r.text}"</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              {[
                { name:'Sarah M.', event:'Hen Party', text:'Absolutely hilarious! The whole hen party were in stitches when they saw the shirts.', rating:5 },
                { name:'James T.', event:'Stag Do', text:'Ordered 12 shirts for my stag do in Benidorm. Dead easy process and the lads loved them.', rating:5 },
                { name:'Emma K.', event:'Hen Party', text:'Made our hen do extra special. Everyone wanted to know where we got them from!', rating:5 },
              ].map((r,i) => (
                <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}
                  className="bg-[#F7F7F7] rounded-2xl p-5">
                  <div className="flex gap-0.5 mb-2">
                    {[1,2,3,4,5].map(i=><Star key={i} className="w-4 h-4 fill-[#FFE600] text-[#FFE600]"/>)}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">"{r.text}"</p>
                  <p className="font-bold text-[#252A34] text-sm">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.event}</p>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center">
            <Link to="/reviews">
              <Button variant="outline" className="rounded-full px-8 py-3 font-bold uppercase tracking-wider border-[#252A34] text-[#252A34] hover:bg-[#252A34] hover:text-white">
                See All Reviews <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-[#FF2E63] to-[#c4003f]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-['Anton'] text-3xl sm:text-4xl text-white tracking-wide mb-4">READY TO CREATE SOMETHING LEGENDARY?</h2>
          <p className="text-white/80 mb-8">Join hundreds of happy stag and hen parties across the UK</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/builder">
              <Button className="bg-white text-[#FF2E63] hover:bg-gray-100 rounded-full px-10 py-4 text-lg font-bold uppercase tracking-wider">
                Start Creating Now
              </Button>
            </Link>
            <Link to="/custom-order">
              <Button variant="outline" className="border-white text-white hover:bg-white/10 rounded-full px-10 py-4 text-lg font-bold uppercase tracking-wider">
                Get Us To Design It
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
