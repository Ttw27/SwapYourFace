import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { Search, Filter, Sparkles, TrendingUp, Clock } from 'lucide-react';

export default function GalleryPage() {
  const { templates, fetchTemplates, templatesLoading } = useStore();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (templates.length === 0) {
      fetchTemplates();
    }
  }, [templates.length, fetchTemplates]);

  const filteredTemplates = templates.filter(template => {
    const matchesFilter = filter === 'all' || 
      (filter === 'stag' && template.category === 'stag') ||
      (filter === 'hen' && template.category === 'hen') ||
      (filter === 'popular' && template.is_popular) ||
      (filter === 'new' && template.is_new);
    
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const filterOptions = [
    { value: 'all', label: 'All Templates', icon: Filter },
    { value: 'stag', label: 'Stag Party', icon: null },
    { value: 'hen', label: 'Hen Party', icon: null },
    { value: 'popular', label: 'Popular', icon: TrendingUp },
    { value: 'new', label: 'New', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-['Anton'] text-4xl sm:text-5xl text-[#252A34] mb-4 tracking-wide">
              TEMPLATE GALLERY
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose from our collection of hilarious body templates for your party t-shirts
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-white border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="gallery-search"
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF2E63]/20 focus:border-[#FF2E63]"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex gap-2 flex-wrap justify-center">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  data-testid={`filter-${option.value}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === option.value
                      ? 'bg-[#FF2E63] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.icon && <option.icon className="w-4 h-4 inline-block mr-1" />}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {templatesLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card-party p-4">
                  <div className="aspect-square bg-gray-100 rounded-xl skeleton mb-4" />
                  <div className="h-6 bg-gray-100 rounded skeleton mb-2" />
                  <div className="h-10 bg-gray-100 rounded skeleton" />
                </div>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-20">
              <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-['Anton'] text-2xl text-gray-400 mb-2">NO TEMPLATES FOUND</h3>
              <p className="text-gray-500">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <div className="card-party p-4 h-full flex flex-col">
                    <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden mb-4">
                      <img 
                        src={template.body_image_url}
                        alt={template.name}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-3 py-1 bg-[#F9ED69] text-[#252A34] text-xs font-bold rounded-full uppercase">
                          {template.category}
                        </span>
                        {template.is_popular && (
                          <span className="px-3 py-1 bg-[#FF2E63] text-white text-xs font-bold rounded-full uppercase">
                            Popular
                          </span>
                        )}
                        {template.is_new && (
                          <span className="px-3 py-1 bg-[#08D9D6] text-[#252A34] text-xs font-bold rounded-full uppercase">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="font-['Anton'] text-lg text-[#252A34] mb-3 tracking-wide">{template.name}</h3>
                    <div className="mt-auto">
                      <Link to={`/builder?template=${template.id}`}>
                        <Button 
                          data-testid={`gallery-use-${template.id}`}
                          className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full font-bold uppercase tracking-wider"
                        >
                          Use Template
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-['Anton'] text-3xl text-[#252A34] mb-4 tracking-wide">
            CAN'T FIND WHAT YOU'RE LOOKING FOR?
          </h2>
          <p className="text-gray-600 mb-6">
            Contact us for custom template requests or bulk order inquiries
          </p>
          <Link to="/contact">
            <Button 
              variant="outline"
              className="border-2 border-[#252A34] text-[#252A34] hover:bg-[#252A34] hover:text-white rounded-full px-8 py-4 font-bold uppercase tracking-wider"
            >
              Contact Us
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
