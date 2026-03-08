import { useState } from "react";
import { cn } from "@/lib/utils";

interface ImageSkeletonProps {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
}

export function ImageSkeleton({ src, alt, className, skeletonClassName }: ImageSkeletonProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className={cn(
          "absolute inset-0 bg-muted animate-pulse rounded-sm",
          skeletonClassName
        )} />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
