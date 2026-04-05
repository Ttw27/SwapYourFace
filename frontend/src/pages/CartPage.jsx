import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ShoppingCart, Trash2, ArrowRight, ShieldCheck,
  Truck, ChevronLeft, Loader2, Lock, CheckCircle
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CartPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cartItems = [], removeFromCart, clearCart, pricing = {} } = useStore();
  const cart = cartItems;

  const [step, setStep] = useState('cart');
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [customerDetails, setCustomerDetails] = useState({ name: '', email: '', phone: '' });
  const [shipping, setShipping] = useState('standard');
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(null); // { code, percent_off }
  const [validatingCode, setValidatingCode] = useState(false);
  const SHIPPING_COST = shipping === 'express' ? 8.99 : 0;

  // Hydration fix
  useEffect(() => {
    const t = setTimeout(() => setHydrated(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Handle return from Stripe
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Fire browser-side Purchase event for Facebook Pixel
      // Server-side already fired via Conversions API when order was placed
      // Meta deduplicates using the session_id as event_id
      try {
        if (window.fbq) {
          window.fbq('track', 'Purchase', {
            value: parseFloat(sessionStorage.getItem('smf_order_total') || 0),
            currency: 'GBP',
            content_type: 'product',
          }, {
            eventID: sessionId, // used for deduplication with server-side event
          });
        }
      } catch(e) {}
      sessionStorage.removeItem('smf_order_total');
      clearCart();
      setStep('success');
    }
  }, [searchParams]);

  // Tier pricing
  const getTierPrice = (qty) => {
    const tiers = pricing.tiers || [];
    for (const tier of [...tiers].sort((a,b) => a.min_qty - b.min_qty)) {
      if (qty >= tier.min_qty && qty <= tier.max_qty) return tier.price;
    }
    return tiers.length ? tiers[tiers.length-1].price : 17.99;
  };
  const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const tierPrice = getTierPrice(totalQty);
  const activeTier = (pricing.tiers || []).find(t => totalQty >= t.min_qty && totalQty <= t.max_qty);

  const subtotal = cart.reduce((sum, item) => {
    const back = item.hasBackPrint ? (item.backPrice || pricing.back_print_price || 2.50) : 0;
    return sum + (tierPrice + back) * (item.quantity || 1);
  }, 0);
  const shippingCost = shipping === 'express' ? 8.99 : 0;
  const discountAmount = discountApplied ? Math.round(subtotal * discountApplied.percent_off) / 100 : 0;
  const total = subtotal - discountAmount + shippingCost;

  const handleProceedToDetails = () => setStep('details');

  const handleValidateDiscount = async () => {
    if (!discountCode.trim()) return;
    setValidatingCode(true);
    try {
      const r = await fetch(`${API}/validate-discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode.trim().toUpperCase() })
      });
      const data = await r.json();
      if (!r.ok) { toast.error(data.detail || 'Invalid code'); return; }
      setDiscountApplied({ code: data.code, percent_off: data.percent_off });
      toast.success(`${data.percent_off}% discount applied!`);
    } catch(e) {
      toast.error('Could not validate code');
    } finally {
      setValidatingCode(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!customerDetails.name.trim() || !customerDetails.email.trim() || !customerDetails.phone.trim()) {
      toast.error('Please enter your name, email and phone number'); return;
    }
    if (!/\S+@\S+\.\S+/.test(customerDetails.email)) {
      toast.error('Please enter a valid email address'); return;
    }
    setIsLoading(true);
    try {
      // 1. Create order
      const orderRes = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: customerDetails.email,
          customer_name: customerDetails.name,
          customer_phone: customerDetails.phone,
          items: cart,
          gdpr_consent: true,
          status: 'pending_payment',
        }),
      });
      if (!orderRes.ok) throw new Error('Failed to create order');
      const order = await orderRes.json();
      setOrderId(order.id);
      setOrderNumber(order.order_number || order.id);

      // 2. Create Stripe Checkout Session
      const checkoutRes = await fetch(`${API}/payments/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          order_id: order.id,
          customer_email: customerDetails.email,
          shipping_method: shipping,
          shipping_cost: shippingCost,
          discount_code: discountApplied?.code || '',
          success_url: `${window.location.origin}/cart`,
          cancel_url: `${window.location.origin}/cart`,
        }),
      });
      if (!checkoutRes.ok) throw new Error('Failed to create checkout session');
      const { checkout_url } = await checkoutRes.json();

      // 3. Store total for post-payment tracking, then redirect to Stripe
      sessionStorage.setItem('smf_order_total', total.toFixed(2));
      window.location.href = checkout_url;

    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  if (!hydrated) return null;

  // Empty cart
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

  // Success screen
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-['Anton'] text-2xl text-[#252A34] mb-2 tracking-wide">PAYMENT SUCCESSFUL!</h2>
          {orderNumber && <p className="text-sm text-gray-400 mb-4">Order: {orderNumber}</p>}
          <div className="p-4 bg-[#FFF9E6] border border-[#FFE600] rounded-xl text-left space-y-2 mb-6">
            <p className="text-sm font-bold text-[#1C1C1C]">What happens next:</p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
              <li>Payment confirmed ✅</li>
              <li>We'll review your design and create a digital proof</li>
              <li>Proof sent to you for approval before printing</li>
              <li>Once approved we'll print and dispatch</li>
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
                {step === 'cart' ? `${cart.length} item${cart.length !== 1 ? 's' : ''}` : 'Then you\'ll be taken to Stripe to pay securely'}
              </p>
            </div>
          </div>
          {/* Progress */}
          <div className="flex items-center gap-2 mt-4">
            {['Cart', 'Details', 'Payment'].map((s, i) => {
              const steps = ['cart', 'details', 'payment'];
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
                    {cart.map((item) => (
                      <div key={item.cartId} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-start gap-4">
                          {item.previewUrl ? (
                            <img src={item.previewUrl} alt="Design"
                              className="w-16 h-20 object-contain bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0"
                              crossOrigin="anonymous"
                              onError={e => e.target.style.display='none'} />
                          ) : (
                            <div className="w-16 h-20 bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0 flex items-center justify-center">
                              <ShoppingCart className="w-6 h-6 text-gray-300" />
                            </div>
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
                            <p className="font-bold text-[#FF2E63]">£{(tierPrice + (item.hasBackPrint ? (item.backPrice || pricing.back_print_price || 2.50) : 0)).toFixed(2)}</p>
                            <button onClick={() => removeFromCart(item.cartId)} className="text-gray-400 hover:text-red-500 transition-colors mt-2">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Active tier banner */}
                  {activeTier && (
                    <div className={`mt-4 p-3 rounded-xl border text-sm flex items-center justify-between ${totalQty >= 21 ? 'bg-[#FF2E63]/5 border-[#FF2E63]/20' : 'bg-[#FFF9E6] border-[#FFE600]'}`}>
                      <span className="font-medium text-[#252A34]">
                        {activeTier.label} — <strong>£{tierPrice.toFixed(2)}</strong> per shirt
                      </span>
                      {totalQty < 21 && (
                        <span className="text-xs text-gray-500">
                          {(() => {
                            const tiers = pricing.tiers || [];
                            const next = tiers.find(t => t.min_qty > totalQty);
                            return next ? `Add ${next.min_qty - totalQty} more for £${next.price.toFixed(2)}/shirt` : null;
                          })()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Shipping selector */}
                  <div className="mt-6 space-y-3">
                    <p className="font-bold text-[#252A34] text-sm">Delivery Option</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setShipping('standard')}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${shipping === 'standard' ? 'border-[#FF2E63] bg-[#FF2E63]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-[#252A34] text-sm">Standard</p>
                          <span className="font-bold text-green-600">FREE</span>
                        </div>
                        <p className="text-xs text-gray-400">5–8 working days</p>
                      </button>
                      <button onClick={() => setShipping('express')}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${shipping === 'express' ? 'border-[#FF2E63] bg-[#FF2E63]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-[#252A34] text-sm">Express</p>
                          <span className="font-bold text-[#FF2E63]">£8.99</span>
                        </div>
                        <p className="text-xs text-gray-400">3–5 working days</p>
                      </button>
                    </div>
                  </div>

                  <Button onClick={handleProceedToDetails} className="w-full mt-4 bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 text-lg font-bold uppercase tracking-wider">
                    Continue <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* Details */}
              {step === 'details' && (
                <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
                  <h3 className="font-bold text-[#252A34] text-lg">Your Details</h3>
                  <div className="p-4 bg-[#FFF9E6] border border-[#FFE600] rounded-xl space-y-1.5">
                    <p className="text-xs font-bold text-[#1C1C1C] uppercase tracking-wide">📋 How it works</p>
                    <ul className="text-xs text-gray-700 space-y-1 list-disc pl-4">
                      <li>Enter your details below</li>
                      <li>You'll be taken to Stripe's secure payment page</li>
                      <li>After payment we'll create a digital proof and send for your approval</li>
                      <li className="font-semibold text-[#FF2E63]">Make sure your email and phone are correct</li>
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
                    </div>
                  </div>
                  <Button onClick={handleProceedToPayment} disabled={isLoading} className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 text-lg font-bold uppercase tracking-wider">
                    {isLoading
                      ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Redirecting to payment...</>
                      : <><Lock className="w-5 h-5 mr-2" />Pay Securely with Stripe</>}
                  </Button>
                  {/* Stripe trust signals */}
                  <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-gray-600">Secured by Stripe</span>
                    </div>
                    <p className="text-xs text-center text-gray-400 leading-relaxed">
                      Your payment is processed by <strong className="text-gray-600">Stripe</strong> — one of the world's most trusted payment platforms. We never see or store your card details.
                    </p>
                    {/* Card logos */}
                    <div className="flex items-center justify-center gap-3">
                      {['VISA', 'MC', 'AMEX', 'APPLE PAY'].map(card => (
                        <span key={card} className="text-xs font-bold text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">{card}</span>
                      ))}
                    </div>
                    <p className="text-xs text-center">
                      <a href="https://stripe.com" target="_blank" rel="noreferrer" className="text-[#FF2E63] hover:underline">
                        Learn more about Stripe →
                      </a>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-24">
              <h3 className="font-['Anton'] text-lg text-[#252A34] tracking-wide mb-4">ORDER SUMMARY</h3>
              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={item.cartId} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1 mr-2">{item.templateName} ({item.size})</span>
                    <span className="font-medium text-[#252A34] flex-shrink-0">£{(tierPrice + (item.hasBackPrint ? (item.backPrice || pricing.back_print_price || 2.50) : 0)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>£{subtotal.toFixed(2)}</span></div>
                {discountApplied && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">🏷️ {discountApplied.code} ({discountApplied.percent_off}% off)</span>
                    <span className="font-medium">-£{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm"><span className="flex items-center gap-1 text-gray-500"><Truck className="w-3.5 h-3.5" />{shipping === 'express' ? 'Express' : 'Standard'}</span><span className={shipping === 'express' ? 'font-medium text-[#FF2E63]' : 'font-medium text-green-600'}>{shipping === 'express' ? '£8.99' : 'FREE'}</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
                  <span>Total</span><span className="text-[#FF2E63]">£{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Discount code */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                {discountApplied ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                    <span className="text-sm text-green-700 font-medium">🏷️ {discountApplied.code} — {discountApplied.percent_off}% off applied!</span>
                    <button onClick={() => { setDiscountApplied(null); setDiscountCode(''); }} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-500 mb-2 font-medium">Discount Code</p>
                    <div className="flex gap-2">
                      <input
                        value={discountCode}
                        onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && handleValidateDiscount()}
                        placeholder="Enter code"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#FF2E63]/20 focus:border-[#FF2E63]"
                      />
                      <button onClick={handleValidateDiscount} disabled={validatingCode || !discountCode.trim()}
                        className="px-4 py-2 bg-[#252A34] text-white rounded-lg text-sm font-medium hover:bg-black disabled:opacity-50 transition-colors">
                        {validatingCode ? '...' : 'Apply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { icon: '🔒', text: 'Secure Stripe payment' },
                  { icon: '✅', text: 'Proof sent before printing' },
                  { icon: '🚚', text: 'Free UK delivery' },
                ].map(b => (
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
