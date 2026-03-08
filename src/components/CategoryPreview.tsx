import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface CategoryPreviewProps {
  title: string;
  categorySlug: string;
  products: any[];
}

export function CategoryPreview({ title, categorySlug, products }: CategoryPreviewProps) {
  const displayProducts = products.slice(0, 50);
  if (displayProducts.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-12"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
        <Link to={`/category/${categorySlug}`}>
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            Xem thêm <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <CarouselContent className="-ml-1.5 md:-ml-2">
          {displayProducts.map((product, idx) => (
            <CarouselItem
              key={product.id}
              className="pl-2 md:pl-2.5 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.3) }}
              >
                <ProductCard product={product} />
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </motion.section>
  );
}
