import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  "Đang xử lý",
  "Đã đặt hàng",
  "Đang sản xuất",
  "Đang vận chuyển T-V",
  "Sẵn sàng giao",
  "Đang giao",
  "Đã hoàn thành",
];

interface OrderProgressStepperProps {
  currentProgress: string;
}

export function OrderProgressStepper({ currentProgress }: OrderProgressStepperProps) {
  if (currentProgress === "Đã huỷ") {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
          <span className="text-destructive text-xs font-bold">✕</span>
        </div>
        <span className="text-sm font-medium text-destructive">Đơn hàng đã bị huỷ</span>
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(currentProgress);

  return (
    <div className="w-full py-2">
      {/* Mobile: compact horizontal */}
      <div className="flex items-center gap-0.5 w-full">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              {/* Step dot */}
              <div className="flex flex-col items-center gap-1 relative group">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border-2 shrink-0",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "bg-primary/20 border-primary text-primary scale-110",
                    isPending && "bg-muted border-border text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : index + 1}
                </div>
                {/* Tooltip label */}
                <span
                  className={cn(
                    "absolute -bottom-5 text-[9px] whitespace-nowrap font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
                    isCurrent && "opacity-100 text-primary",
                    isCompleted && "text-primary"
                  )}
                >
                  {step}
                </span>
              </div>
              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-0.5 rounded-full transition-colors",
                    index < currentIndex ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      {/* Current step label below */}
      <p className="text-xs font-medium text-primary mt-4 text-center">
        {currentProgress}
      </p>
    </div>
  );
}
