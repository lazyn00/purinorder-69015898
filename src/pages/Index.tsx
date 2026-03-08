import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShoppingBag, Truck, Shield, ArrowRight } from "lucide-react";
import { useReferralCapture } from "@/hooks/useReferralCapture";
import { motion } from "framer-motion";

const features = [
  {
    icon: ShoppingBag,
    title: "Order đa nền tảng",
    desc: "Taobao, PDD, Douyin, XHS, 1688",
  },
  {
    icon: Truck,
    title: "Giao hàng tận nơi",
    desc: "Về từ 5–15 ngày sau khi kho nhận hàng",
  },
  {
    icon: Shield,
    title: "Uy tín & minh bạch",
    desc: "Hỗ trợ tracking, có bill từng đơn",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const Index = () => {
  useReferralCapture();

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-soft)] opacity-60 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative container mx-auto px-4 py-20 md:py-32 text-center max-w-2xl"
        >
          <span className="text-5xl md:text-6xl block mb-5">🍮</span>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
            Purin Order
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed">
            Order sản phẩm K-pop, C-pop, Anime yêu thích
            <br className="hidden sm:block" />
            — nhanh gọn, minh bạch, uy tín.
          </p>
          <Link to="/products">
            <Button size="lg" className="gap-2 rounded-full px-8 shadow-md hover:shadow-lg transition-shadow">
              Xem sản phẩm <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-4 pb-20 text-center"
      >
        <div className="max-w-md mx-auto p-8 rounded-2xl bg-primary/5 border border-primary/10">
          <p className="text-muted-foreground mb-4 text-sm">
            Có thắc mắc? Inbox Purin qua Messenger nhé 💛
          </p>
          <a href="https://m.me/105759462451542" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="rounded-full px-6">
              Chat với Purin
            </Button>
          </a>
        </div>
      </motion.section>
    </Layout>
  );
};

export default Index;
