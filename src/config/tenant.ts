export type TenantConfig = {
  shopName: string;
  logo: string;
  favicon: string;
  description: string;
  cssVars: Record<string, string>;
  cssVarsDark: Record<string, string>;
};

const tenants: Record<string, TenantConfig> = {
  // ── Shop của bạn (giữ nguyên màu hiện tại) ──
  'purinorder.vercel.app': {
    shopName: 'Purin Order',
    emoji: '🍮', 
    favicon: '/favicon-purin.ico',
    description: 'Người ta có khách iu của Purin cũng phải có!!!',
    cssVars: {
      '--background':        '45 100% 97%',
      '--foreground':        '30 20% 20%',
      '--card':              '45 100% 99%',
      '--card-foreground':   '30 20% 20%',
      '--primary':           '340 85% 85%',
      '--primary-foreground':'30 20% 20%',
      '--secondary':         '40 95% 85%',
      '--secondary-foreground':'30 20% 20%',
      '--muted':             '45 60% 92%',
      '--muted-foreground':  '30 15% 45%',
      '--accent':            '25 60% 75%',
      '--accent-foreground': '30 20% 20%',
      '--border':            '45 40% 85%',
      '--input':             '45 40% 85%',
      '--ring':              '340 85% 85%',
      '--gradient-primary':  'linear-gradient(135deg, hsl(340 85% 85%), hsl(340 80% 90%))',
      '--gradient-soft':     'linear-gradient(180deg, hsl(45 100% 97%), hsl(340 100% 95%))',
      '--sidebar-background':'45 100% 97%',
      '--sidebar-primary':   '40 95% 65%',
      '--sidebar-ring':      '40 95% 65%',
    },
    cssVarsDark: {
      '--background':        '30 15% 12%',
      '--foreground':        '45 90% 95%',
      '--primary':           '340 75% 75%',
      '--secondary':         '40 85% 70%',
      '--accent':            '25 55% 55%',
      '--gradient-primary':  'linear-gradient(135deg, hsl(340 75% 75%), hsl(340 70% 80%))',
      '--gradient-soft':     'linear-gradient(180deg, hsl(30 15% 12%), hsl(340 80% 20%))',
    },
  },

  // ── Shop em gái (lavender pastel) ──
  'tiemnhaca.vercel.app': {  // ← đổi thành domain thật của em gái
    shopName: '˙⋆✮ tiệm nhà cá ✮⋆˙', // ← đổi tên thật
    emoji: '🐡',
    favicon: '/favicon-tiemnhaca.ico',
    description: 'order mấy thứ đáng iuuu',
    cssVars: {
      '--background':         '270 60% 98%',
      '--foreground':         '270 20% 20%',
      '--card':               '270 60% 99%',
      '--card-foreground':    '270 20% 20%',
      '--primary':            '270 60% 82%',   // lavender chính
      '--primary-foreground': '270 20% 20%',
      '--secondary':          '285 50% 88%',   // tím nhạt hơn
      '--secondary-foreground':'270 20% 20%',
      '--muted':              '270 30% 93%',
      '--muted-foreground':   '270 15% 45%',
      '--accent':             '255 45% 75%',   // tím xanh accent
      '--accent-foreground':  '270 20% 20%',
      '--border':             '270 30% 87%',
      '--input':              '270 30% 87%',
      '--ring':               '270 60% 82%',
      '--gradient-primary':   'linear-gradient(135deg, hsl(270 60% 82%), hsl(270 55% 88%))',
      '--gradient-soft':      'linear-gradient(180deg, hsl(270 60% 98%), hsl(285 70% 95%))',
      '--sidebar-background': '270 60% 97%',
      '--sidebar-primary':    '270 55% 70%',
      '--sidebar-ring':       '270 55% 70%',
    },
    cssVarsDark: {
      '--background':         '270 15% 12%',
      '--foreground':         '270 90% 95%',
      '--primary':            '270 55% 72%',
      '--secondary':          '285 45% 68%',
      '--accent':             '255 40% 55%',
      '--gradient-primary':   'linear-gradient(135deg, hsl(270 55% 72%), hsl(270 50% 78%))',
      '--gradient-soft':      'linear-gradient(180deg, hsl(270 15% 12%), hsl(285 60% 20%))',
    },
  },
};

// Fallback về Purin nếu không nhận ra domain
const hostname = window.location.hostname;
export const tenant: TenantConfig =
  tenants[hostname] ?? tenants['purinorder.vercel.app'];
