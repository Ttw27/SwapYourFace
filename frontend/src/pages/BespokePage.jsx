import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, MessageCircle, Mail, CheckCircle, Palette, Star, Sparkles, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WHATSAPP = 'https://wa.me/447822032847?text=' + encodeURIComponent("Hi! I'd like to discuss a bespoke character design 👋");

export default function BespokePage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', description: '', quantity: '' });
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState('');

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 5) { toast.error('Maximum 5 reference images'); return; }
    setPhotos(prev => [...prev, ...files]);
    setPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removePhoto = (i) => {
    setPhotos(prev => prev.filter((_,idx) => idx !== i));
    setPhotoPreviews(prev => prev.filter((_,idx) => idx !== i));
  };

  const handleWhatsApp = () => {
    if (!form.name.trim()) { toast.error('Please enter your name'); return; }
    const msg = `Hi! I'd like a bespoke character design 🎨

Name: ${form.name}
Phone: ${form.phone}
Email: ${form.email}
Quantity: ${form.quantity || 'Not sure yet'}

Description:
${form.description || 'Will discuss on WhatsApp'}

${photos.length > 0 ? `I have ${photos.length} reference image(s) to share!` : ''}`;
    window.open(`${WHATSAPP}&text=${encodeURIComponent(msg)}`, '_blank');
    setSubmitted('whatsapp');
  };

  const handleEmail = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Please enter your name and email'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('template', 'Bespoke Character Design');
      photos.forEach(p => fd.append('photo', p));
      const r = await fetch(`${API}/custom-order`, { method: 'POST', body: fd });
      if (!r.ok) throw new Error();
      setSubmitted('email');
    } catch(e) {
      toast.error('Failed to send — please try WhatsApp instead');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-['Anton'] text-2xl text-[#252A34] mb-2 tracking-wide">
            {submitted === 'email' ? 'ENQUIRY SENT!' : 'WHATSAPP OPENED!'}
          </h2>
          <p className="text-gray-500 mb-6">
            {submitted === 'email'
              ? "We've received your bespoke enquiry and will be in touch as soon as possible to discuss your design."
              : "We've pre-filled a message with your details — just send it and attach your reference images!"}
          </p>
          <div className="space-y-3">
            <Link to="/"><Button className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-4 font-bold uppercase tracking-wider">Back to Home</Button></Link>
            <Link to="/gallery"><Button variant="outline" className="w-full rounded-full py-4">Browse Templates</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <SEOHead
        title="Bespoke Custom Character T-Shirts"
        description="Want a completely unique custom character on your t-shirt? We design bespoke illustrated characters from scratch — perfect for stag dos, hen parties and birthdays. Upload reference images and we'll create something one-of-a-kind."
        keywords="bespoke character t-shirt, custom illustrated t-shirt UK, custom cartoon t-shirt stag do, unique party t-shirts, bespoke t-shirt design UK"
        url="/bespoke"
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#252A34] to-[#1a1e26] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
            <span className="inline-block bg-[#FF2E63] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">Bespoke Character Design</span>
            <h1 className="font-['Anton'] text-4xl sm:text-5xl text-white mb-4 tracking-wide">COMPLETELY CUSTOM CHARACTER T-SHIRTS</h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">Want something truly unique? We can design a completely bespoke illustrated character from scratch — or modify an existing template with different skin tones, clothing, or styling to make it perfect for your group.</p>
          </motion.div>
        </div>
      </section>

      {/* What we can do */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="font-['Anton'] text-2xl text-[#252A34] tracking-wide text-center mb-8">WHAT WE CAN CREATE FOR YOU</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: 'Brand New Character', desc: 'A completely original illustrated character based on your ideas, reference images or descriptions. Unique to you.' },
              { icon: Palette, title: 'Modified Template', desc: "Like one of our existing templates but want different skin tones, clothing colour or styling? We can adapt it to suit your group." },
              { icon: Star, title: 'Special Theme', desc: 'A specific job, hobby, sport, TV character style or theme that doesn\'t exist in our standard library — we\'ll create it.' },
            ].map((s, i) => (
              <div key={i} className="text-center p-6 bg-[#F7F7F7] rounded-2xl">
                <div className="w-12 h-12 bg-[#FF2E63]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-6 h-6 text-[#FF2E63]" />
                </div>
                <h3 className="font-bold text-[#252A34] mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 bg-[#F7F7F7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="font-['Anton'] text-2xl text-[#252A34] tracking-wide text-center mb-8">HOW IT WORKS</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { n:'1', title:'Get in touch', desc:'Fill in the form below and upload any reference images that inspire you' },
              { n:'2', title:'We discuss', desc:'We\'ll contact you to discuss your ideas, pricing and timeline' },
              { n:'3', title:'We design', desc:'Our illustrator creates your character and sends a proof for approval' },
              { n:'4', title:'We print', desc:'Once you\'re happy we print and deliver free to your door' },
            ].map(s => (
              <div key={s.n} className="text-center">
                <div className="w-10 h-10 bg-[#FF2E63] text-white rounded-full flex items-center justify-center font-bold mx-auto mb-3">{s.n}</div>
                <p className="font-bold text-[#252A34] mb-1 text-sm">{s.title}</p>
                <p className="text-gray-500 text-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-5">
          <h2 className="font-['Anton'] text-2xl text-[#252A34] tracking-wide">TELL US ABOUT YOUR DESIGN</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Your Name <span className="text-[#FF2E63]">*</span></Label><Input value={form.name} onChange={e=>setF('name',e.target.value)} placeholder="Your name" className="mt-1"/></div>
            <div><Label>Phone Number</Label><Input type="tel" value={form.phone} onChange={e=>setF('phone',e.target.value)} placeholder="07911 123456" className="mt-1"/></div>
          </div>
          <div><Label>Email <span className="text-[#FF2E63]">*</span></Label><Input type="email" value={form.email} onChange={e=>setF('email',e.target.value)} placeholder="your@email.com" className="mt-1"/></div>
          <div><Label>How many shirts do you need?</Label><Input value={form.quantity} onChange={e=>setF('quantity',e.target.value)} placeholder="e.g. 12 for a stag do" className="mt-1"/></div>

          <div>
            <Label>Describe your design idea <span className="text-[#FF2E63]">*</span></Label>
            <Textarea value={form.description} onChange={e=>setF('description',e.target.value)} rows={5}
              placeholder="Tell us as much as you can — the character style, theme, clothing, colours, skin tone, any specific details. The more detail the better!"
              className="mt-1"/>
          </div>

          {/* Reference image upload */}
          <div>
            <Label>Reference Images (optional — up to 5)</Label>
            <p className="text-xs text-gray-400 mb-2">Upload any images that inspire you — character styles, clothing references, colour swatches, existing designs you like etc.</p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-5 cursor-pointer hover:border-[#FF2E63] transition-colors">
              <Upload className="w-6 h-6 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Click to upload reference images</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 5 images</p>
              <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
            </label>
            {photoPreviews.length > 0 && (
              <div className="flex gap-3 mt-3 flex-wrap">
                {photoPreviews.map((p, i) => (
                  <div key={i} className="relative">
                    <img src={p} alt={`ref ${i+1}`} className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                    <button onClick={() => removePhoto(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-[#FF2E63]">
                    <Plus className="w-5 h-5 text-gray-300" />
                    <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
                  </label>
                )}
              </div>
            )}
          </div>

          <div className="p-4 bg-[#FFF9E6] border border-[#FFE600] rounded-xl text-sm text-gray-600">
            <p className="font-bold text-[#1C1C1C] mb-1">💡 Can't upload images right now?</p>
            <p>No problem — send us a WhatsApp message and you can share your reference images directly in the chat!</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Button onClick={handleWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#20b958] text-white rounded-full py-5 font-bold uppercase tracking-wider gap-2">
              <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
            </Button>
            <Button onClick={handleEmail} disabled={submitting} variant="outline"
              className="w-full rounded-full py-5 font-bold uppercase tracking-wider gap-2 border-[#252A34] text-[#252A34] hover:bg-[#252A34] hover:text-white">
              <Mail className="w-5 h-5" /> {submitting ? 'Sending...' : 'Send Enquiry'}
            </Button>
          </div>
          <p className="text-xs text-center text-gray-400">WhatsApp is fastest — we typically respond within the hour during business hours</p>
        </div>
      </div>
    </div>
  );
}
