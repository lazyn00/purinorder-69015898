import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import { tenant } from "./config/tenant";
import Products from "./pages/Products";
import CategoryPage from "./pages/CategoryPage";
import ProductDetail from "./pages/ProductDetail";
import Policy from "./pages/Policy";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import TrackOrder from "./pages/TrackOrder";
import Admin from "./pages/Admin";
import AdminOrderDetail from "./pages/AdminOrderDetail";
import CustomerOrderDetail from "./pages/CustomerOrderDetail";
import Shops from "./pages/Shops";
import ShopDetail from "./pages/ShopDetail";

// Chỉ apply CSS vars nếu KHÔNG phải Purin
// Purin dùng màu gốc từ index.css, không override
const hostname = window.location.hostname;
const isPurin = hostname === 'purinorder.vercel.app' || hostname === 'localhost' || hostname === '127.0.0.1';

if (!isPurin) {
  const root = document.documentElement;
  Object.entries(tenant.cssVars).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });
  document.title = tenant.shopName;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Products />} />
            <Route path="/products" element={<Products />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/policy" element={<Policy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/order/:orderId" element={<CustomerOrderDetail />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/order/:orderId" element={<AdminOrderDetail />} />
            <Route path="/shops" element={<Shops />} />
            <Route path="/shop/:slug" element={<ShopDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
