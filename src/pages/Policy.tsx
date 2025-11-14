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
          {/* 1. Chính sách đặt hàng */}
          <Card>
            <CardHeader>
              <CardTitle>1. Chính sách đặt hàng</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="list-disc list-inside space-y-3">
                <li>Vì đa phần là hàng order, Purin chỉ chấp nhận hình thức thanh toán trước 50-100%.</li>
                <li>Sau khi xác nhận và thanh toán, Purin không chấp nhận hủy đơn vì bất kỳ lý do gì, trừ khi shop Trung Quốc báo huỷ hoặc không có hàng.</li>
                <li>Sản phẩm bên Purin đa phần là sản phẩm không có sẵn. Thời gian sản xuất sẽ được thông báo rõ khi đăng bài (nếu có).</li>
                <li>Tiến độ đơn hàng sẽ được Purin thông báo qua Email, Facebook hoặc Instagram để bạn dễ dàng theo dõi.</li>
                <li>Thời gian hàng về phụ thuộc vào shop Trung và tốc độ vận chuyển. Purin sẽ cập nhật và thông báo nếu có chậm trễ.</li>
                <li>Khi hàng về, Purin sẽ thông báo qua fanpage và Email/FB/IG khách hàng — vui lòng chú ý các kênh này để không bỏ lỡ cập nhật.</li>
              </ul>
            </CardContent>
          </Card>

          {/* 2. Chính sách thanh toán */}
          <Card>
            <CardHeader>
              <CardTitle>2. Chính sách thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="list-disc list-inside space-y-3">
                <li>Thanh toán 50-100% giá trị đơn hàng qua chuyển khoản ngân hàng hoặc ví điện tử (Momo, ZaloPay).</li>
                <li>Purin sẽ không chịu trách nhiệm trong trường hợp thanh toán sai thông tin tài khoản được cung cấp.</li>
              </ul>
            </CardContent>
          </Card>

          {/* 3. Chính sách vận chuyển */}
          <Card>
            <CardHeader>
              <CardTitle>3. Chính sách vận chuyển</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="list-disc list-inside space-y-3">
                <li>Phí ship được tính theo khu vực: 15,000đ – 50,000đ.</li>
                <li>Thời gian giao hàng: 2–5 ngày làm việc sau khi hàng về Purin.</li>
                <li>Khách hàng được kiểm tra hàng trước khi nhận.</li>
              </ul>
            </CardContent>
          </Card>

          {/* 4. Chính sách đổi trả */}
          <Card>
            <CardHeader>
              <CardTitle>4. Chính sách đổi trả</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="list-disc list-inside space-y-3">
                <li>Purin chỉ chấp nhận hỗ trợ đổi trả nếu sản phẩm bị lỗi do nhà sản xuất.</li>
                <li>Sản phẩm đổi trả phải còn nguyên seal, tem, nhãn mác và chưa qua sử dụng.</li>
                <li>Không chấp nhận đổi trả với lý do cá nhân như đổi ý, không thích, hoặc khác màu.</li>
              </ul>
            </CardContent>
          </Card>
          
          {/* 5. CHÍNH SÁCH HOÀN TIỀN */}
          <Card>
            <CardHeader>
              <CardTitle>5. Chính sách Hoàn tiền</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="list-disc list-inside space-y-3">
                <li>
                  <span className="font-medium text-foreground">Mas hủy đoàn:</span> Purin hoàn đúng số tiền Mas đã trả + công cân.
                </li>
                <li>
                  <span className="font-medium text-foreground">Hàng thất lạc:</span> Hoàn 50–100% tùy mức bồi thường của vận chuyển + công cân.
                </li>
                <li>
                  <span className="font-medium text-foreground">Hàng thiếu/lỗi:</span> Hoàn theo số tiền được bồi thường của Mas sau khi xác nhận. Không bồi thường nếu Mas không xử lý.
                </li>
                <li>
                  <span className="font-medium text-foreground">Trường hợp Mas gian lận (scam):</span> Không hoàn tiền 100%, chỉ hoàn công cân đã thu.
                </li>
              </ul>
              
              <p className="mt-6">
                <span className="font-bold">Lưu ý:</span> Không hoàn tiền vì khác hình, lỗi xưởng, hoặc đổi ý.
              </p>
            </CardContent>
          </Card>
          
          {/* 6. Chính sách bảo mật */}
          <Card>
            <CardHeader>
              <CardTitle>6. Chính sách bảo mật thông tin</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="list-disc list-inside space-y-3">
                <li>Purin cam kết bảo mật tuyệt đối thông tin cá nhân của khách hàng.</li>
                <li>Thông tin chỉ được sử dụng cho mục đích xử lý đơn hàng và chăm sóc khách hàng.</li>
                <li>Không chia sẻ thông tin khách hàng cho bên thứ ba.</li>
                <li>Khách hàng có quyền yêu cầu chỉnh sửa hoặc xóa thông tin bất cứ lúc nào.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
