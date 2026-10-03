import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Upload, X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const REVIEWS_PER_PAGE = 9;

const StarRating = ({ rating, size = 'sm', interactive = false, onChange }) => {
  const s = size === 'sm' ? 'w-4 h-4' : 'w-8 h-8';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <button key={i} onClick={() => interactive && onChange?.(i)} disabled={!interactive}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}>
          <Star className={`${s} ${i <= rating ? 'fill-[#FFE600] text-[#FFE600]' : 'text-gray-200'} transition-colors`} />
        </button>
      ))}
    </div>
  );
};

// Pulls the full set of photos off a review, old single-photo reviews included.
const getReviewPhotos = (review) => {
  if (Array.isArray(review.photo_urls) && review.photo_urls.length > 0) return review.photo_urls;
  if (review.photo_url) return [review.photo_url];
  return [];
};

// ─── Swipeable image strip (shared by card + lightbox) ─────────────────────────
const SwipeGallery = ({ images, index, onIndexChange, children }) => {
  const touchStartX = useRef(null);

  const goTo = (i) => onIndexChange(((i % images.length) + images.length) % images.length);
  const prev = (e) => { e?.stopPropagation(); goTo(index - 1); };
  const next = (e) => { e?.stopPropagation(); goTo(index + 1); };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) delta > 0 ? prev() : next();
    touchStartX.current = null;
  };

  return (
    <div className="relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {children}
      {images.length > 1 && (
        <>
          <button onClick={prev} aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={next} aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); goTo(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Lightbox (swipeable across every photo on the review) ─────────────────────
const Lightbox = ({ images, alt, startIndex = 0, onClose }) => {
  const [index, setIndex] = useState(startIndex);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)' }}
      onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10">
        <X className="w-6 h-6" />
      </button>
      <div className="group max-w-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <SwipeGallery images={images} index={index} onIndexChange={setIndex}>
          <img src={images[index]} alt={alt} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            crossOrigin="anonymous" />
        </SwipeGallery>
      </div>
    </div>
  );
};

// ─── Review Card ──────────────────────────────────────────────────────────────
const ReviewCard = ({ review, delay = 0, onImageClick }) => {
  const photos = getReviewPhotos(review);
  const [index, setIndex] = useState(0);

  return (
    <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {photos.length > 0 && (
        <div className="group relative cursor-pointer" onClick={() => onImageClick(photos, review.name, index)}>
          <SwipeGallery images={photos} index={index} onIndexChange={setIndex}>
            <img src={photos[index]} alt={`${review.name}'s order`}
              className="w-full aspect-square object-cover"
              crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                <ZoomIn className="w-5 h-5 text-[#252A34]" />
              </div>
            </div>
          </SwipeGallery>
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-bold text-[#252A34]">{review.name}</p>
            <p className="text-xs text-gray-400">{review.location}{review.event ? ` · ${review.event}` : ''}</p>
          </div>
          {review.verified && (
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium border border-green-200 flex-shrink-0">✓ Verified</span>
          )}
        </div>
        <StarRating rating={review.rating} />
        <p className="text-gray-600 text-sm mt-3 flex-1 leading-relaxed">"{review.text}"</p>
      </div>
    </motion.div>
  );
};

// ─── Submit Form ──────────────────────────────────────────────────────────────
const MAX_REVIEW_PHOTOS = 5;

const SubmitReviewForm = ({ onClose, onSubmitted }) => {
  const [form, setForm] = useState({ name:'', location:'', event:'', rating:5, text:'' });
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addPhotos = (files) => {
    const next = [...photos, ...Array.from(files || [])].slice(0, MAX_REVIEW_PHOTOS);
    setPhotos(next);
  };
  const removePhoto = (i) => setPhotos(ps => ps.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.text.trim()) { toast.error('Please fill in your name and review'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, String(v)));
      photos.forEach(p => fd.append('photos', p));
      const res = await fetch(`${API}/reviews`, { method:'POST', body:fd });
      if (!res.ok) throw new Error('Submit failed');
      toast.success('Thanks for your review! It will appear once approved.');
      onSubmitted?.();
      onClose();
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    addPhotos(e.target.files);
    e.target.value = ''; // allow picking the same file again after removing it
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
            <div><Label>Your Name</Label><Input value={form.name} onChange={e=>setF('name',e.target.value)} placeholder="e.g. Sarah M." className="mt-1"/></div>
            <div><Label>Location</Label><Input value={form.location} onChange={e=>setF('location',e.target.value)} placeholder="e.g. Manchester" className="mt-1"/></div>
          </div>
          <div><Label>Event Type</Label>
            <select value={form.event} onChange={e=>setF('event',e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF2E63]/20">
              <option value="">Select...</option>
              {['Stag Do','Hen Party','Birthday Party','Work Event','Other'].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div><Label className="mb-2 block">Rating</Label><StarRating rating={form.rating} size="lg" interactive onChange={v=>setF('rating',v)}/></div>
          <div><Label>Your Review</Label><Textarea value={form.text} onChange={e=>setF('text',e.target.value)} placeholder="Tell us about your experience..." rows={4} className="mt-1"/></div>
          <div>
            <Label className="mb-1 block">Photos (optional — great for showing off your shirts! up to {MAX_REVIEW_PHOTOS})</Label>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden aspect-square">
                    <img src={URL.createObjectURL(p)} alt={`preview ${i+1}`} className="w-full h-full object-cover"/>
                    <button onClick={()=>removePhoto(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"><X className="w-3 h-3"/></button>
                  </div>
                ))}
              </div>
            )}
            {photos.length < MAX_REVIEW_PHOTOS && (
              <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#FF2E63] transition-colors">
                <Upload className="w-6 h-6 text-gray-400"/>
                <span className="text-sm text-gray-500 text-center">Upload photo(s) of your group in the shirts</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange}/>
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
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [lightbox, setLightbox] = useState(null); // { images, alt, startIndex }

  const fetchReviews = async () => {
    try {
      const r = await fetch(`${API}/reviews`);
      if (r.ok) setReviews(await r.json());
    } catch(e) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, []);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [activeFilter]);

  const filters = ['all','Stag Do','Hen Party','Birthday Party'];
  const filtered = activeFilter === 'all' ? reviews : reviews.filter(r => r.event === activeFilter);
  const totalPages = Math.ceil(filtered.length / REVIEWS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * REVIEWS_PER_PAGE, page * REVIEWS_PER_PAGE);
  const avgRating = reviews.length ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1) : '5.0';

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <SEOHead
        title="Customer Reviews — Real Stag & Hen Party Photos"
        description="See what our customers say about our custom face t-shirts. Real reviews and photos from stag dos and hen parties across the UK."
        keywords="custom t-shirt reviews UK, stag do t-shirt reviews, hen party t-shirt reviews"
        url="/reviews"
      />
      {lightbox && <Lightbox images={lightbox.images} alt={lightbox.alt} startIndex={lightbox.startIndex} onClose={() => setLightbox(null)} />}
      {showForm && <SubmitReviewForm onClose={()=>setShowForm(false)} onSubmitted={fetchReviews}/>}

      {/* Hero */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
            <h1 className="font-['Anton'] text-4xl sm:text-5xl text-[#252A34] mb-4 tracking-wide">CUSTOMER REVIEWS</h1>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i=><Star key={i} className="w-7 h-7 fill-[#FFE600] text-[#FFE600]"/>)}
              </div>
              <span className="font-['Anton'] text-3xl text-[#252A34]">{avgRating}</span>
              <span className="text-gray-500">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
            <Button onClick={()=>setShowForm(true)} className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-8 py-3 font-bold uppercase tracking-wider">
              Leave a Review
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-4 flex gap-2 flex-wrap">
          {filters.map(f=>(
            <button key={f} onClick={()=>setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeFilter===f?'bg-[#FF2E63] text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'all' ? `All Reviews (${reviews.length})` : `${f} (${reviews.filter(r=>r.event===f).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading reviews...</div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-20">
            <Star className="w-12 h-12 text-gray-200 mx-auto mb-4"/>
            <p className="text-gray-400 mb-4">No reviews yet in this category</p>
            <Button onClick={()=>setShowForm(true)} className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-6 py-3 font-bold uppercase tracking-wider">Be the first!</Button>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((review, i) => (
                <ReviewCard key={review._id || review.id} review={review} delay={i * 0.05}
                  onImageClick={(images, alt, startIndex) => setLightbox({ images, alt, startIndex })} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                  className="p-2 rounded-full border border-gray-200 hover:border-[#FF2E63] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`w-9 h-9 rounded-full text-sm font-bold transition-colors ${page === n ? 'bg-[#FF2E63] text-white' : 'border border-gray-200 text-gray-600 hover:border-[#FF2E63]'}`}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                  className="p-2 rounded-full border border-gray-200 hover:border-[#FF2E63] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA */}
      <section className="bg-[#252A34] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="font-['Anton'] text-3xl sm:text-4xl text-white mb-4 tracking-wide">READY TO CREATE YOURS?</h2>
          <p className="text-gray-400 mb-8">Join hundreds of happy customers</p>
          <Link to="/builder">
            <Button className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-10 py-4 text-lg font-bold uppercase tracking-wider">
              Start Creating
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
