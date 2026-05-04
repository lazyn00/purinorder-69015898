## Mục tiêu

Thêm tính năng "Shop theo Master" — mỗi master có một trang riêng giống một shop, có ảnh đại diện, tên, link shop. Trang shop hiển thị sản phẩm còn order được; những sản phẩm hết hạn/hết hàng bị ẩn dưới một mục có thể mở rộng.

## Phần Database

Thêm bảng `master_shops` để quản lý thông tin từng master (ảnh đại diện, tên hiển thị, link shop, slug, mô tả ngắn).

```text
master_shops
- id (uuid, pk)
- master_name (text, unique) — khớp với products.master
- display_name (text) — tên hiển thị trên web
- slug (text, unique) — dùng cho URL /shop/:slug
- avatar_url (text, nullable)
- shop_link (text, nullable)
- description (text, nullable)
- is_visible (boolean, default true)
- sort_order (int, default 0)
- created_at, updated_at
```

RLS: public SELECT cho tất cả; INSERT/UPDATE/DELETE cho public (giống các bảng khác trong project, vì admin dùng password client-side).

Master nào chưa có row trong `master_shops` thì auto-fallback dùng `master_name` làm tên + slug, không có avatar.

## Trang khách hàng

**Trang danh sách shop** `/shops`:
- Grid các master shop có `is_visible = true`, sắp xếp theo `sort_order`.
- Mỗi card: avatar tròn, tên shop, số sản phẩm còn order được.
- Thêm vào navigation và trang `Products` thêm 1 section "Shop theo Master" hiển thị carousel các shop.

**Trang chi tiết shop** `/shop/:slug`:
- Header: avatar, tên shop, link shop (nếu có) mở tab mới, mô tả.
- Section "Đang order": grid sản phẩm thuộc master này, lọc còn hàng + chưa hết hạn + status != "Ẩn" (dùng cùng `isProductAvailable` như `Products.tsx`).
- Section "Đã hết / Hết hạn" (collapsible, mặc định đóng, có nút mở rộng): các sản phẩm còn lại của master.
- Dùng `ProductCard` đã có để giữ design nhất quán.
- Dùng `master_updates` đã tồn tại để hiển thị các cập nhật tiến độ của master (tuỳ chọn — sẽ thêm 1 section nhỏ phía trên danh sách sản phẩm).

## Trang Admin

Mở rộng `MasterManagement.tsx`:
- Thêm panel "Thông tin Shop" cho mỗi master được chọn:
  - Upload avatar (vào bucket `product-images`, prefix `master-avatars/`).
  - Input tên hiển thị, slug (auto-generate từ tên, có thể sửa), link shop, mô tả, toggle hiển thị, sort order.
  - Nút Lưu — upsert vào `master_shops` theo `master_name`.
- Giữ nguyên phần `master_updates` đã có.

## Routing

Thêm route trong `src/App.tsx`:
- `/shops` → trang danh sách shop.
- `/shop/:slug` → trang chi tiết shop.

## Files cần thay đổi / tạo mới

- **migration**: tạo bảng `master_shops` + RLS policies.
- **mới**: `src/pages/Shops.tsx` — danh sách shop.
- **mới**: `src/pages/ShopDetail.tsx` — chi tiết shop với section collapsible.
- **sửa**: `src/components/MasterManagement.tsx` — thêm form quản lý shop info.
- **sửa**: `src/App.tsx` — thêm 2 route.
- **sửa**: `src/components/Layout.tsx` (hoặc nav tương ứng) — thêm link "Shops".

## Câu hỏi nhỏ trước khi code

Bạn muốn link "Shops" xuất hiện ở đâu?
- Chỉ trong navigation chính.
- Chỉ là 1 section trên trang Products (carousel shop).
- Cả hai.

Nếu không trả lời, mình sẽ làm **cả hai** (navigation + section trên Products).
