import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { Upload, ChevronLeft, ChevronRight, CheckCircle, MessageCircle, Mail, Shirt, Users } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SIZES = ['XS','S','M','L','XL','2XL','3XL'];

export default function DoItForMePage() {
  const { templates, fetchTemplates, pricing, fetchPricing } = useStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=pick template, 2=details & sizes, 3=confirm
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filter, setFilter] = useState('all');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    title: '', subtitle: '', backName: '',
    notes: '',
  });
  const [sizes, setSizes] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (templates.length === 0) fetchTemplates();
    fetchPricing();
  }, []);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const totalQty = Object.values(sizes).reduce((s, q) => s + q, 0);

  const getTierPrice = (qty) => {
    const tiers = pricing.tiers || [];
    for (const t of [...tiers].sort((a,b) => a.min_qty - b.min_qty)) {
      if (qty >= t.min_qty && qty <= t.max_qty) return t.price;
    }
    return tiers.length ? tiers[tiers.length-1].price : 17.99;
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmitWhatsApp = () => {
    if (!form.name.trim() || !form.phone.trim()) { toast.error('Please enter your name and phone'); return; }
    const sizeList = Object.entries(sizes).filter(([,q])=>q>0).map(([s,q])=>`${s}×${q}`).join(', ');
    const msg = `Hi! I'd like to place a custom order 👋

Name: ${form.name}
Phone: ${form.phone}
Email: ${form.email}

Template: ${selectedTemplate?.name || 'Not selected'}
Title text: ${form.title || 'None'}
Subtitle: ${form.subtitle || 'None'}
Back name: ${form.backName || 'None'}
Sizes: ${sizeList || 'Not specified'}
Total qty: ${totalQty}
Notes: ${form.notes || 'None'}

${photo ? 'I have my photo ready to send!' : ''}`;
    window.open(`https://wa.me/447822032847?text=${encodeURIComponent(msg)}`, '_blank');
    setSubmitted(true);
  };

  const handleSubmitEmail = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Please enter your name and email'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      const sizeList = Object.entries(sizes).filter(([,q])=>q>0).map(([s,q])=>`${s}×${q}`).join(', ');
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('template', selectedTemplate?.name || '');
      fd.append('quantity', totalQty.toString());
      fd.append('notes', `Title: ${form.title}\nSubtitle: ${form.subtitle}\nBack name: ${form.backName}\nSizes: ${sizeList}\n\n${form.notes}`);
      if (photo) fd.append('photo', photo);
      const r = await fetch(`${API}/custom-order`, { method: 'POST', body: fd });
      if (!r.ok) throw new Error();
      setSubmitted(true);
    } catch(e) {
      toast.error('Failed to send — please try WhatsApp instead');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTemplates = templates.filter(t => {
    const cats = t.categories || [t.category];
    return filter === 'all' || cats.includes(filter);
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-['Anton'] text-2xl text-[#252A34] mb-2 tracking-wide">ENQUIRY SENT!</h2>
          <p className="text-gray-500 mb-6">We'll be in touch as soon as possible to confirm your order and get started on the design.</p>
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
      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => step > 1 ? setStep(s=>s-1) : navigate('/builder')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <h1 className="font-['Anton'] text-2xl sm:text-3xl text-[#252A34] tracking-wide">DO IT FOR ME</h1>
              <p className="text-gray-500 text-sm">Tell us what you want — we'll design and send you a proof</p>
            </div>
          </div>
          {/* Step bar */}
          <div className="flex items-center gap-2">
            {['Pick Template','Your Details','Confirm'].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${step > i+1 ? 'bg-green-100 text-green-700' : step === i+1 ? 'bg-[#FF2E63] text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold">
                    {step > i+1 ? '✓' : i+1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < 2 && <ChevronRight className="w-3 h-3 text-gray-300" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Step 1 — Pick template */}
        {step === 1 && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
            <div className="flex gap-2 mb-6 flex-wrap">
              {['all','stag','hen'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter===f?'bg-[#FF2E63] text-white':'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
                  {f === 'all' ? 'All' : f === 'stag' ? 'Stag Do' : 'Hen Party'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTemplates.map(t => (
                <button key={t.id} onClick={() => { setSelectedTemplate(t); setStep(2); }}
                  className={`bg-white rounded-2xl overflow-hidden border-2 transition-all text-left hover:shadow-md ${selectedTemplate?.id===t.id?'border-[#FF2E63] shadow-md':'border-gray-100'}`}>
                  <div className="aspect-square bg-gray-50 overflow-hidden">
                    <img src={t.product_image_url || t.body_image_url} alt={t.name}
                      className="w-full h-full object-contain p-2" crossOrigin="anonymous" />
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-[#252A34] text-sm truncate">{t.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{(t.categories||[t.category])[0]}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2 — Details */}
        {step === 2 && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="grid lg:grid-cols-2 gap-6">
            {/* Template preview */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">SELECTED TEMPLATE</h2>
                <button onClick={() => setStep(1)} className="text-sm text-[#FF2E63] hover:underline">Change</button>
              </div>
              {selectedTemplate && (
                <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3">
                  <img src={selectedTemplate.product_image_url || selectedTemplate.body_image_url}
                    alt={selectedTemplate.name} className="w-full h-full object-contain p-4" crossOrigin="anonymous" />
                </div>
              )}
              <p className="font-bold text-[#252A34]">{selectedTemplate?.name}</p>

              {/* Photo upload */}
              <div className="mt-4">
                <Label className="font-bold text-[#252A34]">Upload Your Photo</Label>
                <p className="text-xs text-gray-400 mb-2">We'll cut out the face and place it on the template</p>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#FF2E63] transition-colors">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover mb-2" />
                  ) : (
                    <Upload className="w-8 h-8 text-gray-300 mb-2" />
                  )}
                  <p className="text-sm text-gray-500">{photo ? photo.name : 'Click to upload photo'}</p>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Details form */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">YOUR DETAILS</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Name <span className="text-[#FF2E63]">*</span></Label><Input value={form.name} onChange={e=>setF('name',e.target.value)} placeholder="Your name" className="mt-1"/></div>
                  <div><Label>Phone <span className="text-[#FF2E63]">*</span></Label><Input value={form.phone} onChange={e=>setF('phone',e.target.value)} placeholder="07911 123456" className="mt-1"/></div>
                </div>
                <div><Label>Email <span className="text-[#FF2E63]">*</span></Label><Input type="email" value={form.email} onChange={e=>setF('email',e.target.value)} placeholder="your@email.com" className="mt-1"/></div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">TEXT ON SHIRT</h2>
                <div><Label>Main Title (e.g. "DAVE'S STAG DO")</Label><Input value={form.title} onChange={e=>setF('title',e.target.value)} placeholder="e.g. DAVE'S STAG DO" className="mt-1"/></div>
                <div><Label>Subtitle (e.g. "BENIDORM 2025")</Label><Input value={form.subtitle} onChange={e=>setF('subtitle',e.target.value)} placeholder="e.g. BENIDORM 2025" className="mt-1"/></div>
                <div><Label>Back Name (£2.50 extra per shirt)</Label><Input value={form.backName} onChange={e=>setF('backName',e.target.value)} placeholder="e.g. The Groom" className="mt-1"/></div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">SIZES</h2>
                {totalQty > 0 && (
                  <div className="p-3 bg-[#FFF9E6] border border-[#FFE600] rounded-xl text-sm">
                    <span className="font-bold text-[#252A34]">{totalQty} shirt{totalQty!==1?'s':''} — </span>
                    <span className="text-[#FF2E63] font-bold">£{getTierPrice(totalQty).toFixed(2)} each</span>
                    {pricing.tiers && (() => {
                      const next = [...pricing.tiers].sort((a,b)=>a.min_qty-b.min_qty).find(t=>t.min_qty>totalQty);
                      return next ? <span className="text-gray-500"> · Add {next.min_qty-totalQty} more for £{next.price.toFixed(2)}/shirt</span> : null;
                    })()}
                  </div>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {SIZES.map(size => (
                    <div key={size} className="flex flex-col items-center gap-1">
                      <span className="text-xs font-bold text-gray-500">{size}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSizes(s=>({...s,[size]:Math.max(0,(s[size]||0)-1)}))}
                          className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs">-</button>
                        <span className="w-6 text-center text-sm font-bold">{sizes[size]||0}</span>
                        <button onClick={() => setSizes(s=>({...s,[size]:(s[size]||0)+1}))}
                          className="w-6 h-6 rounded-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white flex items-center justify-center text-xs">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <Label className="font-bold text-[#252A34]">Any other notes?</Label>
                <Textarea value={form.notes} onChange={e=>setF('notes',e.target.value)} placeholder="Anything else we should know..." rows={3} className="mt-1"/>
              </div>

              <Button onClick={() => {
                if (!form.name.trim()) { toast.error('Please enter your name'); return; }
                setStep(3);
              }} className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-5 font-bold uppercase tracking-wider">
                Continue <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3 — Confirm & send */}
        {step === 3 && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3">
              <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">ORDER SUMMARY</h2>
              <div className="flex gap-4">
                {selectedTemplate && (
                  <img src={selectedTemplate.product_image_url || selectedTemplate.body_image_url}
                    alt={selectedTemplate.name} className="w-20 h-20 object-contain bg-gray-50 rounded-xl p-1" crossOrigin="anonymous" />
                )}
                <div className="text-sm space-y-1 text-gray-600">
                  <p><strong>Template:</strong> {selectedTemplate?.name}</p>
                  <p><strong>Title:</strong> {form.title || 'None'}</p>
                  <p><strong>Subtitle:</strong> {form.subtitle || 'None'}</p>
                  <p><strong>Back name:</strong> {form.backName || 'None'}</p>
                  <p><strong>Sizes:</strong> {Object.entries(sizes).filter(([,q])=>q>0).map(([s,q])=>`${s}×${q}`).join(', ') || 'None selected'}</p>
                  <p><strong>Total qty:</strong> {totalQty} shirts {totalQty>0&&<span className="text-[#FF2E63] font-bold">@ £{getTierPrice(totalQty).toFixed(2)}/shirt</span>}</p>
                </div>
              </div>
              {photoPreview && (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <img src={photoPreview} alt="Photo" className="w-10 h-10 rounded-full object-cover" />
                  <p className="text-sm text-green-700 font-medium">Photo attached ✓</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3">
              <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">HOW WOULD YOU LIKE TO SEND?</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <Button onClick={handleSubmitWhatsApp}
                  className="w-full bg-[#25D366] hover:bg-[#20b958] text-white rounded-full py-5 font-bold uppercase tracking-wider gap-2">
                  <MessageCircle className="w-5 h-5" /> Send via WhatsApp
                </Button>
                <Button onClick={handleSubmitEmail} disabled={submitting} variant="outline"
                  className="w-full rounded-full py-5 font-bold uppercase tracking-wider gap-2 border-[#252A34] text-[#252A34] hover:bg-[#252A34] hover:text-white">
                  <Mail className="w-5 h-5" /> {submitting ? 'Sending...' : 'Send Enquiry'}
                </Button>
              </div>
              <p className="text-xs text-center text-gray-400">WhatsApp is fastest — we typically respond within the hour</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
