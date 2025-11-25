-- Thêm cột mới cho payment_status và order_progress
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'chưa thanh toán';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_progress TEXT DEFAULT 'đang xử lý';

-- Migrate dữ liệu cũ từ cột status sang 2 cột mới
UPDATE orders 
SET payment_status = CASE 
  WHEN status IN ('chưa thanh toán', 'đã thanh toán', 'đã cọc', 'đã hoàn cọc') THEN status
  ELSE payment_status
END,
order_progress = CASE
  WHEN status IN ('Purin đã đặt hàng', 'Đang sản xuất', 'đang vận chuyển', 'đang giao', 'đã hoàn thành', 'đã huỷ', 'đang xử lý') THEN status
  ELSE order_progress
END
WHERE status IS NOT NULL;