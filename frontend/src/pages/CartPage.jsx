import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ShoppingCart, Trash2, ArrowRight,
  ShieldCheck, Truck, ChevronLeft, Loader2, Lock, CheckCircle
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CartPage() {
  const navigate = useNavigate();
  const { cart = [], removeFromCart, clearCart, pricing = {} } = useStore();
  const [step, setStep] = useState('cart');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Wait one tick for zustand persist to rehydrate
    const t = setTimeout(() => setHydrated(true), 50);
    return () => clearTimeout(t);
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [customerDetails, setCustomerDetails] = useState({ name: '', email: '', phone: '' });

  const subtotal = cart.reduce((sum, item) => {
    const back = item.hasBackPrint ? (item.backPrice || pricing.back_print_price) : 0;
    return sum + (item.price + back) * item.quantity;
  }, 0);
  const total = subtotal;

  const handleProceedToDetails = () => setStep('details');

  const handlePlaceOrder = async () => {
    if (!customerDetails.name.trim() || !customerDetails.email.trim() || !customerDetails.phone.trim()) {
      toast.error('Please enter your name, email and phone number'); return;
    }
    if (!/\S+@\S+\.\S+/.test(customerDetails.email)) {
      toast.error('Please enter a valid email address'); return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: customerDetails.email,
          customer_name: customerDetails.name,
          customer_phone: customerDetails.phone,
          items: cart,
          gdpr_consent: true,
        }),
      });
      if (!res.ok) throw new Error('Failed to create order');
      const order = await res.json();
      setOrderNumber(order.order_number || order.id);
      clearCart();
      setOrderPlaced(true);
      setStep('success');
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Empty cart — wait for hydration first
  if (!hydrated) return null;
  if (cart.length === 0 && step === 'cart') {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-6">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="font-['Anton'] text-2xl text-[#252A34] mb-2">YOUR CART IS EMPTY</h2>
          <p className="text-gray-500 mb-6">Start creating your party t-shirts!</p>
          <Button onClick={() => navigate('/builder')} className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-8 py-3 font-bold uppercase tracking-wider">
            Start Creating
          </Button>
        </div>
      </div>
    );
  }

  // Order success
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-['Anton'] text-2xl text-[#252A34] mb-2 tracking-wide">ORDER RECEIVED!</h2>
          {orderNumber && <p className="text-sm text-gray-400 mb-4">Order: {orderNumber}</p>}
          <div className="p-4 bg-[#FFF9E6] border border-[#FFE600] rounded-xl text-left space-y-2 mb-6">
            <p className="text-sm font-bold text-[#1C1C1C]">What happens next:</p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
              <li>We'll review your order and check the design</li>
              <li>A digital proof will be sent to <strong>{customerDetails.email}</strong></li>
              <li>Once you approve, we'll arrange payment and print</li>
              <li>We'll contact you on <strong>{customerDetails.phone}</strong> if we need anything</li>
            </ul>
          </div>
          <Button onClick={() => navigate('/')} className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-4 font-bold uppercase tracking-wider">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-20">
      {/* Header */}
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4">
            {step !== 'cart' && (
              <button onClick={() => setStep('cart')} className="p-2 rounded-full hover:bg-gray-100">
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <div>
              <h1 className="font-['Anton'] text-3xl text-[#252A34] tracking-wide">
                {step === 'cart' ? 'YOUR CART' : 'YOUR DETAILS'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {step === 'cart' ? `${cart.length} item${cart.length !== 1 ? 's' : ''}` : 'Almost done!'}
              </p>
            </div>
          </div>
          {/* Progress */}
          <div className="flex items-center gap-2 mt-4">
            {['Cart', 'Details', 'Confirm'].map((s, i) => {
              const steps = ['cart', 'details', 'success'];
              const active = step === steps[i];
              const done = steps.indexOf(step) > i;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 text-sm font-medium ${active ? 'text-[#FF2E63]' : done ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-[#FF2E63] text-white' : done ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className="hidden sm:inline">{s}</span>
                  </div>
                  {i < 2 && <div className={`w-8 h-0.5 ${done ? 'bg-green-600' : 'bg-gray-200'}`} />}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="wait">

              {/* Cart */}
              {step === 'cart' && (
                <motion.div key="cart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="space-y-4">
                    {cart.map((item, i) => (
                      <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-start gap-4">
                          {item.previewUrl && (
                            <img src={item.previewUrl} alt="Design" className="w-16 h-20 object-contain bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#252A34] truncate">{item.templateName}</p>
                            <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                              {item.titleText && <p>"{item.titleText}"</p>}
                              {item.subtitleText && <p>"{item.subtitleText}"</p>}
                              <p className="capitalize">{item.shirtType || 'Unisex'} • Size {item.size}{item.shirtColor ? ` • ${item.shirtColor}` : ''}</p>
                              {item.hasBackPrint && item.backName && <p>Back: {item.backName}</p>}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-[#FF2E63]">£{((item.price || 19.99) + (item.hasBackPrint ? (item.backPrice || 2.50) : 0)).toFixed(2)}</p>
                            <button onClick={() => removeFromCart(i)} className="text-gray-400 hover:text-red-500 transition-colors mt-2">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleProceedToDetails} className="w-full mt-6 bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 text-lg font-bold uppercase tracking-wider">
                    Continue <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* Details */}
              {step === 'details' && (
                <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
                  <h3 className="font-bold text-[#252A34] text-lg">Contact Details</h3>

                  <div className="p-4 bg-[#FFF9E6] border border-[#FFE600] rounded-xl space-y-1.5">
                    <p className="text-xs font-bold text-[#1C1C1C] uppercase tracking-wide">📋 How your order works</p>
                    <ul className="text-xs text-gray-700 space-y-1 list-disc pl-4">
                      <li>Every order is manually checked before printing</li>
                      <li>A <strong>digital proof</strong> is sent to you for approval first</li>
                      <li>We arrange payment and print once you approve</li>
                      <li className="font-semibold text-[#FF2E63]">Make sure your email and phone are correct below</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input value={customerDetails.name} onChange={e => setCustomerDetails(d => ({ ...d, name: e.target.value }))} placeholder="Your full name" className="mt-1" />
                    </div>
                    <div>
                      <Label>Email Address <span className="text-[#FF2E63]">*</span></Label>
                      <Input type="email" value={customerDetails.email} onChange={e => setCustomerDetails(d => ({ ...d, email: e.target.value }))} placeholder="your@email.com" className="mt-1" />
                      <p className="text-xs text-gray-400 mt-1">Your proof will be sent here</p>
                    </div>
                    <div>
                      <Label>Phone Number <span className="text-[#FF2E63]">*</span></Label>
                      <Input type="tel" value={customerDetails.phone} onChange={e => setCustomerDetails(d => ({ ...d, phone: e.target.value }))} placeholder="e.g. 07911 123456" className="mt-1" />
                      <p className="text-xs text-gray-400 mt-1">In case we need to reach you about your order</p>
                    </div>
                  </div>

                  <Button onClick={handlePlaceOrder} disabled={isLoading} className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 text-lg font-bold uppercase tracking-wider">
                    {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Placing order...</> : <>Place Order <ArrowRight className="w-5 h-5 ml-2" /></>}
                  </Button>
                  <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Your details are only used for order fulfilment
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-24">
              <h3 className="font-['Anton'] text-lg text-[#252A34] tracking-wide mb-4">ORDER SUMMARY</h3>
              <div className="space-y-2 mb-4">
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1 mr-2">{item.templateName} ({item.size})</span>
                    <span className="font-medium text-[#252A34] flex-shrink-0">£{((item.price || 19.99) + (item.hasBackPrint ? (item.backPrice || 2.50) : 0)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>£{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm text-green-600"><span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" />Shipping</span><span className="font-medium">FREE</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
                  <span>Total</span><span className="text-[#FF2E63]">£{total.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {[{ icon: '✅', text: 'Proof sent before printing' }, { icon: '🚚', text: 'Free UK delivery' }, { icon: '📞', text: 'We contact you to confirm' }].map(b => (
                  <div key={b.text} className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{b.icon}</span><span>{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
