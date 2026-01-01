// Danh sách các đơn vị vận chuyển với logo
export interface ShippingProvider {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  trackingUrlTemplate: string | null;
}

export const SHIPPING_PROVIDERS: ShippingProvider[] = [
  {
    id: 'spx',
    name: 'Shopee Express',
    shortName: 'SPX',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shopee_logo.svg/120px-Shopee_logo.svg.png',
    trackingUrlTemplate: 'https://spx.vn/track?{code}'
  },
  {
    id: 'ghn',
    name: 'Giao Hàng Nhanh',
    shortName: 'GHN',
    logo: 'https://file.hstatic.net/200000472237/file/ghn_c0f0b6c89cfa40b6beb8d8c5a3d0a11c.png',
    trackingUrlTemplate: 'https://donhang.ghn.vn/?order_code={code}'
  },
  {
    id: 'ghtk',
    name: 'Giao Hàng Tiết Kiệm',
    shortName: 'GHTK',
    logo: 'https://file.hstatic.net/200000472237/file/ghtk_6a4e55ae2c4543e9b88361838c3a7123.png',
    trackingUrlTemplate: 'https://i.ghtk.vn/{code}'
  },
  {
    id: 'jnt',
    name: 'J&T Express',
    shortName: 'J&T',
    logo: 'https://jtexpress.vn/themes/flavor/assets/images/logo.svg',
    trackingUrlTemplate: 'https://jtexpress.vn/vi/tracking?billcodes={code}'
  },
  {
    id: 'vtp',
    name: 'Viettel Post',
    shortName: 'VTP',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/9/9f/Viettel_Post_logo.svg/200px-Viettel_Post_logo.svg.png',
    trackingUrlTemplate: 'https://viettelpost.com.vn/tra-cuu-hanh-trinh-don/{code}'
  },
  {
    id: 'vnpost',
    name: 'Vietnam Post',
    shortName: 'VNPost',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Vietnam_Post_Corporation_logo.svg/200px-Vietnam_Post_Corporation_logo.svg.png',
    trackingUrlTemplate: 'https://www.vnpost.vn/vi-vn/tra-cuu?key={code}'
  },
  {
    id: 'best',
    name: 'Best Express',
    shortName: 'Best',
    logo: 'https://best-inc.vn/static/images/BEST-EXPRESS-LOGO.png',
    trackingUrlTemplate: 'https://best-inc.vn/track?bills={code}'
  },
  {
    id: 'ninja',
    name: 'Ninja Van',
    shortName: 'Ninja',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Ninja_Van_Logo.svg/200px-Ninja_Van_Logo.svg.png',
    trackingUrlTemplate: 'https://www.ninjavan.co/vi-vn/tracking?id={code}'
  },
  {
    id: 'kerry',
    name: 'Kerry Express',
    shortName: 'Kerry',
    logo: 'https://vn.kerryexpress.com/img/logo.png',
    trackingUrlTemplate: 'https://vn.kerryexpress.com/vi/track/?track={code}'
  },
  {
    id: 'grab',
    name: 'Grab Express',
    shortName: 'Grab',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/GrabFood.svg/200px-GrabFood.svg.png',
    trackingUrlTemplate: null
  },
  {
    id: 'lalamove',
    name: 'Lalamove',
    shortName: 'Lala',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/Lalamove_logo.svg/200px-Lalamove_logo.svg.png',
    trackingUrlTemplate: null
  },
  {
    id: 'be',
    name: 'Be Express',
    shortName: 'Be',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/2/2e/Be_Group_logo.svg/200px-Be_Group_logo.svg.png',
    trackingUrlTemplate: null
  }
];

// Hàm tìm provider theo tên (hỗ trợ nhiều cách gọi)
export const findProviderByName = (name: string): ShippingProvider | undefined => {
  const lower = name.toLowerCase();
  return SHIPPING_PROVIDERS.find(p => 
    lower.includes(p.id) || 
    lower.includes(p.shortName.toLowerCase()) || 
    lower.includes(p.name.toLowerCase())
  );
};

// Hàm tạo tracking URL
export const getTrackingUrlFromProvider = (provider: ShippingProvider | string, code: string): string | null => {
  const p = typeof provider === 'string' ? findProviderByName(provider) : provider;
  if (!p || !p.trackingUrlTemplate) return null;
  return p.trackingUrlTemplate.replace('{code}', code);
};
