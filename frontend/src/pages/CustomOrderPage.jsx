import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, MessageCircle, Send, CheckCircle, X, Star, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const WHATSAPP = 'https://wa.me/447822032847';

export default function CustomOrderPage() {
  const [form, setForm] = useState({ name:'', email:'', phone:'', template:'', notes:'', quantity:'' });
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error('Please fill in your name, email and phone'); return;
    }

    // Build WhatsApp message with their details
    const msg = `Hi! I'd like a custom order 👋

Name: ${form.name}
Email: ${form.email}
Phone: ${form.phone}
Template: ${form.template || 'Not sure yet'}
Quantity: ${form.quantity || 'Not sure yet'}
Notes: ${form.notes || 'None'}

${photo ? 'I have a photo ready to send!' : ''}`;

    // Open WhatsApp with pre-filled message
    window.open(`${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-['Anton'] text-2xl text-[#252A34] mb-2 tracking-wide">WHATSAPP OPENED!</h2>
          <p className="text-gray-500 mb-6">We've pre-filled a message with your details. Just send it and attach your photo — we'll get back to you as soon as possible!</p>
          <div className="space-y-3">
            <Link to="/">
              <Button className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-4 font-bold uppercase tracking-wider">Back to Home</Button>
            </Link>
            <Link to="/gallery">
              <Button variant="outline" className="w-full rounded-full py-4">Browse Templates</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Hero */}
      <section className="bg-[#252A34] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
            <span className="inline-block bg-[#FF2E63] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">Custom Design Service</span>
            <h1 className="font-['Anton'] text-4xl sm:text-5xl text-white mb-4 tracking-wide">WE'LL DESIGN IT FOR YOU</h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Don't want to create your own design? No problem — just send us your photo and we'll handle everything. We'll create the design, send you a proof for approval, and get your order printed.</p>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-b border-gray-100 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: MessageCircle, title: 'Get in touch', desc: 'Fill in the form below and we\'ll open WhatsApp with your details' },
              { icon: Upload, title: 'Send your photo', desc: 'Send us your photo and tell us which template you like (or describe what you want)' },
              { icon: Star, title: 'We do the rest', desc: 'We create your design, send a proof, and once approved get it printed and shipped' },
            ].map((s,i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-[#FF2E63]/10 rounded-full flex items-center justify-center mb-3">
                  <s.icon className="w-6 h-6 text-[#FF2E63]" />
                </div>
                <p className="font-bold text-[#252A34] mb-1">{s.title}</p>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom template callout */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-[#FF2E63]/5 border border-[#FF2E63]/20 rounded-2xl p-6 flex items-start gap-4">
          <Palette className="w-8 h-8 text-[#FF2E63] flex-shrink-0 mt-1" />
          <div>
            <p className="font-bold text-[#252A34] text-lg">Want a completely custom template?</p>
            <p className="text-gray-600 text-sm mt-1">Don't see a template you love? Tell us your idea and we can create a completely bespoke template just for you. Whether it's a specific theme, sport, job, or something totally unique — we can make it happen. Just mention it in the notes below.</p>
          </div>
        </div>
      </section>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-5">
          <h2 className="font-['Anton'] text-2xl text-[#252A34] tracking-wide">YOUR DETAILS</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Full Name <span className="text-[#FF2E63]">*</span></Label><Input value={form.name} onChange={e=>setF('name',e.target.value)} placeholder="Your name" className="mt-1"/></div>
            <div><Label>Phone Number <span className="text-[#FF2E63]">*</span></Label><Input type="tel" value={form.phone} onChange={e=>setF('phone',e.target.value)} placeholder="07911 123456" className="mt-1"/></div>
          </div>

          <div><Label>Email Address <span className="text-[#FF2E63]">*</span></Label><Input type="email" value={form.email} onChange={e=>setF('email',e.target.value)} placeholder="your@email.com" className="mt-1"/><p className="text-xs text-gray-400 mt-1">Your proof will be sent here</p></div>

          <div>
            <Label>Which template do you like?</Label>
            <Input value={form.template} onChange={e=>setF('template',e.target.value)} placeholder="e.g. Hip Hop King, Bodybuilder, or describe your idea..." className="mt-1"/>
            <p className="text-xs text-gray-400 mt-1"><Link to="/gallery" className="text-[#FF2E63] hover:underline">Browse our templates →</Link></p>
          </div>

          <div><Label>How many shirts do you need?</Label><Input value={form.quantity} onChange={e=>setF('quantity',e.target.value)} placeholder="e.g. 12 for a stag do" className="mt-1"/></div>

          <div><Label>Any other details or special requests?</Label><Textarea value={form.notes} onChange={e=>setF('notes',e.target.value)} placeholder="Tell us about your event, any specific requirements, custom template ideas, etc." rows={4} className="mt-1"/></div>

          <div className="p-4 bg-[#FFF9E6] border border-[#FFE600] rounded-xl text-sm text-gray-600">
            <p className="font-bold text-[#1C1C1C] mb-1">📸 Have your photo ready?</p>
            <p>After clicking the button below, WhatsApp will open with your details pre-filled. Just send the message and attach your photo directly in the chat!</p>
          </div>

          <Button onClick={handleSubmit} disabled={submitting}
            className="w-full bg-[#25D366] hover:bg-[#20b958] text-white rounded-full py-6 text-lg font-bold uppercase tracking-wider gap-3">
            <MessageCircle className="w-5 h-5" />
            Send via WhatsApp
          </Button>

          <p className="text-xs text-center text-gray-400">We typically respond within the hour during business hours</p>
        </div>
      </div>
    </div>
  );
}
