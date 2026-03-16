import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { 
  Trash2, ShoppingCart, ArrowRight, 
  Shirt, CheckCircle, Loader2, ExternalLink
} from 'lucide-react';
import { 
  addToCheckout, 
  getProductByHandle, 
  findVariantId, 
  redirectToCheckout,
  getCheckout 
} from '@/services/shopifyClient';

const PRODUCT_HANDLE = 'custom-party-t-shirt'; // Your Shopify product handle

export default function CartPage() {
  const navigate = useNavigate();
  const { 
    cartItems, removeFromCart, clearCart, 
    getCartTotal, getCartItemCount, pricing 
  } = useStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [shopifyProduct, setShopifyProduct] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState(null);

  // Fetch Shopify product on mount
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const product = await getProductByHandle(PRODUCT_HANDLE);
        setShopifyProduct(product);
        
        // Also get current checkout URL if exists
        const checkout = await getCheckout();
        if (checkout?.webUrl && checkout.lineItems?.length > 0) {
          setCheckoutUrl(checkout.webUrl);
        }
      } catch (error) {
        console.error('Error fetching Shopify product:', error);
      }
    };
    fetchProduct();
  }, []);

  const handleShopifyCheckout = async () => {
    if (!shopifyProduct) {
      toast.error('Product not found. Please try again.');
      return;
    }

    setIsProcessing(true);

    try {
      // Build line items for Shopify
      const lineItems = [];
      
      for (const item of cartItems) {
        // Find the variant ID for this size
        const variantId = findVariantId(shopifyProduct, item.size);
        
        if (!variantId) {
          toast.error(`Size ${item.size} not available`);
          continue;
        }

        // Custom attributes to pass design info to Shopify order
        const customAttributes = [
          { key: 'Template', value: item.templateName || 'Custom' },
          { key: 'Title Text', value: item.titleText || '' },
          { key: 'Subtitle Text', value: item.subtitleText || '' },
          { key: 'Back Print', value: item.hasBackPrint ? 'Yes (+£2.50)' : 'No' },
          { key: 'Back Name', value: item.backName || '' },
          { key: '_head_cutout_id', value: item.headCutoutId || '' },
          { key: '_design_url', value: item.headUrl ? `https://party-shirt-builder.preview.emergentagent.com${item.headUrl}` : '' },
        ].filter(attr => attr.value); // Remove empty values

        lineItems.push({
          variantId,
          quantity: item.quantity || 1,
          customAttributes,
        });
      }

      if (lineItems.length === 0) {
        toast.error('No valid items to checkout');
        setIsProcessing(false);
        return;
      }

      // Add to Shopify checkout
      await addToCheckout(lineItems);
      
      // Clear local cart
      clearCart();
      
      // Redirect to Shopify checkout
      toast.success('Redirecting to checkout...');
      await redirectToCheckout();

    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to create checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

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
          
          {checkoutUrl && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Have items in Shopify checkout?</p>
              <a 
                href={checkoutUrl}
                className="inline-flex items-center text-[#FF2E63] font-medium hover:underline"
              >
                Continue to Shopify Checkout
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>
          )}
          
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
                  <span className="text-green-600 font-medium">Calculated at checkout</span>
                </div>
              </div>
              
              <div className="border-t my-4 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-[#252A34]">Subtotal</span>
                  <span className="text-2xl font-bold text-[#FF2E63]">
                    £{getCartTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Shopify Checkout Button */}
              <Button
                onClick={handleShopifyCheckout}
                disabled={isProcessing || !shopifyProduct}
                className="w-full mt-4 bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-6 font-bold uppercase tracking-wider"
                data-testid="shopify-checkout-btn"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Checkout with Shopify
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 text-center">
                  <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
                  Secure checkout powered by Shopify
                </p>
              </div>

              {!shopifyProduct && (
                <p className="text-xs text-yellow-600 text-center mt-2">
                  Loading product info...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
