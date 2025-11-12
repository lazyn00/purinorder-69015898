import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Policy() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Chính sách</h1>
          <p className="text-muted-foreground">Các chính sách quan trọng khi mua hàng tại Purin Order</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Chính sách đặt hàng */}
          <Card>
            <CardHeader>
              <CardTitle>1. Chính sách đặt hàng (Pre-order)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>• Vì đa phần là hàng order, Purin chỉ chấp nhận hình thức thanh toán trước 50-100%.</p>
              <p>• Sau khi xác nhận và thanh toán, Purin không chấp nhận hủy đơn vì bất kỳ lý do gì, trừ khi shop Trung Quốc báo huỷ hoặc không có hàng.</p>
              <p>• Sản phẩm bên Purin đa phần là sản phẩm không có sẵn. Thời gian sản xuất sẽ được thông báo rõ khi đăng bài (nếu có).</p>
              <p>• Tiến độ đơn hàng sẽ được Purin thông báo qua Email, Facebook hoặc Instagram để bạn dễ dàng theo dõi.</p>
              <p>• Thời gian hàng về phụ thuộc vào shop Trung và tốc độ vận chuyển. Purin sẽ cập nhật và thông báo nếu có chậm trễ.</p>
              <p>• Khi hàng về, Purin sẽ thông báo qua fanpage và Email/FB/IG khách hàng — vui lòng chú ý các kênh này để không bỏ lỡ cập nhật.</p>
            </CardContent>
          </Card>

          {/* Chính sách thanh toán */}
          <Card>
            <CardHeader>
              <CardTitle>2. Chính sách thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>• Thanh toán 50-100% giá trị đơn hàng qua chuyển khoản ngân hàng hoặc ví điện tử (Momo, ZaloPay).</p>
              <p>• Purin sẽ không chịu trách nhiệm trong trường hợp thanh toán sai thông tin tài khoản được cung cấp.</p>
            </CardContent>
          </Card>

          {/* Chính sách vận chuyển */}
          <Card>
            <CardHeader>
              <CardTitle>3. Chính sách vận chuyển</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>• Phí ship được tính theo khu vực: 15,000đ – 50,000đ.</p>
              <p>• Thời gian giao hàng: 2–5 ngày làm việc sau khi hàng về Purin.</p>
              <p>• Khách hàng được kiểm tra hàng trước khi nhận.</p>
            </CardContent>
          </Card>

          {/* Chính sách đổi trả */}
          <Card>
            <CardHeader>
              <CardTitle>4. Chính sách đổi trả</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>• Purin chỉ chấp nhận hỗ trợ đổi trả nếu sản phẩm bị lỗi do nhà sản xuất.</p>
              <p>• Sản phẩm đổi trả phải còn nguyên seal, tem, nhãn mác và chưa qua sử dụng.</p>
              <p>• Không chấp nhận đổi trả với lý do cá nhân như đổi ý, không thích, hoặc khác màu.</p>
            </CardContent>
          </Card>
          
          {/* === BẢN SỬA: CHÍNH SÁCH HOÀN TIỀN (MỤC 5) === */}
          <Card>
            <CardHeader>
              <CardTitle>5. Chính sách Hoàn tiền</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="list-disc list-inside space-y-3 pl-4 text-muted-foreground">
                <li>
                  <span className="font-semibold text-foreground">Mas hủy đoàn:</span> Purin hoàn đúng số tiền Mas đã trả + công cân.
                </li>
                <li>
                  <span className="font-semibold text-foreground">Hàng thất lạc:</span> Hoàn 50–100% tùy mức bồi thường của vận chuyển + công cân.
                </li>
                <li>
                  <span className="font-semibold text-foreground">Hàng thiếu/lỗi:</span> Hoàn theo số tiền được bồi thường của Mas sau khi xác nhận. Không bồi thường nếu Mas không xử lý.
                </li>
                <li>
                  <span className="font-semibold text-red-500">Trường hợp Mas gian lận (scam):</span> Không hoàn tiền 100%, chỉ hoàn công cân đã thu.
                </li>
              </ul>
              <div className="bg-yellow-50 border-l-4 border-amber-500 text-amber-700 p-4 rounded-md mt-6">
                <p className="font-bold">Lưu ý:</p>
                <p className="text-sm">Không hoàn tiền vì khác hình, lỗi xưởng, hoặc đổi ý.</p>
              </div>
            </CardContent>
          </Card>
          {/* === KẾT THÚC BẢN SỬA === */}

          {/* Chính sách bảo mật */}
          <Card>
            <CardHeader>
              <CardTitle>6. Chính sách bảo mật thông tin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>• Purin cam kết bảo mật tuyệt đối thông tin cá nhân của khách hàng.</p>
              <p>• Thông tin chỉ được sử dụng cho mục đích xử lý đơn hàng và chăm sóc khách hàng.</p>
              <p>• Không chia sẻ thông tin khách hàng cho bên thứ ba.</p>
              <p>• Khách hàng có quyền yêu cầu chỉnh sửa hoặc xóa thông tin bất cứ lúc nào.</p>
            </CardContent>
          </Card>

          {/* Liên hệ */}
          <Card>
            <CardHeader>
              <CardTitle>7. Liên hệ hỗ trợ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>📧 Email: ppurin.order@gmail.com</p>
              <p>📱 Hotline: 0393039035</p>
              <p>💬 Facebook: fb.com/purinorder</p>
              <p>📸 Instagram: @purin_order</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
