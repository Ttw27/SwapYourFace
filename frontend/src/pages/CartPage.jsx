import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowRight,
  CreditCard, ShieldCheck, Truck, ChevronLeft, Loader2,
  Lock
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateCartItemQuantity, clearCart, pricing } = useStore();

  const [step, setStep] = useState('cart'); // 'cart' | 'details' | 'payment'
  const [isLoading, setIsLoading] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // ── Totals ──────────────────────────────────────────────────────────────────
  const subtotal = cart.reduce((sum, item) => {
    const back = item.hasBackPrint ? (item.backPrice || pricing.back_print_price) : 0;
    return sum + (item.price + back) * item.quantity;
  }, 0);

  const shipping = subtotal > 0 ? 0 : 0; // Free shipping
  const total = subtotal + shipping;

  // ── Proceed to Stripe ───────────────────────────────────────────────────────
  const handleProceedToPayment = async () => {
    if (!customerDetails.name.trim() || !customerDetails.email.trim() || !customerDetails.phone.trim()) {
      toast.error('Please enter your name, email and phone number');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(customerDetails.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create order in our backend
      const orderResponse = await fetch(`${API}/orders`, {
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

      if (!orderResponse.ok) throw new Error('Failed to create order');
      const order = await orderResponse.json();

      // 2. Create Stripe PaymentIntent
      const intentResponse = await fetch(`${API}/payments/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          customer_email: customerDetails.email,
        }),
      });

      if (!intentResponse.ok) throw new Error('Failed to initialise payment');
      const { client_secret } = await intentResponse.json();

      // 3. Redirect to Stripe hosted checkout
      // In production you would use @stripe/stripe-js loadStripe() here
      // For now we redirect to a success page after confirming
      // Store order ID and client secret for the payment page
      sessionStorage.setItem('pt_order_id', order.id);
      sessionStorage.setItem('pt_client_secret', client_secret);
      sessionStorage.setItem('pt_customer_email', customerDetails.email);

      setStep('payment');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Simulated payment confirmation (replace with Stripe Elements in production) ──
  const handleConfirmPayment = async () => {
    setIsLoading(true);
    // Simulate payment processing delay
    await new Promise(r => setTimeout(r, 2000));
    clearCart();
    toast.success('Order placed! Check your email for confirmation.');
    navigate('/');
    setIsLoading(false);
  };

  if (cart.length === 0 && step === 'cart') {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="font-['Anton'] text-2xl text-[#252A34] mb-2">YOUR CART IS EMPTY</h2>
          <p className="text-gray-500 mb-6">Start creating your party t-shirts!</p>
          <Button
            onClick={() => navigate('/builder')}
            className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-8 py-3 font-bold uppercase tracking-wider"
          >
            Start Creating
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-20">
      {/* Header */}
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-4">
            {step !== 'cart' && (
              <button
                onClick={() => setStep(step === 'payment' ? 'details' : 'cart')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <div>
              <h1 className="font-['Anton'] text-3xl text-[#252A34] tracking-wide">
                {step === 'cart' ? 'YOUR CART' : step === 'details' ? 'YOUR DETAILS' : 'PAYMENT'}
              </h1>
              {/* Step indicator */}
              <div className="flex items-center gap-2 mt-2">
                {['cart', 'details', 'payment'].map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full transition-colors ${
                      step === s ? 'bg-[#FF2E63]' : 
                      ['cart', 'details', 'payment'].indexOf(step) > i ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    {i < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="wait">

              {/* ── Cart Items ─────────────────────────────────────────────── */}
              {step === 'cart' && (
                <motion.div
                  key="cart"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {cart.map((item, idx) => (
                    <div key={item.id || idx} className="bg-white rounded-2xl p-5 shadow-sm flex gap-4">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                        {item.templateImage ? (
                          <img src={item.templateImage} alt={item.templateName} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">👕</div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#252A34] truncate">{item.templateName}</p>
                        <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                          {item.titleText && <p>"{item.titleText}"</p>}
                          {item.subtitleText && <p>"{item.subtitleText}"</p>}
                          <p>Size: {item.size}</p>
                          {item.hasBackPrint && item.backName && <p>Back: {item.backName}</p>}
                        </div>
                      </div>

                      {/* Price & Controls */}
                      <div className="flex flex-col items-end justify-between flex-shrink-0">
                        <p className="font-bold text-[#252A34]">
                          £{((item.price + (item.hasBackPrint ? item.backPrice || 2.50 : 0)) * item.quantity).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors ml-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    onClick={() => navigate('/builder')}
                    variant="outline"
                    className="w-full rounded-full py-4 border-dashed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Design
                  </Button>
                </motion.div>
              )}

              {/* ── Customer Details ────────────────────────────────────────── */}
              {step === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-2xl p-6 shadow-sm space-y-5"
                >
                  <h3 className="font-bold text-[#252A34]">Contact Details</h3>

                  {/* Proof approval notice */}
                  <div className="p-4 bg-[#FFF9E6] border border-[#FFE600] rounded-xl space-y-1.5">
                    <p className="text-xs font-bold text-[#1C1C1C] uppercase tracking-wide">📋 How your order works</p>
                    <ul className="text-xs text-gray-700 space-y-1 list-disc pl-4">
                      <li>Every order is manually checked before printing</li>
                      <li>A <strong>digital proof</strong> is sent to you for approval first — nothing prints until you say yes</li>
                      <li>We'll contact you if we need a better quality photo</li>
                      <li className="font-semibold text-[#FF2E63]">Make sure your email and phone number below are correct so we can reach you</li>
                    </ul>
                  </div>

                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails(d => ({ ...d, name: e.target.value }))}
                      placeholder="Your full name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address <span className="text-[#FF2E63]">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerDetails.email}
                      onChange={(e) => setCustomerDetails(d => ({ ...d, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-400 mt-1">Your proof will be sent here</p>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number <span className="text-[#FF2E63]">*</span></Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails(d => ({ ...d, phone: e.target.value }))}
                      placeholder="e.g. 07911 123456"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-400 mt-1">In case we need to reach you quickly about your order</p>
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    Your details are only used for order fulfilment
                  </p>
                </motion.div>
              )}

              {/* ── Payment ─────────────────────────────────────────────────── */}
              {step === 'payment' && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-2xl p-6 shadow-sm space-y-6"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-green-600" />
                    <div>
                      <h3 className="font-bold text-[#252A34]">Secure Payment</h3>
                      <p className="text-sm text-gray-500">Powered by Stripe — card, PayPal, Apple Pay & Google Pay</p>
                    </div>
                  </div>

                  {/* Payment method logos */}
                  <div className="flex gap-3 flex-wrap">
                    {['💳 Card', '🅿️ PayPal', '🍎 Apple Pay', '🤖 Google Pay'].map(m => (
                      <span key={m} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600">
                        {m}
                      </span>
                    ))}
                  </div>

                  {/* Stripe Elements would mount here in production */}
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400">
                    <CreditCard className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium text-gray-600">Stripe payment form loads here</p>
                    <p className="text-xs mt-1">
                      Connect your Stripe publishable key in <code className="bg-gray-100 px-1 rounded">.env</code> to activate
                    </p>
                    <p className="text-xs mt-1 text-gray-400">
                      See <span className="text-blue-500">SETUP.md</span> for instructions
                    </p>
                  </div>

                  {/* Simulate payment for testing */}
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={isLoading}
                    className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 text-lg font-bold uppercase tracking-wider"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 mr-2" />
                        Pay £{total.toFixed(2)} Securely
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-gray-400">
                    By placing your order you agree to our Terms of Service and Privacy Policy
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Order Summary Sidebar ─────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-[#252A34] mb-4">Order Summary</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    Shipping
                  </span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-[#252A34] text-base">
                  <span>Total</span>
                  <span>£{total.toFixed(2)}</span>
                </div>
              </div>

              {/* CTA Button */}
              {step === 'cart' && (
                <Button
                  onClick={() => setStep('details')}
                  className="w-full mt-4 bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-4 font-bold uppercase tracking-wider"
                >
                  Checkout
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              {step === 'details' && (
                <Button
                  onClick={handleProceedToPayment}
                  disabled={isLoading}
                  className="w-full mt-4 bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-4 font-bold uppercase tracking-wider"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                  ) : (
                    <>Proceed to Payment <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              )}
            </div>

            {/* Trust badges */}
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>Secure SSL encrypted checkout</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Truck className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <span>Free UK delivery • 5–7 working days</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <CreditCard className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <span>Card, PayPal, Apple Pay & Google Pay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
