import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { Search } from 'lucide-react';

export default function GalleryPage() {
  const { templates, fetchTemplates, templatesLoading } = useStore();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [lowestPrice, setLowestPrice] = useState(null);

  useEffect(() => {
    if (templates.length === 0) fetchTemplates();
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pricing`)
      .then(r => r.ok ? r.json() : {})
      .then(data => { if (data.tiers) setLowestPrice(Math.min(...data.tiers.map(t => t.price))); })
      .catch(() => {});
  }, [templates.length, fetchTemplates]);

  const filteredTemplates = templates.filter(template => {
    const cats = template.categories || [template.category];
    const matchesFilter = filter === 'all' || cats.includes(filter);
    const matchesSearch = template.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'stag', label: 'Stag Do' },
    { key: 'hen', label: 'Hen Party' },
    { key: 'party', label: 'Party' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <section className="bg-white py-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h1 className="font-['Anton'] text-4xl sm:text-5xl text-[#252A34] mb-3 tracking-wide">TEMPLATES</h1>
          <p className="text-gray-500 mb-6">Choose your favourite — or <Link to="/custom-order" className="text-[#FF2E63] hover:underline">let us create one just for you</Link></p>
          {/* Search */}
          <div className="relative max-w-md mx-auto mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF2E63]/20 focus:border-[#FF2E63]"
            />
          </div>
          {/* Filters */}
          <div className="flex gap-2 justify-center flex-wrap">
            {filters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${filter === f.key ? 'bg-[#FF2E63] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
        {/* Skin tone note */}
      <div className="mb-6 p-4 bg-[#FFF9E6] border border-[#FFE600] rounded-xl flex items-start gap-3">
        <span className="text-lg flex-shrink-0">🎨</span>
        <p className="text-sm text-gray-600">
          Our templates are stylised illustrations — if you'd like a template that better suits your group's skin tones, head to our{' '}
          <a href="/custom-order" className="text-[#FF2E63] font-medium hover:underline">Custom Order service</a>{' '}
          and we'll create something just for you.
        </p>
      </div>

      {templatesLoading ? (
          <div className="text-center py-20 text-gray-400">Loading templates...</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No templates found</div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-6">{filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}</p>
            {/* 2 cols on mobile, 3 on sm, 4 on lg */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredTemplates.map((template, i) => (
                <motion.div key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                  <div className="aspect-square bg-gray-50 overflow-hidden">
                    <img
                      src={template.product_image_url || template.body_image_url}
                      alt={template.name}
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="p-3 sm:p-4">
                    <p className="font-bold text-[#252A34] text-sm truncate mb-1">{template.name}</p>
                    <div className="flex gap-1 flex-wrap mb-3">
                      {(template.categories || [template.category]).filter(Boolean).map(cat => (
                        <span key={cat} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{cat}</span>
                      ))}
                    </div>
                    <Link to={`/builder?template=${template.id}`}>
                      <Button className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-2 text-xs sm:text-sm font-bold uppercase tracking-wider">
                        Use This
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
