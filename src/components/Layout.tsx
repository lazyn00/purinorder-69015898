import { Link, useLocation } from "react-router-dom";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Cart } from "./Cart";
import { ScrollToTop } from "./ScrollToTop";

const menuItems = [
  { path: "/products", label: "Sản phẩm" },
  { path: "/sell", label: "Đăng bán" },
  { path: "/affiliate-register", label: "CTV" },
  { path: "/policy", label: "Chính sách" },
  { path: "/contact", label: "Thông tin" },
  { path: "/track-order", label: "Tra đơn" },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-50">
        <header className="border-b bg-card">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary">
              🍮 Purin Order
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
      
      {/* Running Announcement Banner - below menu, sticky together */}
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

      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            © 2024 Purin Order. All rights reserved.
          </div>
        </div>
      </footer>
      
      <ScrollToTop />
    </div>
  );
};
