import { Card, CardContent } from "@/components/ui/card";

export function MiddlemanPolicy() {
  return (
    <div className="space-y-6 text-sm">
      {/* Tiêu đề */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-foreground">
          Chính sách giao dịch trung gian
        </h2>
        <p className="text-muted-foreground text-xs">
          An toàn & Yên tâm cùng Purin
        </p>
      </div>

      {/* Lời mở đầu */}
      <div className="border-l-2 border-muted-foreground/20 pl-4 text-muted-foreground">
        <p>
          Chào mừng bạn đến với tính năng <span className="font-medium text-foreground">Trung gian (Pass/Gom)</span> của Purin Order!
        </p>
        <p className="mt-2">
          Purin sẽ đứng ra làm "trọng tài" giữ tiền giúp các bạn. Tiền chỉ về túi Seller khi Buyer đã nhận được món đồ ưng ý!
        </p>
      </div>

      {/* Quy trình 5 bước */}
      <Card className="border-muted">
        <CardContent className="pt-4">
          <h3 className="font-medium text-foreground mb-3">Quy trình 5 bước</h3>
          <div className="space-y-2">
            {[
              { step: 1, title: "Chốt đơn", desc: "Seller đăng bài, Buyer bấm \"Đặt hàng\" trên Web." },
              { step: 2, title: "Giữ tiền", desc: "Buyer chuyển khoản cho Purin." },
              { step: 3, title: "Gửi hàng", desc: "Seller đóng gói và gửi đi cho Buyer." },
              { step: 4, title: "Check hàng", desc: "Buyer nhận hàng, quay video unbox và bấm \"Xác nhận\" trong vòng 3 ngày." },
              { step: 5, title: "Hoàn tất", desc: "Purin chuyển tiền cho Seller." },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {item.step}
                </span>
                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">{item.title}:</span> {item.desc}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lưu ý quan trọng */}
      <div className="space-y-3">
        <h3 className="font-medium text-foreground">Lưu ý quan trọng</h3>
        
        <div className="space-y-3 text-muted-foreground">
          <div>
            <p className="font-medium text-foreground text-xs mb-1">1. Quay Video Unbox</p>
            <p className="text-xs">Buyer nhớ quay video mở hàng không cắt ghép, quay rõ 6 mặt hộp còn nguyên niêm phong và mã vận đơn. Không có video = không thể hoàn tiền.</p>
          </div>

          <div>
            <p className="font-medium text-foreground text-xs mb-1">2. Giao dịch qua Web</p>
            <p className="text-xs">Chỉ giao dịch trên Web để được bảo vệ 100%. Giao dịch ngoài = Purin không can thiệp.</p>
          </div>

          <div>
            <p className="font-medium text-foreground text-xs mb-1">3. Vận chuyển</p>
            <p className="text-xs">Seller bọc hàng kỹ và quay video đóng gói. Shipper làm mất/hỏng = Seller tự làm việc với vận chuyển.</p>
          </div>

          <div>
            <p className="font-medium text-foreground text-xs mb-1">4. Thông tin chính chủ</p>
            <p className="text-xs">Seller check kỹ số tài khoản. Không đăng bán hàng cấm.</p>
          </div>
        </div>
      </div>

      {/* Tự động duyệt & Phí */}
      <div className="flex gap-4 text-xs">
        <div className="flex-1 p-3 rounded-lg bg-muted/50">
          <p className="font-medium text-foreground mb-1">Tự động duyệt</p>
          <p className="text-muted-foreground">Sau 5 ngày giao thành công, nếu Buyer không ý kiến = tự động chuyển tiền cho Seller.</p>
        </div>
        <div className="flex-1 p-3 rounded-lg bg-muted/50">
          <p className="font-medium text-foreground mb-1">Phí dịch vụ</p>
          <p className="text-muted-foreground">5.000đ/lần. Free cho khách đã order trong 30 ngày.</p>
        </div>
      </div>
    </div>
  );
}
