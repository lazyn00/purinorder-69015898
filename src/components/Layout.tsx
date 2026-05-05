import { Link, useLocation } from "react-router-dom";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Cart } from "./Cart";
import { ScrollToTop } from "./ScrollToTop";
import { InAppBrowserBanner } from "./InAppBrowserBanner";
import { tenant } from "@/config/tenant"; // ← THÊM

const menuItems = [
  { path: "/products", label: "Sản phẩm" },
  { path: "/shops", label: "Shops" },
  { path: "/policy", label: "Chính sách" },
  { path: "/contact", label: "Thông tin" },
  { path: "/track-order", label: "Tra đơn" },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showMessengerPopup, setShowMessengerPopup] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      // Apply dark vars khi load từ localStorage
      if (savedTheme === 'dark') {
        Object.entries(tenant.cssVarsDark).forEach(([key, val]) => {
          document.documentElement.style.setProperty(key, val);
        });
      } else {
        Object.entries(tenant.cssVars).forEach(([key, val]) => {
          document.documentElement.style.setProperty(key, val);
        });
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    // Apply đúng màu tenant khi toggle
    const vars = newTheme === 'dark' ? tenant.cssVarsDark : tenant.cssVars;
    Object.entries(vars).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });
  };

  const openMessengerChat = useCallback(() => {
    setShowMessengerPopup(true);
  }, []);

  const handleOpenApp = useCallback(() => {
    setShowMessengerPopup(false);
    window.location.href = "fb-messenger://user-thread/105759462451542";
  }, []);

  const handleOpenWeb = useCallback(() => {
    setShowMessengerPopup(false);
    window.open("https://www.facebook.com/messages/t/puorderin", "_blank", "noopener,noreferrer");
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <InAppBrowserBanner />
      <div className="sticky top-0 z-50">
        <header className="border-b bg-card">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* ← SỬA: dùng tenant.shopName và tenant.logo */}
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
  {tenant.emoji} {tenant.shopName}
</Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === item.path
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Cart />
            </div>

            {/* Mobile Menu Button and Cart */}
            <div className="flex items-center gap-2 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Cart />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === item.path
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </header>
      
      {/* Running Announcement Banner */}
      <div className="bg-primary text-primary-foreground overflow-hidden whitespace-nowrap">
        <div className="animate-marquee inline-block py-2 text-sm font-medium">
          <span className="mx-8">🍮 Hàng pre-order thời gian sản xuất lâu, cân nhắc kỹ trước khi đặt hàng 🍮</span>
          <span className="mx-8">📦 Hàng order về từ 5-15 ngày sau khi kho Trung nhận được hàng 📦</span>
          <span className="mx-8">🍮 Hàng pre-order thời gian sản xuất lâu, cân nhắc kỹ trước khi đặt hàng 🍮</span>
          <span className="mx-8">📦 Hàng order về từ 5-15 ngày sau khi kho Trung nhận được hàng 📦</span>
        </div>
      </div>
      </div>

      <main className="flex-1">{children}</main>

      {/* ← SỬA: footer dùng tenant.shopName */}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            © 2024 {tenant.shopName}. All rights reserved.
          </div>
        </div>
      </footer>
      
      <ScrollToTop />

      {/* Messenger Chat Widget */}
      <button
        type="button"
        onClick={openMessengerChat}
        className="fixed bottom-20 right-6 z-50 bg-[#0084FF] hover:bg-[#0073E6] text-white rounded-full p-3.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        title="Chat với chúng tôi qua Messenger"
        aria-label="Mở chat Messenger"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.2 5.42 3.15 7.2V22l2.96-1.63c.84.23 1.72.36 2.64.36h.25c5.64 0 10-4.13 10-9.7S17.64 2 12 2zm1.05 13.07l-2.54-2.72L5.8 15.07l5.13-5.45 2.6 2.72 4.65-2.72-5.13 5.45z"/>
        </svg>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      </button>

      {/* Messenger Popup */}
      {showMessengerPopup && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={() => setShowMessengerPopup(false)}
          />
          <div className="fixed bottom-36 right-6 z-[70] bg-card border rounded-xl shadow-2xl p-4 w-64 space-y-3 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-sm font-semibold text-foreground">Mở chat Messenger</p>
            <p className="text-xs text-muted-foreground">Chọn cách mở phù hợp với bạn:</p>
            <button
              onClick={handleOpenApp}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#0084FF] text-white text-sm font-medium hover:bg-[#0073E6] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.2 5.42 3.15 7.2V22l2.96-1.63c.84.23 1.72.36 2.64.36h.25c5.64 0 10-4.13 10-9.7S17.64 2 12 2zm1.05 13.07l-2.54-2.72L5.8 15.07l5.13-5.45 2.6 2.72 4.65-2.72-5.13 5.45z"/>
              </svg>
              Mở bằng App Messenger
            </button>
            <button
              onClick={handleOpenWeb}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              Mở bằng trình duyệt
            </button>
          </div>
        </>
      )}
    </div>
  );
};
