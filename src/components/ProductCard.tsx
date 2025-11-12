import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "@/contexts/CartContext";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <Link to={`/product/${product.id}`}>
        <div className="relative overflow-hidden group">
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
              Pre-order
            </Badge>
          </div>
        </div>
      </Link>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Link to={`/product/${product.id}`} className="flex-1">
            <CardTitle className="text-xl hover:text-primary transition-colors">
              {product.name}
            </CardTitle>
          </Link>
        </div>
        <CardDescription className="line-clamp-2">{product.description}</CardDescription>
        <p className="text-xs text-muted-foreground mt-1">🎤 {product.artist}</p>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-primary">{product.priceDisplay}</p>
      </CardContent>
      <CardFooter>
        <Link to={`/product/${product.id}`} className="w-full">
          <Button className="w-full bg-gradient-primary gap-2">
            <ShoppingCart className="h-4 w-4" />
            Xem chi tiết
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
