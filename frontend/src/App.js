import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useStore } from "@/store/useStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Inject Google tag
function loadGoogleTag(tagId) {
  if (!tagId || document.getElementById('gtag-script')) return;
  const script = document.createElement('script');
  script.id = 'gtag-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${tagId}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', tagId);
}

// Inject Facebook Pixel
function loadFacebookPixel(pixelId) {
  if (!pixelId || window.fbq) return;
  !function(f,b,e,v,n,t,s){
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

// Pages
import HomePage from "@/pages/HomePage";
import GalleryPage from "@/pages/GalleryPage";
import BuilderPage from "@/pages/BuilderPage";
import EmbedBuilderPage from "@/pages/EmbedBuilderPage";
import CartPage from "@/pages/CartPage";
import AdminPage from "@/pages/AdminPage";
import FAQPage from "@/pages/FAQPage";
import ShippingPage from "@/pages/ShippingPage";
import ContactPage from "@/pages/ContactPage";
import ReviewsPage from "@/pages/ReviewsPage";
import TermsPage from "@/pages/TermsPage";
import CustomOrderPage from "@/pages/CustomOrderPage";

// Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function App() {
  const { fetchPricing } = useStore();

  useEffect(() => {
    fetchPricing();
    // Load tracking pixels from backend config
    fetch(`${API}/tracking-config`)
      .then(r => r.ok ? r.json() : {})
      .then(config => {
        if (config.google_tag_id) loadGoogleTag(config.google_tag_id);
        if (config.facebook_pixel_id) loadFacebookPixel(config.facebook_pixel_id);
      })
      .catch(() => {});
  }, [fetchPricing]);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/embed" element={<EmbedBuilderPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/shipping" element={<ShippingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/custom-order" element={<CustomOrderPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <Toaster />
      <WhatsAppButton />
    </BrowserRouter>
  );
}
