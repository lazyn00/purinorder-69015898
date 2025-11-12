// @/data/products.ts

export const productsData = [
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
    
    // === CẬP NHẬT ===
    status: "Pre-order",
    orderDeadline: "2025-10-30T23:59:00", // (Ví dụ: 30/10/2025)
    variants: [
      { name: "Full Set 5 members", price: 83000 }
    ],
    // === KẾT THÚC CẬP NHẬT ===

    variantImageMap: {
      "Full Set 5 members": 0
    },
    feesIncluded: true,
    master: "seeuKJH (xhs)"
  },
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
    
    // === CẬP NHẬT ===
    status: "Sẵn", // (Ví dụ: hàng có sẵn)
    orderDeadline: null, // (Không có hạn order vì hàng sẵn)
    variants: [
      { name: "Full Set 5 members", price: 79000 }
    ],
    // === KẾT THÚC CẬP NHẬT ===

    variantImageMap: {
      "Full Set 5 members": 0
    },
    feesIncluded: true,
    master: "脆脆小饼干 (xhs)"
  },
  {
    id: 3,
    name: "Keychain điện thoại",
    price: 107000, // Giá khởi điểm
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

    // === CẬP NHẬT ===
    status: "Pre-order",
    orderDeadline: "2025-12-31T23:59:00", // (Ví dụ: 31/12/2025)
    variants: [
      { name: "James", price: 107000 },
      { name: "Juhoon", price: 107000 },
      { name: "Martin", price: 107000 },
      { name: "Seunghyeon", price: 107000 },
      { name: "Keonho", price: 107000 },
      { name: "Full Set 5 members", price: 500000 } // (Ví dụ: giá full set khác)
    ],
    // === KẾT THÚC CẬP NHẬT ===

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

    // === CẬP NHẬT ===
    status: "Order", // (Ví dụ: đang nhận order)
    orderDeadline: "2024-11-20T23:59:00", // (Ví dụ: đã hết hạn)
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
      { name: "Viền trong-Full Set 5 members", price: 230000 }, // (Ví dụ giá khác)
      { name: "Viền màu-Full Set 5 members", price: 230000 }  // (Ví dụ giá khác)
    ],
    // === KẾT THÚC CẬP NHẬT ===

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
