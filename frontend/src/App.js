import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useStore } from "@/store/useStore";

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

// Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

function App() {
  const { fetchTemplates, fetchPricing } = useStore();
  const location = window.location;
  const isEmbed = location.pathname === '/embed';

  useEffect(() => {
    const initData = async () => {
      try {
        await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/templates/seed`, {
          method: 'POST'
        });
        await fetchTemplates();
        await fetchPricing();
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };
    initData();
  }, [fetchTemplates, fetchPricing]);

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
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <BrowserRouter>
        <Navbar />
        <main className="flex-1 w-full">
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
          </Routes>
        </main>
        <Footer />
        <WhatsAppButton />
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
