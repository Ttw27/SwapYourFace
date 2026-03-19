import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Upload, X, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ─── Static reviews — add real ones here or load from backend ─────────────────
const FEATURED_REVIEWS = [
  { id: 1, name: 'Sarah M.', location: 'Manchester', rating: 5, event: 'Hen Party', text: 'Absolutely hilarious! The whole hen party were in stitches when they saw the shirts. The face cutout was spot on and the quality was brilliant. Will definitely order again for our next party!', verified: true },
  { id: 2, name: 'James T.', location: 'Birmingham', rating: 5, event: 'Stag Do', text: 'Ordered 12 shirts for my stag do in Benidorm. The process was dead easy, the proof came back quickly and they made a couple of small adjustments for us no problem. Arrived well within the time stated. Lads absolutely loved them.', verified: true },
  { id: 3, name: 'Emma K.', location: 'Leeds', rating: 5, event: 'Hen Party', text: 'Made our hen do extra special. Everyone wanted to know where we got them from! The brightness adjustment tool is a great touch — our photo came out perfect even though the original was a bit dark.', verified: true },
  { id: 4, name: 'Ryan B.', location: 'London', rating: 5, event: 'Birthday Party', text: "Got these made for my mate's 40th birthday surprise. He genuinely had no idea and the look on his face was priceless. The design team sent a proof within a day and it was perfect first time.", verified: true },
  { id: 5, name: 'Claire D.', location: 'Bristol', rating: 5, event: 'Hen Party', text: "Ordered on a Tuesday and they arrived by Friday — faster than expected! The shirts themselves are great quality, not cheap and thin like you might expect. The prints are vibrant and haven't faded after washing.", verified: true },
  { id: 6, name: 'Tom W.', location: 'Newcastle', rating: 5, event: 'Stag Do', text: 'Used the hip hop king template for our stag do. The lads looked absolutely ridiculous in the best possible way. Customer service was top notch — responded to my WhatsApp within the hour.', verified: true },
];

const StarRating = ({ rating, size = 'sm' }) => {
  const s = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`${s} ${i <= rating ? 'fill-[#FFE600] text-[#FFE600]' : 'text-gray-200'}`} />
      ))}
    </div>
  );
};

const ReviewCard = ({ review, delay = 0 }) => (
  <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay }}
    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="font-bold text-[#252A34]">{review.name}</p>
        <p className="text-xs text-gray-400">{review.location} · {review.event}</p>
      </div>
      {review.verified && (
        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium border border-green-200">✓ Verified</span>
      )}
    </div>
    <StarRating rating={review.rating} />
    <p className="text-gray-600 text-sm mt-3 flex-1 leading-relaxed">"{review.text}"</p>
  </motion.div>
);

