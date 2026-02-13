import { Link, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { ShoppingCart, Menu, X, PartyPopper, Shirt, Users, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getCartItemCount } = useStore();
  const cartCount = getCartItemCount();

  const navLinks = [
    { path: '/', label: 'Home', icon: PartyPopper },
    { path: '/gallery', label: 'Templates', icon: Shirt },
    { path: '/builder', label: 'Create', icon: Users },
    { path: '/faq', label: 'FAQ', icon: HelpCircle },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
            <div className="w-10 h-10 rounded-full bg-[#FF2E63] flex items-center justify-center">
              <PartyPopper className="w-5 h-5 text-white" />
            </div>
            <span className="font-['Anton'] text-xl tracking-wide text-gray-900">PARTYTEES</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                data-testid={`nav-${link.label.toLowerCase()}`}
                className={`font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-[#FF2E63]'
                    : 'text-gray-600 hover:text-[#FF2E63]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Cart & Mobile Menu */}
          <div className="flex items-center gap-4">
            <Link to="/cart" data-testid="nav-cart" className="relative">
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
              <Button 
                data-testid="nav-start-creating"
                className="bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full px-6 font-bold uppercase tracking-wider text-sm"
              >
                Start Creating
              </Button>
            </Link>

            {/* Mobile menu button */}
            <button
              data-testid="mobile-menu-toggle"
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
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  data-testid={`mobile-nav-${link.label.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === link.path
                      ? 'bg-[#FF2E63]/10 text-[#FF2E63]'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              ))}
              <Link
                to="/builder"
                onClick={() => setMobileMenuOpen(false)}
                className="mx-4 mt-2"
              >
                <Button 
                  className="w-full bg-[#FF2E63] hover:bg-[#E01A4F] text-white rounded-full font-bold uppercase tracking-wider"
                >
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
