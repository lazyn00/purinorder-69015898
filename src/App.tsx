// App.jsx (hoặc tên file chứa component App)

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
// Xóa dòng import Index này:
// import Index from "./pages/Index"; 
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Policy from "./pages/Policy";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Checkout from "./pages/Checkout";
import TrackOrder from "./pages/TrackOrder";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* THAY ĐỔI DÒNG NÀY: */}
            {/* Thay <Route path="/" element={<Index />} /> */}
            {/* Bằng cách đặt component Products vào đường dẫn gốc / */}
            <Route path="/" element={<Products />} /> 

            {/* Nếu bạn không muốn trang Products cũng có ở /products nữa thì có thể xóa dòng sau, 
               nhưng thường thì nên giữ lại để người dùng vẫn có thể truy cập qua đường dẫn này */}
            <Route path="/products" element={<Products />} /> 
            
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/policy" element={<Policy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
