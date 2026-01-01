import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ShieldCheck, Sparkles, AlertCircle, CheckCircle2, DollarSign, Video, Ban, Truck, CreditCard, Clock } from "lucide-react";

export function MiddlemanPolicy() {
  return (
    <div className="space-y-6">
      {/* Tiêu đề */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300 bg-clip-text text-transparent">
          💖 GÓC GIAO DỊCH TRUNG GIAN
        </h2>
        <p className="text-lg font-medium text-foreground/80">
          An toàn & Yên tâm cùng Purin
        </p>
      </div>

      {/* Lời mở đầu */}
      <Card className="border-pink-200 bg-gradient-to-br from-pink-50/50 to-amber-50/50 dark:from-pink-950/20 dark:to-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-6 w-6 text-pink-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-foreground">
                Chào mừng bạn đến với tính năng <span className="text-pink-500 font-bold">Trung gian (Pass/Gom)</span> của Purin Order! 👋🏻
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Để cộng đồng chúng mình luôn văn minh và nói "không" với scam, Purin sẽ đứng ra làm "trọng tài" giữ tiền giúp các bạn. 
                Tiền chỉ về túi Seller khi Buyer đã nhận được món đồ ưng ý!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quy trình 5 bước */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            Quy trình 5 bước cực dễ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { step: 1, icon: "📝", title: "Chốt đơn", desc: "Seller đăng bài, Buyer ưng ý thì bấm \"Đặt hàng\" ngay trên Web nha." },
              { step: 2, icon: "💰", title: "Giữ tiền", desc: "Buyer chuyển khoản cho Purin. Yên tâm nhé, tiền của bạn đang được Purin \"bảo vệ\" an toàn." },
              { step: 3, icon: "📦", title: "Gửi hàng", desc: "Seller đóng gói xinh xẻo và gửi đi cho Buyer." },
              { step: 4, icon: "🔍", title: "Check hàng", desc: "Buyer nhận hàng, quay video unbox và bấm \"Xác nhận\" trên web trong vòng 3 ngày." },
              { step: 5, icon: "🎉", title: "Ting ting", desc: "Purin chuyển tiền cho Seller. Giao dịch thành công rực rỡ!" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3 bg-white/60 dark:bg-white/5 p-3 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <span className="text-lg mr-2">{item.icon}</span>
                  <span className="font-semibold text-foreground">{item.title}:</span>
                  <span className="text-sm text-muted-foreground ml-1">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lưu ý quan trọng */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-5 w-5" />
            ⚠️ Lưu ý quan trọng (Đọc kỹ nha!)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Để tránh những hiểu lầm không đáng có, cả nhà giúp Purin tuân thủ mấy điều nhỏ xíu này nhé:
          </p>

          {/* Quay video unbox */}
          <div className="bg-white/60 dark:bg-white/5 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-rose-500" />
              <h4 className="font-semibold text-foreground">1. Quay Video Unbox - "Bùa hộ mệnh" của bạn 🎥</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-7 list-disc">
              <li><span className="font-medium text-foreground">Buyer ơi:</span> Nhớ quay video mở hàng <span className="text-rose-500 font-medium">KHÔNG CẮT GHÉP</span>, quay rõ 6 mặt hộp còn nguyên niêm phong và mã vận đơn nhé.</li>
              <li><span className="font-medium text-foreground">Tại sao cần:</span> Nếu lỡ có tranh chấp, video này là bằng chứng duy nhất để Purin bảo vệ quyền lợi và hoàn tiền cho bạn đó. Không có video là Purin hổng cứu được đâu 🥺</li>
            </ul>
          </div>

          {/* Đừng đánh lẻ */}
          <div className="bg-white/60 dark:bg-white/5 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              <h4 className="font-semibold text-foreground">2. Đừng "đánh lẻ" bên ngoài 🚫</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-7 list-disc">
              <li>Hãy giao dịch ngay trên Web để được bảo vệ 100%.</li>
              <li>Nếu các bạn nhắn tin riêng và giao dịch ngoài, lỡ gặp rủi ro thì Purin xin phép không can thiệp giải quyết được ạ.</li>
            </ul>
          </div>

          {/* Vận chuyển */}
          <div className="bg-white/60 dark:bg-white/5 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-500" />
              <h4 className="font-semibold text-foreground">3. Chuyện vận chuyển 🚚</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-7 list-disc">
              <li><span className="font-medium text-foreground">Seller lưu ý:</span> Nhớ bọc hàng thật kỹ (quay video đóng gói càng tốt).</li>
              <li>Nếu Shipper lỡ làm mất/hỏng hàng, Seller chịu khó làm việc với bên vận chuyển để nhận đền bù nha. Purin chỉ hỗ trợ giữ tiền chứ không đền bù hàng hóa được nè.</li>
            </ul>
          </div>

          {/* Thông tin chính chủ */}
          <div className="bg-white/60 dark:bg-white/5 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-500" />
              <h4 className="font-semibold text-foreground">4. Thông tin chính chủ 💳</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-7 list-disc">
              <li>Seller nhớ check kỹ số tài khoản nhận tiền nhé. Nhập sai là tiền đi lạc đó!</li>
              <li>Và tuyệt đối không đăng bán hàng cấm nha.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Tự động duyệt */}
      <Card className="border-sky-200 bg-gradient-to-br from-sky-50/50 to-cyan-50/50 dark:from-sky-950/20 dark:to-cyan-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
            <Clock className="h-5 w-5" />
            Chế độ "Tự động duyệt thanh toán" ✅
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sau <span className="font-bold text-sky-600">05 ngày</span> kể từ khi đơn giao thành công, nếu Buyer không có ý kiến gì, 
            hệ thống sẽ tự hiểu là bạn đã hài lòng và chuyển tiền cho Seller luôn nè.
          </p>
        </CardContent>
      </Card>

      {/* Phí dịch vụ */}
      <Card className="border-pink-200 bg-gradient-to-br from-pink-50/50 to-rose-50/50 dark:from-pink-950/20 dark:to-rose-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
            <DollarSign className="h-5 w-5" />
            Phí dịch vụ 💰
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-400" />
            <p className="text-sm text-muted-foreground">
              Chỉ <span className="font-bold text-pink-600 text-base">5.000đ/lần</span> (Bằng cốc trà đá thui à!)
            </p>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 p-2 rounded-lg">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              🎁 <span className="font-bold">Đặc biệt:</span> Free phí cho các bạn khách quen đã order tại Purin trong 30 ngày qua nha!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
