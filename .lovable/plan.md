# Kế hoạch 4 cải tiến

## 1. Admin – Xem bill bằng popup (lightbox), không nhảy trang

**File:** `src/pages/Admin.tsx` (dòng ~1576-1594), `src/pages/AdminOrderDetail.tsx` (dòng ~613-628)

- Thay các thẻ `<a target="_blank">` đang bọc link Bill 1/2/3+ bằng nút (`<button>`).
- Thêm state `lightboxImages: string[]` + `lightboxIndex: number` ở Admin.tsx (và AdminOrderDetail.tsx).
- Tạo component dùng chung `BillLightbox.tsx`:
  - Dùng `Dialog` của shadcn, hiển thị ảnh full-size ở giữa.
  - Nút ‹ › chuyển ảnh nếu có nhiều bill, hiển thị "i/n".
  - Click ra ngoài hoặc ✕ để đóng. Phím Esc / ← → cũng hoạt động.
  - Có nút "Mở tab mới" cho ai muốn tải về.
- Khi bấm "Bill 1/2/i" → mở lightbox với mảng `[bill1, bill2, ...additional_bills]` và index tương ứng.

## 2. Trang tra đơn – Hiển thị các bill khách đã up

**File:** `src/pages/TrackOrder.tsx` (card đơn hàng, dòng ~320-373)

- Trong card mỗi đơn, thêm 1 dòng nhỏ ngay dưới tên sản phẩm:
  - Đếm tổng số bill = `(payment_proof_url?1:0) + (second_payment_proof_url?1:0) + (additional_bills?.length||0)`.
  - Nếu >0: hiển thị badge xanh `🧾 Đã gửi N bill` (kèm thumbnail mini của bill cuối nếu mobile cho phép).
  - Nếu =0 và đơn cần thanh toán: hiển thị badge xám `⚠️ Chưa gửi bill`.
- Trong `CustomerOrderDetail.tsx` ở phần "Đăng bill bổ sung" (~561), thêm khối tóm tắt phía trên nút upload:
  - "✅ Bạn đã gửi N bill cho đơn này" + grid thumbnail các bill đã up (click mở lightbox dùng chung BillLightbox).
  - Mục đích: tránh khách up trùng 4-5 lần.

## 3. Lịch sử admin chỉnh sản phẩm

**Migration mới:**

```
CREATE TABLE public.product_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id INTEGER NOT NULL,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- GRANT đầy đủ cho authenticated/anon/service_role + enable RLS + policy cho phép select/insert public (admin page không có auth user).
CREATE INDEX ON public.product_change_history(product_id, changed_at DESC);
```

**Code:**
- File: `src/components/ProductManagement.tsx` (hàm save sản phẩm), `src/pages/AdminProductForm.tsx` (hàm `handleSave`):
  - Trước khi `update`, fetch sản phẩm cũ; sau khi update, so sánh các field quan trọng (`name, price, stock, status, category, subcategory, artist, master, order_deadline, te, rate, can_weight, pack, cong, description, images.length, variants(serialized), images(serialized), price_display, deposit_allowed, fees_included`).
  - Mỗi field khác nhau → insert 1 dòng vào `product_change_history` với `changed_by = currentUser`.
  - Bulk insert 1 lần để không chậm.
- Trong form sửa sản phẩm (popup ProductManagement), thêm tab/section "Lịch sử thay đổi" ở dưới cùng:
  - Load `product_change_history` theo `product_id`, hiển thị danh sách dạng timeline (tương tự `order_status_history` trong AdminOrderDetail).
  - Hiển thị: thời gian (Asia/Ho_Chi_Minh), người sửa, field, "cũ → mới" (truncate nếu dài).

## 4. Giữ nguyên giao diện form thêm/sửa sản phẩm

- Không đụng vào layout/UI của `ProductManagement.tsx` (popup Dialog – chính là giao diện trong ảnh chụp).
- Chỉ thêm phần "Lịch sử thay đổi" ở cuối form sửa như mục 3, không đổi cấu trúc các field hiện có.
- Không sửa `AdminProductForm.tsx` UI (chỉ thêm logic log history).

## Không động đến
- Style/màu sắc, design system, các trang khác.
- Schema `orders`, `products` hiện có.
- Auth, RLS các bảng khác.
- File checkout, cart, navigation.

## Chi tiết kỹ thuật

- `BillLightbox` component đặt tại `src/components/BillLightbox.tsx`, props: `{ images: string[], startIndex: number, open: boolean, onClose: () => void }`.
- `product_change_history` không có FK đến `products(id)` để tránh mất history khi xoá/đổi ID sản phẩm.
- So sánh field dùng JSON.stringify cho `variants`/`images`/`option_groups` để bắt thay đổi cấu trúc.
- TrackOrder badge dùng class `bg-emerald-100 text-emerald-700` (đã có pattern trong file).