// ─── Submit Review Form ───────────────────────────────────────────────────────
const SubmitReviewForm = ({ onClose }) => {
  const [form, setForm] = useState({ name:'', location:'', event:'', rating:5, text:'' });
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.text.trim()) { toast.error('Please fill in your name and review'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      if (photo) fd.append('photo', photo);
      await fetch(`${API}/reviews`, { method:'POST', body:fd });
      toast.success('Thanks for your review! It will appear once approved.');
      onClose();
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background:'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-['Anton'] text-lg text-[#252A34] tracking-wide">LEAVE A REVIEW</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-500"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Your Name</Label><Input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Sarah M." className="mt-1"/></div>
            <div><Label>Location</Label><Input value={form.location} onChange={e=>set('location',e.target.value)} placeholder="e.g. Manchester" className="mt-1"/></div>
          </div>
          <div><Label>Event Type</Label>
            <select value={form.event} onChange={e=>set('event',e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF2E63]/20">
              <option value="">Select...</option>
              {['Stag Do','Hen Party','Birthday Party','Work Event','Other'].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <Label className="mb-2 block">Rating</Label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(i=>(
                <button key={i} onClick={()=>set('rating',i)}>
                  <Star className={`w-8 h-8 ${i<=form.rating?'fill-[#FFE600] text-[#FFE600]':'text-gray-200'} transition-colors`}/>
                </button>
              ))}
            </div>
          </div>
          <div><Label>Your Review</Label><Textarea value={form.text} onChange={e=>set('text',e.target.value)} placeholder="Tell us about your experience..." rows={4} className="mt-1"/></div>
          <div>
            <Label className="mb-1 block">Photo (optional — shows on our website)</Label>
            {photo ? (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img src={URL.createObjectURL(photo)} alt="preview" className="w-12 h-12 rounded-lg object-cover"/>
                <p className="text-sm text-gray-600 flex-1 truncate">{photo.name}</p>
                <button onClick={()=>setPhoto(null)} className="text-red-400"><X className="w-4 h-4"/></button>
              </div>
            ) : (
              <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#FF2E63] transition-colors">
                <Upload className="w-5 h-5 text-gray-400"/>
                <span className="text-sm text-gray-500">Upload a photo of your shirts</span>
                <input type="file" accept="image/*" className="hidden" onChange={e=>setPhoto(e.target.files?.[0]||null)}/>
              </label>
            )}
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-5 font-bold uppercase tracking-wider">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReviewsPage() {
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = ['all','Stag Do','Hen Party','Birthday Party'];
  const filtered = activeFilter === 'all' ? FEATURED_REVIEWS : FEATURED_REVIEWS.filter(r => r.event === activeFilter);

  const avgRating = (FEATURED_REVIEWS.reduce((s,r)=>s+r.rating,0) / FEATURED_REVIEWS.length).toFixed(1);

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {showForm && <SubmitReviewForm onClose={()=>setShowForm(false)}/>}

      {/* Hero */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="text-center">
            <h1 className="font-['Anton'] text-4xl sm:text-5xl text-[#252A34] mb-4 tracking-wide">CUSTOMER REVIEWS</h1>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">Real parties. Real people. Real reactions.</p>
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="text-center">
                <p className="font-['Anton'] text-5xl text-[#FF2E63]">{avgRating}</p>
                <StarRating rating={5} size="md"/>
                <p className="text-xs text-gray-400 mt-1">{FEATURED_REVIEWS.length} reviews</p>
              </div>
            </div>
            <Button onClick={()=>setShowForm(true)} className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-8 py-5 font-bold uppercase tracking-wider">
              Leave a Review
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-gray-100 py-4 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 flex-wrap justify-center">
          {filters.map(f=>(
            <button key={f} onClick={()=>setActiveFilter(f)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeFilter===f?'bg-[#FF2E63] text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'all' ? 'All Reviews' : f}
            </button>
          ))}
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((review, i) => <ReviewCard key={review.id} review={review} delay={i*0.05}/>)}
          </div>
        </div>
      </section>

      {/* Customer Photos section — placeholder, admin uploads via backend */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-10">
            <h2 className="font-['Anton'] text-3xl sm:text-4xl text-[#252A34] tracking-wide mb-3">HAPPY CUSTOMERS</h2>
            <p className="text-gray-500">Tag us on Instagram <span className="text-[#FF2E63] font-medium">@swapmyfacetees</span> to be featured here</p>
          </motion.div>
          {/* Photo grid — these would be loaded from backend/admin uploads */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_,i)=>(
              <div key={i} className="aspect-square bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center">
                <p className="text-xs text-gray-300 text-center px-2">Customer photo coming soon</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#252A34]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
            <h2 className="font-['Anton'] text-3xl sm:text-4xl text-white mb-4 tracking-wide">READY TO CREATE YOURS?</h2>
            <p className="text-gray-400 mb-8">Join hundreds of happy party-goers</p>
            <Link to="/builder">
              <Button className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-10 py-6 text-lg font-bold uppercase tracking-wider">
                Start Creating
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
