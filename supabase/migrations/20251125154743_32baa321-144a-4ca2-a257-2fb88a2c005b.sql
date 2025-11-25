-- Migrate existing order statuses to capitalized versions
UPDATE orders
SET 
  payment_status = CASE payment_status
    WHEN 'chưa thanh toán' THEN 'Chưa thanh toán'
    WHEN 'đã thanh toán' THEN 'Đã thanh toán'
    WHEN 'đã cọc' THEN 'Đã cọc'
    WHEN 'đã hoàn cọc' THEN 'Đã hoàn cọc'
    ELSE payment_status
  END,
  order_progress = CASE order_progress
    WHEN 'đang xử lý' THEN 'Đang xử lý'
    WHEN 'Purin đã đặt hàng' THEN 'Đã đặt hàng'
    WHEN 'đang vận chuyển' THEN 'Đang vận chuyển'
    WHEN 'đang giao' THEN 'Đang giao'
    WHEN 'đã hoàn thành' THEN 'Đã hoàn thành'
    WHEN 'đã huỷ' THEN 'Đã huỷ'
    ELSE order_progress
  END
WHERE payment_status IN ('chưa thanh toán', 'đã thanh toán', 'đã cọc', 'đã hoàn cọc')
   OR order_progress IN ('đang xử lý', 'Purin đã đặt hàng', 'đang vận chuyển', 'đang giao', 'đã hoàn thành', 'đã huỷ');