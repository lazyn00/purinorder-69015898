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
  '--background':          '45 30% 97%',      // trắng kem
  '--foreground':          '340 20% 15%',      // nâu đậm
  '--card':                '0 0% 100%',
  '--card-foreground':     '340 20% 15%',
  '--primary':             '340 70% 58%',      // hồng đậm
  '--primary-foreground':  '0 0% 100%',
  '--secondary':           '130 25% 62%',      // xanh sage
  '--secondary-foreground':'0 0% 100%',
  '--muted':               '45 40% 93%',       // vàng kem nhạt
  '--muted-foreground':    '340 15% 45%',
  '--accent':              '160 30% 75%',      // mint nhạt
  '--accent-foreground':   '340 20% 15%',
  '--border':              '340 30% 88%',
  '--input':               '340 30% 88%',
  '--ring':                '340 70% 58%',
  '--gradient-primary':    'linear-gradient(135deg, hsl(340 70% 58%), hsl(340 60% 70%))',
  '--gradient-soft':       'linear-gradient(180deg, hsl(45 30% 97%), hsl(270 40% 95%))',
  '--sidebar-background':  '45 30% 97%',
  '--sidebar-primary':     '340 70% 58%',
  '--sidebar-ring':        '340 70% 58%',
},
cssVarsDark: {
  '--background':          '340 15% 12%',
  '--foreground':          '45 80% 92%',
  '--primary':             '340 65% 65%',
  '--secondary':           '130 25% 55%',
  '--accent':              '160 25% 45%',
  '--gradient-primary':    'linear-gradient(135deg, hsl(340 65% 65%), hsl(340 55% 72%))',
  '--gradient-soft':       'linear-gradient(180deg, hsl(340 15% 12%), hsl(270 30% 18%))',
},
  },
};

// Fallback về Purin nếu không nhận ra domain
const hostname = window.location.hostname;
export const tenant: TenantConfig =
  tenants[hostname] ?? tenants['purinorder.vercel.app'];
