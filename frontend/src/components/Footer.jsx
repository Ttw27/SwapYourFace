import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const LOGO_ICON = '/logo192.png';
const LOGO_TEXT = 'https://res.cloudinary.com/dqlrmqhte/image/upload/v1774533063/Swap_My_Face_Logo_Text_Transparent_imwzqc.png';

export const Footer = () => {
  return (
    <footer className="bg-[#252A34] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={LOGO_ICON} alt="Swap My Face Tees" className="w-9 h-9 rounded-full object-cover" />
              <img src={LOGO_TEXT} alt="Swap My Face Tees" className="h-7 w-auto object-contain" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Custom printed face t-shirts for stag dos, hen parties and more. Make memories that last!
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-['Anton'] text-sm tracking-wide mb-4 text-gray-300">QUICK LINKS</h3>
            <ul className="space-y-2">
              {[
                { to: '/gallery', label: 'Templates' },
                { to: '/builder', label: 'Create Your Design' },
                { to: '/custom-order', label: 'Custom Order Service' },
                { to: '/reviews', label: 'Customer Reviews' },
                { to: '/faq', label: 'FAQs' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-gray-400 hover:text-white text-sm transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-['Anton'] text-sm tracking-wide mb-4 text-gray-300">INFORMATION</h3>
            <ul className="space-y-2">
              {[
                { to: '/shipping', label: 'Shipping & Returns' },
                { to: '/terms', label: 'Terms of Service' },
                { to: '/contact', label: 'Contact Us' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-gray-400 hover:text-white text-sm transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-['Anton'] text-sm tracking-wide mb-4 text-gray-300">CONTACT</h3>
            <ul className="space-y-3">
              <li>
                <a href="mailto:support@swapmyface.co.uk" className="flex items-start gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                  <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  support@swapmyface.co.uk
                </a>
              </li>
              <li>
                <a href="https://wa.me/447822032847" target="_blank" rel="noreferrer" className="flex items-start gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                  <Phone className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  +44 7822 032847
                </a>
              </li>
              <li>
                <div className="flex items-start gap-2 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Unit 1, 651 Melton Road<br />Leicester, LE4 8EB</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Swap My Face Tees — TEZL GROUP LTD. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-gray-300 transition-colors">Terms</Link>
            <Link to="/shipping" className="hover:text-gray-300 transition-colors">Returns</Link>
            <Link to="/contact" className="hover:text-gray-300 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
