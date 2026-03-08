import { Link, useLocation } from "react-router-dom";
import { Menu, X, Moon, Sun, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Cart } from "./Cart";


interface PageVisibilitySettings {
  showSellPage: boolean;
  showAffiliatePage: boolean;
}

const SETTINGS_KEY = 'purin_admin_page_settings';

const getMenuItems = (settings: PageVisibilitySettings) => {
  const items = [
    { path: "/products", label: "Sản phẩm", alwaysShow: true },
  ];
  
  if (settings.showSellPage) {
    items.push({ path: "/sell", label: "Đăng bán", alwaysShow: false });
  }
  
  if (settings.showAffiliatePage) {
    items.push({ path: "/affiliate-register", label: "CTV", alwaysShow: false });
  }
  
  items.push(
    { path: "/policy", label: "Chính sách", alwaysShow: true },
    { path: "/contact", label: "Thông tin", alwaysShow: true },
    { path: "/track-order", label: "Tra đơn", alwaysShow: true }
  );
  
  return items;
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [pageSettings, setPageSettings] = useState<PageVisibilitySettings>({
    showSellPage: false,
    showAffiliatePage: false
  });

  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
    
    // Load page visibility settings
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        setPageSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Error parsing page settings:", e);
      }
    }

    // Listen for settings changes from admin panel
    const handleSettingsChange = (event: CustomEvent<PageVisibilitySettings>) => {
      setPageSettings(event.detail);
    };
    
    window.addEventListener('pageSettingsChanged', handleSettingsChange as EventListener);
    
    return () => {
      window.removeEventListener('pageSettingsChanged', handleSettingsChange as EventListener);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const menuItems = getMenuItems(pageSettings);

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
      
      {/* Messenger Chat Widget */}
      <a
        href="https://m.me/105759462451542"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#0084FF] hover:bg-[#0073E6] text-white rounded-full p-3.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
        title="Chat với chúng tôi qua Messenger"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      </a>
    </div>
  );
};
