import { useState } from "react";
import { AlertTriangle, X, ExternalLink, Copy } from "lucide-react";
import { useInAppBrowser, openInExternalBrowser } from "@/hooks/useInAppBrowser";
import { useToast } from "@/hooks/use-toast";

export function InAppBrowserBanner() {
  const { isInApp, name } = useInAppBrowser();
  const [dismissed, setDismissed] = useState(false);
  const { toast } = useToast();

  if (!isInApp || dismissed) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Đã copy link", description: "Mở trình duyệt (Chrome/Safari) và dán vào để upload ảnh được" });
    } catch {
      toast({ title: "Lỗi copy", variant: "destructive" });
    }
  };

  return (
    <div className="bg-amber-100 border-b border-amber-300 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
      <div className="container mx-auto px-3 py-2 flex items-start sm:items-center gap-2 text-xs sm:text-sm">
        <AlertTriangle className="h-4 w-4 mt-0.5 sm:mt-0 shrink-0" />
        <div className="flex-1 leading-snug">
          <strong>Bạn đang dùng trình duyệt trong {name}.</strong> Có thể không upload được ảnh/bill. Hãy mở web bằng Chrome/Safari.
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={openInExternalBrowser} className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded text-xs font-medium">
            <ExternalLink className="h-3 w-3" /> Mở
          </button>
          <button onClick={copyLink} className="inline-flex items-center gap-1 bg-white/70 hover:bg-white text-amber-900 px-2 py-1 rounded text-xs font-medium">
            <Copy className="h-3 w-3" />
          </button>
          <button onClick={() => setDismissed(true)} className="p-1 hover:bg-amber-200 rounded">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Smaller inline notice for upload areas */
export function InAppUploadNotice() {
  const { isInApp, name } = useInAppBrowser();
  if (!isInApp) return null;
  return (
    <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded p-2 flex items-start gap-1.5">
      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <span>
        Đang trong {name} — nếu không chọn được ảnh, hãy bấm <button onClick={openInExternalBrowser} className="underline font-semibold">mở bằng trình duyệt</button>.
      </span>
    </div>
  );
}
