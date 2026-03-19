import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#252A34] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src="/logo192.png" alt="Swap My Face Tees" className="w-10 h-10 rounded-full object-cover" />
              <img src="/logo_text.png" alt="Swap My Face Tees" className="h-6 object-contain" style={{ maxWidth: '130px', filter: 'brightness(0) invert(1)' }} />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Custom face t-shirts for your stag &amp; hen parties. Upload a photo, pick a template, and we do the rest.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-['Anton'] text-lg mb-4 tracking-wide">QUICK LINKS</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/gallery', label: 'Templates' },
                { to: '/builder', label: 'Create Your Design' },
                { to: '/reviews', label: 'Customer Reviews' },
                { to: '/faq', label: 'FAQ' },
                { to: '/shipping', label: 'Shipping & Returns' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-gray-400 hover:text-[#FF2E63] transition-colors text-sm">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-['Anton'] text-lg mb-4 tracking-wide">CONTACT US</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="mailto:support@swapmyface.co.uk" className="hover:text-[#FF2E63] transition-colors">
                  support@swapmyface.co.uk
                </a>
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href="https://wa.me/447822032847" target="_blank" rel="noreferrer" className="hover:text-[#FF2E63] transition-colors">
                  +44 7822 032847
                </a>
              </li>
              <li className="flex items-start gap-2 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Unit 1, 651 Melton Road<br />Leicester, LE4 8EB</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-['Anton'] text-lg mb-4 tracking-wide">FOLLOW US</h4>
            <div className="flex gap-3">
              <a href="https://instagram.com/swapmyfacetees" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-[#FF2E63] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-[#FF2E63] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-[#FF2E63] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
            <div className="mt-6">
              <p className="text-gray-400 text-sm mb-2">We accept:</p>
              <div className="flex gap-2 text-gray-500 text-xs flex-wrap">
                <span className="px-2 py-1 bg-gray-700 rounded">Visa</span>
                <span className="px-2 py-1 bg-gray-700 rounded">Mastercard</span>
                <span className="px-2 py-1 bg-gray-700 rounded">PayPal</span>
                <span className="px-2 py-1 bg-gray-700 rounded">Apple Pay</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm text-center md:text-left">
              © {new Date().getFullYear()} Swap My Face Tees. All rights reserved. Registered in England & Wales.
            </p>
            <div className="flex gap-4 sm:gap-6 text-sm text-gray-500 flex-wrap justify-center">
              <Link to="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link>
              <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
