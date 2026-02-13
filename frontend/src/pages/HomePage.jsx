import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { ArrowRight, Shirt, Users, Upload, Sparkles, Star, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const { templates } = useStore();

  const features = [
    { icon: Upload, title: 'Upload Photo', desc: 'Upload any photo and we auto-remove the background' },
    { icon: Shirt, title: 'Choose Template', desc: 'Pick from hilarious body templates' },
    { icon: Users, title: 'Add Your Group', desc: 'Create one design for all or unique designs per person' },
    { icon: Sparkles, title: 'Get Printed', desc: 'High-quality print delivered to your door' },
  ];

  const reviews = [
    { name: 'Sarah M.', text: 'Absolutely hilarious shirts! The whole stag party loved them.', rating: 5 },
    { name: 'James T.', text: 'Super easy to use and the quality is amazing. Will order again!', rating: 5 },
    { name: 'Emma K.', text: 'Made our hen do extra special. Everyone wanted to know where we got them!', rating: 5 },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FF2E63] via-[#FF6B8A] to-[#FF9A8B] py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTAtMTZjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Custom Party T-Shirts</span>
              </div>
              
              <h1 className="font-['Anton'] text-5xl sm:text-6xl lg:text-7xl text-white leading-tight mb-6 tracking-wide">
                MAKE YOUR<br />
                <span className="text-[#F9ED69]">PARTY</span><br />
                LEGENDARY
              </h1>
              
              <p className="text-white/90 text-lg mb-8 max-w-md font-['Outfit']">
                Upload a photo, pick a hilarious template, and create custom t-shirts for your stag or hen party in minutes.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/builder">
                  <Button 
                    data-testid="hero-start-btn"
                    className="bg-white text-[#FF2E63] hover:bg-white/90 rounded-full px-8 py-6 text-lg font-bold uppercase tracking-wider shadow-lg"
                  >
                    Start Creating
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/gallery">
                  <Button 
                    data-testid="hero-gallery-btn"
                    variant="outline" 
                    className="border-2 border-white text-white hover:bg-white/10 rounded-full px-8 py-6 text-lg font-bold uppercase tracking-wider"
                  >
                    View Templates
                  </Button>
                </Link>
              </div>
              
              <div className="mt-8 flex items-center gap-6 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Free UK Shipping</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>5-7 Day Delivery</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* T-shirt mockup */}
                <div className="w-80 h-96 bg-white rounded-3xl shadow-2xl mx-auto overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1651761179569-4ba2aa054997?w=400&h=500&fit=crop"
                    alt="T-shirt preview"
                    className="w-full h-full object-cover"
                  />
                  {templates.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img 
                        src={templates[0]?.body_image_url}
                        alt="Template preview"
                        className="w-48 h-auto object-contain"
                      />
                    </div>
                  )}
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 bg-[#F9ED69] text-[#252A34] px-4 py-2 rounded-full font-bold rotate-12 shadow-lg">
                  From £19.99
                </div>
                <div className="absolute -bottom-4 -left-4 bg-[#08D9D6] text-[#252A34] px-4 py-2 rounded-full font-bold -rotate-6 shadow-lg">
                  Bulk Discounts!
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-['Anton'] text-4xl sm:text-5xl text-[#252A34] mb-4 tracking-wide">
              HOW IT WORKS
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Create your perfect party t-shirts in just 4 simple steps
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#FF2E63] to-[#FF6B8A] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#FF2E63]/30">
                  <feature.icon className="w-8 h-8" />
                </div>
                <div className="text-sm text-[#08D9D6] font-bold mb-2">STEP {index + 1}</div>
                <h3 className="font-['Anton'] text-xl text-[#252A34] mb-2 tracking-wide">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/builder">
              <Button 
                data-testid="howit-start-btn"
                className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-8 py-6 text-lg font-bold uppercase tracking-wider shadow-lg shadow-[#FF2E63]/30"
              >
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Templates Preview */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-['Anton'] text-4xl sm:text-5xl text-[#252A34] mb-4 tracking-wide">
              POPULAR TEMPLATES
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose from our collection of hilarious body templates
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.slice(0, 3).map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="card-party p-4 h-full">
                  <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden mb-4">
                    <img 
                      src={template.body_image_url}
                      alt={template.name}
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-[#F9ED69] text-[#252A34] text-xs font-bold rounded-full uppercase">
                        {template.category}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-['Anton'] text-xl text-[#252A34] mb-2 tracking-wide">{template.name}</h3>
                  <Link to={`/builder?template=${template.id}`}>
                    <Button 
                      data-testid={`template-use-${template.id}`}
                      variant="outline"
                      className="w-full rounded-full border-2 border-[#FF2E63] text-[#FF2E63] hover:bg-[#FF2E63] hover:text-white font-bold uppercase tracking-wider"
                    >
                      Use This Template
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/gallery">
              <Button 
                data-testid="view-all-templates-btn"
                variant="outline"
                className="border-2 border-[#252A34] text-[#252A34] hover:bg-[#252A34] hover:text-white rounded-full px-8 py-6 text-lg font-bold uppercase tracking-wider"
              >
                View All Templates
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-['Anton'] text-4xl sm:text-5xl text-[#252A34] mb-4 tracking-wide">
              WHAT OUR CUSTOMERS SAY
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {reviews.map((review, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-party p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-[#F9ED69] text-[#F9ED69]" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{review.text}"</p>
                <p className="font-bold text-[#252A34]">{review.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#252A34]">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-['Anton'] text-4xl sm:text-5xl text-white mb-6 tracking-wide">
              READY TO CREATE<br />
              <span className="text-[#FF2E63]">EPIC PARTY SHIRTS?</span>
            </h2>
            <p className="text-gray-400 mb-8 text-lg max-w-2xl mx-auto">
              Join thousands of happy party-goers who made their celebrations unforgettable with PartyTees
            </p>
            <Link to="/builder">
              <Button 
                data-testid="cta-start-btn"
                className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-10 py-6 text-lg font-bold uppercase tracking-wider shadow-lg shadow-[#FF2E63]/30"
              >
                Start Creating Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
