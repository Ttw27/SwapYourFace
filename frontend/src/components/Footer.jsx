import { Link } from 'react-router-dom';
import { PartyPopper, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#252A34] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FF2E63] flex items-center justify-center">
                <PartyPopper className="w-5 h-5 text-white" />
              </div>
              <span className="font-['Anton'] text-xl tracking-wide">PARTYTEES</span>
            </Link>
            <p className="text-gray-400 text-sm">
              Custom printed t-shirts for your stag & hen parties. Make memories that last!
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-['Anton'] text-lg mb-4 tracking-wide">QUICK LINKS</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/gallery" className="text-gray-400 hover:text-[#FF2E63] transition-colors text-sm">
                  Templates
                </Link>
              </li>
              <li>
                <Link to="/builder" className="text-gray-400 hover:text-[#FF2E63] transition-colors text-sm">
                  Create Your Design
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-[#FF2E63] transition-colors text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-gray-400 hover:text-[#FF2E63] transition-colors text-sm">
                  Shipping & Returns
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-['Anton'] text-lg mb-4 tracking-wide">CONTACT US</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Mail className="w-4 h-4" />
                hello@partytees.co.uk
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Phone className="w-4 h-4" />
                +44 123 456 7890
              </li>
              <li className="flex items-start gap-2 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>123 Party Street<br />London, UK</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-['Anton'] text-lg mb-4 tracking-wide">FOLLOW US</h4>
            <div className="flex gap-4">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-[#FF2E63] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-[#FF2E63] transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-[#FF2E63] transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
            <div className="mt-6">
              <p className="text-gray-400 text-sm mb-2">We accept:</p>
              <div className="flex gap-2 text-gray-500 text-xs">
                <span className="px-2 py-1 bg-gray-700 rounded">Visa</span>
                <span className="px-2 py-1 bg-gray-700 rounded">Mastercard</span>
                <span className="px-2 py-1 bg-gray-700 rounded">PayPal</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} PartyTees. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link to="/shipping" className="hover:text-white transition-colors">
                Shipping Policy
              </Link>
              <a href="#privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#terms" className="hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
