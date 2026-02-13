import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useStore } from "@/store/useStore";

// Pages
import HomePage from "@/pages/HomePage";
import GalleryPage from "@/pages/GalleryPage";
import BuilderPage from "@/pages/BuilderPage";
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

  return (
    <div className="min-h-screen flex flex-col">
      <BrowserRouter>
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/builder" element={<BuilderPage />} />
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
    </div>
  );
}

export default App;
