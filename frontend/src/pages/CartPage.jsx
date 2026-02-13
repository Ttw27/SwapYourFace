import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { 
  Trash2, ShoppingCart, ArrowRight, 
  Shirt, Tag, CheckCircle, Loader2 
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CartPage() {
  const navigate = useNavigate();
  const { 
    cartItems, removeFromCart, clearCart, 
    getCartTotal, getCartItemCount, pricing 
  } = useStore();
  
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    if (!gdprConsent) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
          items: cartItems,
          gdpr_consent: gdprConsent
        })
      });

      if (!response.ok) throw new Error('Order failed');

      const order = await response.json();
      setOrderNumber(order.order_number);
      setOrderComplete(true);
      clearCart();
      toast.success('Order placed successfully!');

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-party p-8 max-w-lg w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-['Anton'] text-3xl text-[#252A34] mb-4 tracking-wide">
            ORDER CONFIRMED!
          </h1>
          <p className="text-gray-600 mb-2">Thank you for your order</p>
          <p className="text-lg font-bold text-[#FF2E63] mb-6">{orderNumber}</p>
          <p className="text-gray-500 text-sm mb-8">
            We've sent a confirmation email to {customerEmail}. 
            You'll receive updates on your order status.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/">
              <Button className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full font-bold uppercase tracking-wider">
                Continue Shopping
              </Button>
            </Link>
            <Link to="/builder">
              <Button variant="outline" className="w-full rounded-full">
                Create Another Design
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h1 className="font-['Anton'] text-3xl text-[#252A34] mb-4 tracking-wide">
            YOUR CART IS EMPTY
          </h1>
          <p className="text-gray-600 mb-8">
            Start creating your custom party t-shirts!
          </p>
          <Link to="/builder">
            <Button 
              data-testid="empty-cart-create-btn"
              className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-8 py-6 font-bold uppercase tracking-wider"
            >
              Start Creating
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] py-12">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="font-['Anton'] text-3xl sm:text-4xl text-[#252A34] mb-8 tracking-wide">
          YOUR CART
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, idx) => (
              <motion.div
                key={item.cartId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="cart-item"
                data-testid={`cart-item-${idx}`}
              >
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {item.headUrl ? (
                    <img 
                      src={`${process.env.REACT_APP_BACKEND_URL}${item.headUrl}`}
                      alt="Design preview"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <Shirt className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 truncate">
                    {item.templateName || 'Custom Design'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Size: {item.size || 'M'}
                    {item.hasBackPrint && ` • Back: ${item.backName || 'Custom'}`}
                  </p>
                  {item.titleText && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      "{item.titleText}"
                    </p>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-[#252A34]">
                    £{((item.price || pricing.base_price) + (item.hasBackPrint ? pricing.back_print_price : 0)).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.cartId)}
                    className="text-red-500 hover:text-red-700 text-sm mt-2"
                    data-testid={`remove-item-${idx}`}
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Remove
                  </button>
                </div>
              </motion.div>
            ))}

            <div className="flex justify-between items-center pt-4">
              <Link to="/builder">
                <Button variant="outline" className="rounded-full">
                  Add More Items
                </Button>
              </Link>
              <button
                onClick={clearCart}
                className="text-red-500 hover:text-red-700 text-sm"
                data-testid="clear-cart-btn"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card-party p-6 sticky top-24">
              <h2 className="font-['Anton'] text-xl text-[#252A34] mb-6 tracking-wide">
                ORDER SUMMARY
              </h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items ({getCartItemCount()})</span>
                  <span className="font-medium">£{getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
              </div>
              
              <div className="border-t my-4 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-[#252A34]">Total</span>
                  <span className="text-2xl font-bold text-[#FF2E63]">
                    £{getCartTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">Your Name</Label>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Smith"
                    className="mt-1"
                    data-testid="checkout-name"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="mt-1"
                    data-testid="checkout-email"
                  />
                </div>
                
                <div className="flex items-start gap-3 pt-2">
                  <Checkbox
                    id="terms"
                    checked={gdprConsent}
                    onCheckedChange={setGdprConsent}
                    data-testid="checkout-consent"
                  />
                  <label htmlFor="terms" className="text-xs text-gray-600 cursor-pointer">
                    I agree to the terms and conditions and consent to my data being processed for order fulfilment.
                  </label>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full mt-6 bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 font-bold uppercase tracking-wider"
                data-testid="checkout-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Complete Order
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Secure checkout • Free UK shipping
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
