export const productsData = [
  {
    id: 1,
    name: "Sticker lấp la lấp lánh",
    price: 83000,
    priceDisplay: "83,000đ",
    description: [
      "Set 20 cái sticker (mỗi mẫu 2 cái)",
      "Giá đã bao gồm cân và ship nội địa dự kiến"
    ], // <- thêm dấu phẩy ở đây
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
    variants: ["Full Set 6 members"],
    variantImageMap: {
      "Full Set 6 members": 0
    },
    feesIncluded: true,
    master: "CORTIS Official"
  },
  {
    id: 2,
    name: "Sticker Hàn Quốc trong suốt",
    price: 79000,
    priceDisplay: "79,000đ",
    description: [
      "Set 6 cái sticker",
      "Giá đã bao gồm cân và ship nội địa dự kiến"
    ], // <- dùng mảng để xuống dòng, và nhớ dấu phẩy
    images: [
      "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800",
      "https://images.unsplash.com/photo-1614680376739-414d95ff43df?w=800"
    ],
    category: "Merch",
    artist: "CORTIS",
    variants: ["Full Set 6 members"],
    variantImageMap: {
      "Full Set 6 members": 0
    },
    feesIncluded: false,
    master: "Korean Sticker Shop"
  }
];
