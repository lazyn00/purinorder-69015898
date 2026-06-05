import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";

interface BillLightboxProps {
  images: string[];
  startIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function BillLightbox({ images, startIndex = 0, open, onClose }: BillLightboxProps) {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    if (open) setIdx(startIndex);
  }, [open, startIndex]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setIdx(i => Math.max(0, i - 1));
      else if (e.key === "ArrowRight") setIdx(i => Math.min(images.length - 1, i + 1));
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, images.length, onClose]);

  if (!images.length) return null;
  const current = images[idx];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl p-0 bg-background/95 backdrop-blur border-none">
        <div className="relative flex flex-col items-center justify-center min-h-[60vh]">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 bg-background/80 rounded-full p-1.5 hover:bg-background"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="absolute top-2 left-2 z-10 bg-background/80 text-xs px-2 py-1 rounded">
            Bill {idx + 1} / {images.length}
          </div>

          <img
            src={current}
            alt={`Bill ${idx + 1}`}
            className="max-h-[80vh] max-w-full object-contain rounded"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={() => setIdx(i => Math.max(0, i - 1))}
                disabled={idx === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-2 hover:bg-background disabled:opacity-30"
                aria-label="Bill trước"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIdx(i => Math.min(images.length - 1, i + 1))}
                disabled={idx === images.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-2 hover:bg-background disabled:opacity-30"
                aria-label="Bill sau"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div className="w-full flex justify-center py-2">
            <Button asChild variant="outline" size="sm">
              <a href={current} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Mở tab mới
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
