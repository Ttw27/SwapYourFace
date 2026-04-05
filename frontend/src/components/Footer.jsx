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

        {/* Social links */}
        <div className="border-t border-white/10 mt-10 pt-8 pb-4">
          <div className="flex items-center justify-center gap-4 mb-6">
            <a href="https://www.facebook.com/profile.php?id=61576415245959" target="_blank" rel="noreferrer"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#1877F2] flex items-center justify-center transition-colors"
              aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://www.instagram.com/swapmyfaceuk/" target="_blank" rel="noreferrer"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-gradient-to-br hover:from-[#f09433] hover:to-[#bc1888] flex items-center justify-center transition-colors"
              aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="https://www.tiktok.com/@swapmyfaceofficial" target="_blank" rel="noreferrer"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-black flex items-center justify-center transition-colors"
              aria-label="TikTok">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.02-.07z"/></svg>
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
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
