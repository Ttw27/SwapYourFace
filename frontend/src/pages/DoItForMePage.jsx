import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { Upload, ChevronLeft, ChevronRight, CheckCircle, ShoppingCart, Loader2, Plus, Minus } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SIZES = ['XS','S','M','L','XL','2XL','3XL'];

export default function DoItForMePage() {
  const { templates, fetchTemplates, pricing, fetchPricing } = useStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filter, setFilter] = useState('all');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    title: '', subtitle: '', notes: '',
  });
  const [sizes, setSizes] = useState({});
  // Back names: array of { size, index, name }
  const [backNames, setBackNames] = useState([]);
  const [hasBackPrint, setHasBackPrint] = useState(false);

  useEffect(() => {
    if (templates.length === 0) fetchTemplates();
    fetchPricing();
  }, []);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Generate back name slots from sizes
  useEffect(() => {
    if (!hasBackPrint) { setBackNames([]); return; }
    const slots = [];
    SIZES.forEach(size => {
      const qty = sizes[size] || 0;
      for (let i = 0; i < qty; i++) {
        const existing = backNames.find(b => b.size === size && b.index === i);
        slots.push({ size, index: i, name: existing?.name || '' });
      }
    });
    setBackNames(slots);
  }, [sizes, hasBackPrint]);

  const updateBackName = (size, index, name) => {
    setBackNames(prev => prev.map(b => b.size === size && b.index === index ? { ...b, name } : b));
  };

  const totalQty = Object.values(sizes).reduce((s, q) => s + q, 0);

  const getTierPrice = (qty) => {
    const tiers = pricing.tiers || [];
    for (const t of [...tiers].sort((a,b) => a.min_qty - b.min_qty)) {
      if (qty >= t.min_qty && qty <= t.max_qty) return t.price;
    }
    return tiers.length ? tiers[tiers.length-1].price : 17.99;
  };

  const backPrintPrice = pricing.back_print_price || 2.50;
  const pricePerShirt = getTierPrice(totalQty);
  const subtotal = totalQty * pricePerShirt + (hasBackPrint ? totalQty * backPrintPrice : 0);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    // Upload photo immediately
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch(`${API}/upload/photo`, { method: 'POST', body: fd });
      if (r.ok) {
        const data = await r.json();
        setUploadedPhotoUrl(data.original_url || data.head_url || '');
      }
    } catch(e) {
      console.error('Photo upload failed', e);
    } finally {
      setUploading(false);
    }
  };

  const handleCheckout = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error('Please enter your name, email and phone'); return;
    }
    if (totalQty === 0) { toast.error('Please select at least one shirt size'); return; }
    if (!selectedTemplate) { toast.error('Please select a template'); return; }

    setIsLoading(true);
    try {
      // Build order items
      const items = [];
      SIZES.forEach(size => {
        const qty = sizes[size] || 0;
        if (qty === 0) return;
        const namesForSize = backNames.filter(b => b.size === size).map(b => b.name);
        items.push({
          templateName: selectedTemplate.name,
          templateId: selectedTemplate.id,
          size,
          quantity: qty,
          price: pricePerShirt,
          hasBackPrint,
          backPrice: hasBackPrint ? backPrintPrice : 0,
          backNames: namesForSize,
          headUrl: uploadedPhotoUrl,
          titleText: form.title,
          subtitleText: form.subtitle,
          orderType: 'do_it_for_me',
          shirtType: 'unisex',
        });
      });

      // Create order
      const orderRes = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          items,
          total_amount: subtotal,
          order_type: 'do_it_for_me',
          notes: form.notes,
          gdpr_consent: true,
        })
      });
      if (!orderRes.ok) throw new Error('Failed to create order');
      const order = await orderRes.json();

      // Create Stripe checkout
      const checkoutRes = await fetch(`${API}/payments/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          order_id: order.id,
          customer_email: form.email,
          success_url: `${window.location.origin}/cart`,
          cancel_url: `${window.location.origin}/do-it-for-me`,
        })
      });
      if (!checkoutRes.ok) throw new Error('Failed to create checkout');
      const { checkout_url } = await checkoutRes.json();
      sessionStorage.setItem('smf_order_total', subtotal.toFixed(2));
      window.location.href = checkout_url;
    } catch(e) {
      toast.error('Something went wrong — please try again');
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t => {
    const cats = t.categories || [t.category];
    return filter === 'all' || cats.includes(filter);
  });

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 mb-3">
            <button onClick={() => step > 1 ? setStep(s=>s-1) : navigate('/builder')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <h1 className="font-['Anton'] text-2xl sm:text-3xl text-[#252A34] tracking-wide">DO IT FOR ME</h1>
              <p className="text-gray-500 text-sm">We'll design it — you pay & we send a proof before printing</p>
            </div>
          </div>
          {/* Step bar */}
          <div className="flex items-center gap-2">
            {['Pick Template','Your Details','Review & Pay'].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${step > i+1 ? 'bg-green-100 text-green-700' : step === i+1 ? 'bg-[#FF2E63] text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <span>{step > i+1 ? '✓' : i+1}</span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < 2 && <ChevronRight className="w-3 h-3 text-gray-300" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">

          {/* ── Step 1: Pick template ── */}
          {step === 1 && (
            <motion.div key="s1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}>
              <div className="flex gap-2 mb-6 flex-wrap">
                {[['all','All'],['stag','Stag Do'],['hen','Hen Party'],['party','Party']].map(([val,label]) => (
                  <button key={val} onClick={() => setFilter(val)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter===val?'bg-[#FF2E63] text-white':'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
                    {label}
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

          {/* ── Step 2: Details ── */}
          {step === 2 && (
            <motion.div key="s2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}>
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Left: template preview + photo */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">YOUR TEMPLATE</h2>
                      <button onClick={() => setStep(1)} className="text-sm text-[#FF2E63] hover:underline">Change</button>
                    </div>
                    {selectedTemplate && (
                      <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden">
                        <img src={selectedTemplate.product_image_url || selectedTemplate.body_image_url}
                          alt={selectedTemplate.name} className="w-full h-full object-contain p-4" crossOrigin="anonymous" />
                      </div>
                    )}
                    <p className="font-bold text-[#252A34] mt-2">{selectedTemplate?.name}</p>
                  </div>

                  {/* Photo upload */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide mb-1">YOUR PHOTO</h2>
                    <p className="text-xs text-gray-400 mb-3">We'll cut out the face and place it on the template for you</p>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-5 cursor-pointer hover:border-[#FF2E63] transition-colors">
                      {photoPreview ? (
                        <div className="flex items-center gap-3">
                          <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">{photo?.name}</p>
                            {uploading && <p className="text-xs text-gray-400">Uploading...</p>}
                            {!uploading && uploadedPhotoUrl && <p className="text-xs text-green-600">✓ Uploaded</p>}
                            <p className="text-xs text-[#FF2E63] mt-1">Click to change</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-300 mb-2" />
                          <p className="text-sm font-medium text-gray-500">Click to upload photo</p>
                          <p className="text-xs text-gray-400 mt-1">JPG, PNG — clear front-facing photo works best</p>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Right: form */}
                <div className="space-y-4">
                  {/* Contact details */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                    <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">YOUR DETAILS</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><Label>Name <span className="text-[#FF2E63]">*</span></Label><Input value={form.name} onChange={e=>setF('name',e.target.value)} placeholder="Your name" className="mt-1"/></div>
                      <div><Label>Phone <span className="text-[#FF2E63]">*</span></Label><Input value={form.phone} onChange={e=>setF('phone',e.target.value)} placeholder="07911 123456" className="mt-1"/></div>
                    </div>
                    <div><Label>Email <span className="text-[#FF2E63]">*</span></Label><Input type="email" value={form.email} onChange={e=>setF('email',e.target.value)} placeholder="your@email.com" className="mt-1"/><p className="text-xs text-gray-400 mt-1">Your proof will be sent here</p></div>
                  </div>

                  {/* Text on shirt */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                    <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">TEXT ON SHIRT</h2>
                    <div><Label>Main Title</Label><Input value={form.title} onChange={e=>setF('title',e.target.value)} placeholder="e.g. DAVE'S STAG DO" className="mt-1"/></div>
                    <div><Label>Subtitle</Label><Input value={form.subtitle} onChange={e=>setF('subtitle',e.target.value)} placeholder="e.g. BENIDORM 2025" className="mt-1"/></div>
                  </div>

                  {/* Sizes */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                    <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">SIZES</h2>
                    {totalQty > 0 && (
                      <div className="p-3 bg-[#FFF9E6] border border-[#FFE600] rounded-xl text-sm">
                        <span className="font-bold text-[#252A34]">{totalQty} shirt{totalQty!==1?'s':''} — </span>
                        <span className="text-[#FF2E63] font-bold">£{pricePerShirt.toFixed(2)} each</span>
                        {pricing.tiers && (() => {
                          const next = [...(pricing.tiers||[])].sort((a,b)=>a.min_qty-b.min_qty).find(t=>t.min_qty>totalQty);
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
                              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs font-bold">-</button>
                            <span className="w-6 text-center text-sm font-bold">{sizes[size]||0}</span>
                            <button onClick={() => setSizes(s=>({...s,[size]:(s[size]||0)+1}))}
                              className="w-6 h-6 rounded-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white flex items-center justify-center text-xs font-bold">+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Back print */}
                  {totalQty > 0 && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">BACK NAMES</h2>
                          <p className="text-xs text-gray-400">+£{backPrintPrice.toFixed(2)} per shirt</p>
                        </div>
                        <button onClick={() => setHasBackPrint(!hasBackPrint)}
                          className={`relative inline-flex flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${hasBackPrint?'bg-[#FF2E63]':'bg-gray-200'}`}>
                          <span className={`inline-block w-5 h-5 mt-0.5 bg-white rounded-full shadow transform transition-transform duration-200 ${hasBackPrint?'translate-x-5':'translate-x-0.5'}`}/>
                        </button>
                      </div>
                      {hasBackPrint && backNames.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {backNames.map((b, i) => (
                            <div key={`${b.size}-${b.index}`} className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500 w-8 flex-shrink-0">{b.size}</span>
                              <Input
                                value={b.name}
                                onChange={e => updateBackName(b.size, b.index, e.target.value)}
                                placeholder={`Back name for shirt ${i+1}`}
                                className="text-sm h-8"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <Label className="font-bold text-[#252A34]">Any other notes?</Label>
                    <Textarea value={form.notes} onChange={e=>setF('notes',e.target.value)}
                      placeholder="Skin tone preferences, colour requests, anything else we should know..." rows={3} className="mt-1"/>
                  </div>

                  <Button onClick={() => {
                    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) { toast.error('Please fill in your details'); return; }
                    if (totalQty === 0) { toast.error('Please select at least one size'); return; }
                    setStep(3);
                  }} className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-5 font-bold uppercase tracking-wider">
                    Review Order <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Review & Pay ── */}
          {step === 3 && (
            <motion.div key="s3" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="max-w-2xl mx-auto space-y-5">
              {/* Template & photo */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-['Anton'] text-lg text-[#252A34] tracking-wide mb-4">ORDER REVIEW</h2>
                <div className="flex gap-4 mb-4">
                  {selectedTemplate && (
                    <img src={selectedTemplate.product_image_url || selectedTemplate.body_image_url}
                      alt={selectedTemplate.name} className="w-20 h-20 object-contain bg-gray-50 rounded-xl p-1 flex-shrink-0" crossOrigin="anonymous" />
                  )}
                  <div className="text-sm space-y-1 text-gray-600">
                    <p><strong className="text-[#252A34]">Template:</strong> {selectedTemplate?.name}</p>
                    <p><strong className="text-[#252A34]">Name:</strong> {form.name}</p>
                    <p><strong className="text-[#252A34]">Email:</strong> {form.email}</p>
                    <p><strong className="text-[#252A34]">Phone:</strong> {form.phone}</p>
                    {form.title && <p><strong className="text-[#252A34]">Title:</strong> {form.title}</p>}
                    {form.subtitle && <p><strong className="text-[#252A34]">Subtitle:</strong> {form.subtitle}</p>}
                  </div>
                </div>
                {photoPreview && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl mb-4">
                    <img src={photoPreview} alt="Photo" className="w-10 h-10 rounded-full object-cover" />
                    <p className="text-sm text-green-700 font-medium">Photo uploaded ✓</p>
                  </div>
                )}
                {/* Sizes summary */}
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  {SIZES.filter(s => (sizes[s]||0) > 0).map(size => {
                    const names = backNames.filter(b=>b.size===size);
                    return (
                      <div key={size} className="flex items-start justify-between text-sm">
                        <div>
                          <span className="font-medium text-[#252A34]">{size} × {sizes[size]}</span>
                          {names.length > 0 && names.some(b=>b.name) && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {names.map((b,i) => b.name && <span key={i} className="mr-2">Back: {b.name}</span>)}
                            </div>
                          )}
                        </div>
                        <span className="text-gray-600">£{(pricePerShirt * (sizes[size]||0) + (hasBackPrint ? backPrintPrice * (sizes[size]||0) : 0)).toFixed(2)}</span>
                      </div>
                    );
                  })}
                  {hasBackPrint && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Back print (×{totalQty})</span>
                      <span>included above</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span className="text-[#FF2E63]">£{subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* What happens next */}
              <div className="bg-[#FFF9E6] border border-[#FFE600] rounded-2xl p-5">
                <p className="font-bold text-[#252A34] mb-2">What happens after you pay?</p>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal pl-4">
                  <li>We receive your order and design the shirt using your photo</li>
                  <li>We email you a digital proof to approve (usually within 24 hours)</li>
                  <li>Once you approve, we print and dispatch</li>
                  <li>Free UK delivery in 5–8 working days</li>
                </ol>
              </div>

              {/* Pay button */}
              <Button onClick={handleCheckout} disabled={isLoading}
                className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 text-lg font-bold uppercase tracking-wider gap-3">
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><ShoppingCart className="w-5 h-5" /> Pay Securely — £{subtotal.toFixed(2)}</>}
              </Button>

              {/* Stripe trust */}
              <div className="border border-gray-100 rounded-xl p-4 space-y-2 text-center">
                <p className="text-xs text-gray-500">🔒 Secured by Stripe — we never see or store your card details</p>
                <div className="flex items-center justify-center gap-3">
                  {['VISA','MC','AMEX','APPLE PAY'].map(c => (
                    <span key={c} className="text-xs font-bold text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">{c}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
