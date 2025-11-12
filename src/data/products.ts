// @/data/products.ts

export const productsData = [
  // === (ID 1: GIỮ NGUYÊN) ===
  {
    id: 1,
    name: "Sticker lấp la lấp lánh",
    price: 83000,
    priceDisplay: "83,000đ",
    description: [
      "Set 20 cái sticker (mỗi mẫu 2 cái)",
    ],
    images: [
      "https://i.imgur.com/TILP0up.jpeg",
      "https://i.imgur.com/RSuiM56.jpeg",
      "https://i.imgur.com/JFK1wuM.jpeg",
      "https://i.imgur.com/P6Fxzda.jpeg",
      "https://i.imgur.com/FbQUu1p.jpeg",
      "https://i.imgur.com/TR7ObvO.jpeg",
      "https://i.imgur.com/4GO97Nz.jpeg"
    ],
    category: "Merch",
    artist: "CORTIS",
    
    status: "Pre-order",
    orderDeadline: "2025-10-30T23:59:00", // (còn hạn)
    variants: [
      { name: "Full Set 5 members", price: 83000 }
    ],

    variantImageMap: {
      "Full Set 5 members": 0
    },
    feesIncluded: true,
    master: "seeuKJH (xhs)"
  },
  
  // === (ID 2: GIỮ NGUYÊN) ===
  {
    id: 2,
    name: "Sticker Hàn Quốc trong suốt",
    price: 79000,
    priceDisplay: "79,000đ",
    description: [
      "Set 6 cái sticker",
    ],
    images: [
      "https://i.imgur.com/tehKjkX.jpeg",
      "https://i.imgur.com/XDRRCij.jpeg",
      "https://i.imgur.com/WQ0kvi4.jpeg",
      "https://i.imgur.com/PsPd1g8.jpeg",
      "https://i.imgur.com/wqlrhND.jpeg",
      "https://i.imgur.com/v7IoLcY.jpeg",
      "https://i.imgur.com/MiEYr9H.jpeg",
      "https://i.imgur.com/lvr0PO4.jpeg"
    ],
    category: "Merch",
    artist: "CORTIS",
    
    status: "Sẵn", 
    orderDeadline: null, // (hàng sẵn, không có hạn)
    variants: [
      { name: "Full Set 5 members", price: 79000 }
    ],

    variantImageMap: {
      "Full Set 5 members": 0
    },
    feesIncluded: true,
    master: "脆脆小饼干 (xhs)"
  },
  
  // === (ID 3: GIỮ NGUYÊN) ===
  {
    id: 3,
    name: "Keychain điện thoại",
    price: 107000, 
    priceDisplay: "107,000đ",
    description: [],
    images: [
      "https://i.imgur.com/oTsdiml.jpeg",
      "https://i.imgur.com/DseAHvD.jpeg",
      "https://i.imgur.com/QZKqgHf.jpeg",
      "https://i.imgur.com/aRRxxzr.jpeg",
      "https://i.imgur.com/VgY9HWu.jpeg",
      "https://i.imgur.com/DBmFtMH.jpeg",
      "https://i.imgur.com/lY1XEwd.jpeg"
    ],
    category: "Merch",
    artist: "CORTIS",

    status: "Pre-order",
    orderDeadline: "2025-12-31T23:59:00", // (còn hạn)
    variants: [
      { name: "James", price: 107000 },
      { name: "Juhoon", price: 107000 },
      { name: "Martin", price: 107000 },
      { name: "Seunghyeon", price: 107000 },
      { name: "Keonho", price: 107000 },
      { name: "Full Set 5 members", price: 500000 } 
    ],

    variantImageMap: {
      "Full Set 5 members": 0,
      "James": 2,
      "Juhoon": 3,
      "Martin": 4,
      "Seunghyeon": 5,
      "Keonho": 6
    },
    feesIncluded: false,
    master: "Boky Buyer (xhs)"
  },
  
  // === (ID 4: ĐÃ CẬP NHẬT 2 PHÂN LOẠI) ===
  {
    id: 4,
    name: "Kẹp giấy",
    price: 48000,
    priceDisplay: "48,000đ",
    description: [],
    images: [
      "https://i.imgur.com/rNW9oZf.jpeg",
      "https://i.imgur.com/VfqAsU1.jpeg",
      "https://i.imgur.com/VYjpBAp.jpeg",
      "https://i.imgur.com/1wwHmvm.jpeg",
      "https://i.imgur.com/3Zav3gC.jpeg",
      "https://i.imgur.com/ObfkAE5.jpeg",
      "https://i.imgur.com/0QitLYe.jpeg"
    ],
    category: "Merch",
    artist: "CORTIS",

    status: "Order", 
    orderDeadline: "2026-01-31T23:59:00", 

    // (CẤU TRÚC 2 PHÂN LOẠI)
    optionGroups: [
      {
        name: "Kiểu viền",
        options: ["Viền trong", "Viền màu"]
      },
      {
        name: "Thành viên",
        options: ["James", "Juhoon", "Martin", "Seunghyeon", "Keonho", "Full Set 5 members"]
      }
    ],
    
    // (Mảng variants vẫn là các chuỗi đã gộp)
    variants: [
      { name: "Viền trong-James", price: 48000 },
      { name: "Viền màu-James", price: 48000 },
      { name: "Viền trong-Juhoon", price: 48000 },
      { name: "Viền màu-Juhoon", price: 48000 },
      { name: "Viền trong-Martin", price: 48000 },
      { name: "Viền màu-Martin", price: 48000 },
      { name: "Viền trong-Seunghyeon", price: 48000 },
      { name: "Viền màu-Seunghyeon", price: 48000 },
      { name: "Viền trong-Keonho", price: 48000 },
      { name: "Viền màu-Keonho", price: 48000 },
      { name: "Viền trong-Full Set 5 members", price: 230000 }, 
      { name: "Viền màu-Full Set 5 members", price: 230000 } 
    ],
    
    // (Map vẫn dùng chuỗi gộp)
    variantImageMap: {
      "Viền trong-Full Set 5 members": 0,
      "Viền màu-Full Set 5 members": 1,
      "Viền trong-James": 2,
      "Viền màu-James": 2,
      "Viền trong-Juhoon": 3,
      "Viền màu-Juhoon": 3,
      "Viền trong-Martin": 4,
      "Viền màu-Martin": 4,
      "Viền trong-Seunghyeon": 5,
      "Viền màu-Seunghyeon": 5,
      "Viền trong-Keonho": 6,
      "Viền màu-Keonho": 6
    },
    feesIncluded: false,
    master: "Boky Buyer (xhs)"
  },
];
