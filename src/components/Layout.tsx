import { Link, useLocation } from "react-router-dom";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Cart } from "./Cart";
import { ScrollToTop } from "./ScrollToTop";
import { InAppBrowserBanner } from "./InAppBrowserBanner";
import { tenant } from "@/config/tenant";

const hostname = window.location.hostname;
const isPurin = hostname === 'purinorder.vercel.app' || hostname === 'localhost' || hostname === '127.0.0.1';

const menuItems = [
  { path: "/products", label: "Sản phẩm" },
  { path: "/shops", label: "Shops" },
  { path: "/policy", label: "Chính sách" },
  { path: "/contact", label: "Thông tin" },
  { path: "/track-order", label: "Tra đơn" },
].filter(item => isPurin || item.path !== "/contact");

const { contactWidget } = tenant;

// Icon Messenger
const MessengerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.2 5.42 3.15 7.2V22l2.96-1.63c.84.23 1.72.36 2.64.36h.25c5.64 0 10-4.13 10-9.7S17.64 2 12 2zm1.05 13.07l-2.54-2.72L5.8 15.07l5.13-5.45 2.6 2.72 4.65-2.72-5.13 5.45z"/>
  </svg>
);

// Icon Instagram
const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showContactPopup, setShowContactPopup] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      if (!isPurin) {
        const vars = savedTheme === 'dark' ? tenant.cssVarsDark : tenant.cssVars;
        Object.entries(vars).forEach(([key, val]) => {
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
    if (!isPurin) {
      const vars = newTheme === 'dark' ? tenant.cssVarsDark : tenant.cssVars;
      Object.entries(vars).forEach(([key, val]) => {
        document.documentElement.style.setProperty(key, val);
      });
    }
  };

  const handleOpenApp = useCallback(() => {
    setShowContactPopup(false);
    window.location.href = contactWidget.primaryAppUrl;
  }, []);

  const handleOpenWeb = useCallback(() => {
    setShowContactPopup(false);
    window.open(contactWidget.secondaryUrl, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <InAppBrowserBanner />
      <div className="sticky top-0 z-50">
        <header className="border-b bg-card">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
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
                      location.pathname === item.path ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Cart />
              </div>

              {/* Mobile */}
              <div className="flex items-center gap-2 md:hidden">
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Cart />
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
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
                      location.pathname === item.path ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </nav>
        </header>

        {/* Banner */}
        <div className="bg-primary text-primary-foreground overflow-hidden whitespace-nowrap">
          <div className="animate-marquee inline-block py-2 text-sm font-medium">
            <span className="mx-8">{tenant.emoji} Hàng pre-order thời gian sản xuất lâu, cân nhắc kỹ trước khi đặt hàng {tenant.emoji}</span>
            <span className="mx-8">📦 Hàng order về từ 5-15 ngày sau khi kho Trung nhận được hàng 📦</span>
            <span className="mx-8">{tenant.emoji} Hàng pre-order thời gian sản xuất lâu, cân nhắc kỹ trước khi đặt hàng {tenant.emoji}</span>
            <span className="mx-8">📦 Hàng order về từ 5-15 ngày sau khi kho Trung nhận được hàng 📦</span>
          </div>
        </div>
      </div>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            © 2024 {tenant.shopName}. All rights reserved.
          </div>
        </div>
      </footer>

      <ScrollToTop />

      {/* Contact Widget Button */}
      <button
        type="button"
        onClick={() => setShowContactPopup(true)}
        className={`fixed bottom-20 right-6 z-50 ${contactWidget.buttonColor} text-white rounded-full p-3.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110`}
        title="Liên hệ với chúng tôi"
        aria-label="Mở chat"
      >
        {contactWidget.isInstagram ? <InstagramIcon /> : <MessengerIcon />}
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      </button>

      {/* Contact Popup */}
      {showContactPopup && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setShowContactPopup(false)} />
          <div className="fixed bottom-36 right-6 z-[70] bg-card border rounded-xl shadow-2xl p-4 w-64 space-y-3 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-sm font-semibold text-foreground">{contactWidget.popupTitle}</p>
            <p className="text-xs text-muted-foreground">{contactWidget.popupDesc}</p>
            <button
              onClick={handleOpenApp}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-white text-sm font-medium transition-colors ${contactWidget.buttonColor}`}
            >
              {contactWidget.isInstagram ? <InstagramIcon /> : <MessengerIcon />}
              {contactWidget.primaryLabel}
            </button>
            <button
              onClick={handleOpenWeb}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              {contactWidget.secondaryLabel}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
