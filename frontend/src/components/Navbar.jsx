import { Link, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { ShoppingCart, Menu, X, Shirt, Users, HelpCircle, Star } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getCartItemCount } = useStore();
  const cartCount = getCartItemCount();

  const navLinks = [
    { path: '/gallery', label: 'Templates', icon: Shirt },
    { path: '/builder', label: 'Create', icon: Users },
    { path: '/reviews', label: 'Reviews', icon: Star },
    { path: '/faq', label: 'FAQ', icon: HelpCircle },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0" data-testid="nav-logo">
            <img
              src="/logo192.png"
              alt="Swap My Face Tees"
              className="h-10 w-10 rounded-full object-cover flex-shrink-0"
            />
            <img
              src="/logo_text.png"
              alt="Swap My Face Tees"
              className="h-8 object-contain hidden sm:block"
              style={{ maxWidth: '170px', mixBlendMode: 'multiply' }}
            />
            <span className="font-['Anton'] text-lg tracking-wide text-gray-900 sm:hidden">SWAP MY FACE</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-medium transition-colors text-sm ${
                  location.pathname === link.path
                    ? 'text-[#FF2E63]'
                    : 'text-gray-600 hover:text-[#FF2E63]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Cart & CTA */}
          <div className="flex items-center gap-3">
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF2E63] text-white text-xs flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            <Link to="/builder" className="hidden sm:block">
              <Button className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-5 font-bold uppercase tracking-wider text-sm">
                Start Creating
              </Button>
            </Link>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    location.pathname === link.path
                      ? 'bg-[#FF2E63]/10 text-[#FF2E63]'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              ))}
              <div className="px-4 mt-3">
                <Link to="/builder" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full font-bold uppercase tracking-wider">
                    Start Creating
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
