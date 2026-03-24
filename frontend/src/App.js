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
import TermsPage from "@/pages/TermsPage";
import CustomOrderPage from "@/pages/CustomOrderPage";

// Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function App() {
  const { fetchPricing } = useStore();

  useEffect(() => {
    fetchPricing();
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
    </BrowserRouter>
  );
}
