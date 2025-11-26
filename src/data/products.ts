export interface Product {
  id: number;
  name: string;
  price: number;
  images: string[];
  description?: string;
  category?: string;
  subcategory?: string;
  artist?: string;
  feesIncluded?: boolean;
  status?: string;
  orderDeadline?: string;
  variants?: { name: string; price: number }[];
  optionGroups?: { name: string; options: string[] }[];
  variantImageMap?: { [key: string]: number };
  master?: string;
  te?: number;
  rate?: number;
  r_v?: number;
  can_weight?: number;
  pack?: number;
  cong?: number;
  total?: number;
  actual_rate?: number;
  actual_can?: number;
  actual_pack?: number;
  stock?: number;
  link_order?: string;
  proof?: string;
}

export const productsData: Product[] = [
  {
    id: 1,
    name: "Sản phẩm mẫu 1",
    price: 150000,
    images: ["/placeholder.svg"],
    description: "Mô tả sản phẩm mẫu 1",
    category: "Danh mục A",
    feesIncluded: true,
    status: "Sẵn"
  },
  {
    id: 2,
    name: "Sản phẩm mẫu 2",
    price: 250000,
    images: ["/placeholder.svg"],
    description: "Mô tả sản phẩm mẫu 2",
    category: "Danh mục B",
    feesIncluded: false,
    status: "Đặt hàng"
  }
];
