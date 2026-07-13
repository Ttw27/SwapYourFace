import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Pages - Existing
import HomePage from '@/pages/HomePage';
import BuilderPage from '@/pages/BuilderPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrderConfirmation from '@/pages/OrderConfirmation';

// Pages - NEW IMPORTS (ADD THESE)
import AdminOrders from '@/pages/AdminOrders';
import AdminBuilder from '@/pages/AdminBuilder';

// Admin/Auth pages (if you have them)
import AdminDashboard from '@/pages/AdminDashboard';
import LoginPage from '@/pages/LoginPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/builder" element={<BuilderPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />

        {/* Admin Routes - NEW (ADD THESE) */}
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/builder" element={<AdminBuilder />} />
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster position="top-right" />
    </Router>
  );
}

export default App;
