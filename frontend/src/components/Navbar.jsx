import { Link, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const LOGO_ICON = '/logo192.png';
const LOGO_TEXT = 'https://res.cloudinary.com/dqlrmqhte/image/upload/v1774533063/Swap_My_Face_Logo_Text_Transparent_imwzqc.png';

export const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getCartItemCount } = useStore();
  const cartCount = getCartItemCount();

  const navLinks = [
    { path: '/gallery', label: 'Templates' },
    { path: '/builder', label: 'Create' },
    { path: '/reviews', label: 'Reviews' },
    { path: '/faq', label: 'FAQ' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={LOGO_ICON} alt="Swap My Face Tees" className="w-9 h-9 rounded-full object-cover" style={{ mixBlendMode: 'multiply' }} />
            <img src={LOGO_TEXT} alt="Swap My Face Tees" className="h-7 w-auto object-contain" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path}
                className={`text-sm font-medium transition-colors ${location.pathname === link.path ? 'text-[#FF2E63]' : 'text-gray-600 hover:text-[#FF2E63]'}`}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link to="/cart" className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF2E63] text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link to="/builder" className="hidden sm:block">
              <Button className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wider">
                Start Creating
              </Button>
            </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-full hover:bg-gray-100">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-1">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${location.pathname === link.path ? 'bg-[#FF2E63]/10 text-[#FF2E63]' : 'text-gray-600 hover:bg-gray-50'}`}>
                {link.label}
              </Link>
            ))}
            <div className="pt-2 px-4">
              <Link to="/builder" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full py-3 font-bold uppercase tracking-wider">
                  Start Creating
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
