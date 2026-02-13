import { motion } from 'framer-motion';
import { Truck, Clock, RefreshCw, MapPin, Package, CheckCircle } from 'lucide-react';

export default function ShippingPage() {
  const shippingOptions = [
    {
      name: "Standard Delivery",
      time: "5-7 working days",
      price: "FREE",
      description: "Free shipping on all UK orders"
    },
    {
      name: "Express Delivery",
      time: "2-3 working days",
      price: "£7.99",
      description: "Get your order faster"
    },
    {
      name: "Next Day Delivery",
      time: "Next working day",
      price: "£12.99",
      description: "Order before 12pm for next day delivery"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7] py-12">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 mx-auto mb-6 bg-[#08D9D6]/10 rounded-2xl flex items-center justify-center">
            <Truck className="w-8 h-8 text-[#08D9D6]" />
          </div>
          <h1 className="font-['Anton'] text-4xl sm:text-5xl text-[#252A34] mb-4 tracking-wide">
            SHIPPING & RETURNS
          </h1>
          <p className="text-gray-600">
            Free UK shipping on all orders
          </p>
        </motion.div>

        {/* Shipping Options */}
        <section className="mb-12">
          <h2 className="font-['Anton'] text-2xl text-[#252A34] mb-6 tracking-wide">
            DELIVERY OPTIONS
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {shippingOptions.map((option, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="card-party p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  {idx === 0 && <Package className="w-6 h-6 text-[#FF2E63]" />}
                  {idx === 1 && <Truck className="w-6 h-6 text-[#08D9D6]" />}
                  {idx === 2 && <Clock className="w-6 h-6 text-[#F9ED69]" />}
                  <h3 className="font-bold text-[#252A34]">{option.name}</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{option.time}</p>
                  <p className="text-xl font-bold text-[#FF2E63]">{option.price}</p>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Delivery Info */}
        <section className="mb-12">
          <h2 className="font-['Anton'] text-2xl text-[#252A34] mb-6 tracking-wide">
            DELIVERY INFORMATION
          </h2>
          <div className="card-party p-6 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-600">All orders are printed and dispatched within 2-3 working days of order confirmation.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-600">You'll receive a dispatch confirmation email with tracking information once your order ships.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-600">We ship Monday to Friday, excluding bank holidays.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-600">For express and next day delivery, orders must be placed before 12pm.</p>
            </div>
          </div>
        </section>

        {/* Returns Policy */}
        <section className="mb-12">
          <h2 className="font-['Anton'] text-2xl text-[#252A34] mb-6 tracking-wide">
            RETURNS & EXCHANGES
          </h2>
          <div className="card-party p-6">
            <div className="flex items-start gap-3 mb-6">
              <RefreshCw className="w-6 h-6 text-[#FF2E63] mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-[#252A34] mb-2">Our Policy</h3>
                <p className="text-gray-600">
                  Due to the custom nature of our products, we cannot offer refunds or exchanges for change of mind. 
                  However, if you receive a faulty or incorrect item, we will replace it free of charge.
                </p>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h4 className="font-bold text-[#252A34] mb-3">We'll replace your order if:</h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  The print quality is not up to standard
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  You receive the wrong size or design
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  The item is damaged during shipping
                </li>
              </ul>
            </div>

            <div className="border-t mt-6 pt-6">
              <h4 className="font-bold text-[#252A34] mb-3">How to report an issue:</h4>
              <ol className="space-y-2 text-gray-600 list-decimal list-inside">
                <li>Email us at hello@partytees.co.uk within 14 days of receiving your order</li>
                <li>Include your order number and photos of the issue</li>
                <li>We'll review your case and respond within 24 hours</li>
                <li>If approved, we'll send a replacement at no extra cost</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section>
          <div className="card-party p-6 bg-[#252A34] text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Need help with your order?</h3>
                <p className="text-gray-300 text-sm">
                  Contact us at hello@partytees.co.uk and we'll be happy to assist
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
