import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useStore } from "@/store/useStore";
import WhatsAppButton from '@/components/WhatsAppButton';
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

// Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function App() {
  const { fetchTemplates, fetchPricing } = useStore();
  const location = window.location;
  const isEmbed = location.pathname === '/embed';

  useEffect(() => {
    // Seed templates and fetch data on load
    const initData = async () => {
      try {
        // Seed templates
        await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/templates/seed`, {
          method: 'POST'
        });
        // Fetch templates and pricing
        await fetchTemplates();
        await fetchPricing();
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };
    initData();
  }, [fetchTemplates, fetchPricing]);

  // Render embed version without navbar/footer
  if (isEmbed) {
    return (
      <div className="min-h-screen">
        <BrowserRouter>
          <Routes>
            <Route path="/embed" element={<EmbedBuilderPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <BrowserRouter>
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
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
      <Toaster position="top-right" />
    <WhatsAppButton />
    </div>
  );
}

export default App;
