import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface OrderCountdownProps {
  deadline: string;
  onExpired?: () => void;
}

export function OrderCountdown({ deadline, onExpired }: OrderCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const deadlineDate = new Date(deadline).getTime();
      const now = new Date().getTime();
      const difference = deadlineDate - now;

      if (difference <= 0) {
        onExpired?.();
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, onExpired]);

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-2 text-destructive text-sm font-medium bg-destructive/10 px-4 py-2 rounded-lg">
        <Clock className="h-4 w-4" />
        Đã hết hạn order
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-medium mb-3">
        <Clock className="h-4 w-4" />
        Thời gian còn lại để order
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {timeLeft.days}
          </div>
          <div className="text-xs text-muted-foreground">Ngày</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {timeLeft.hours}
          </div>
          <div className="text-xs text-muted-foreground">Giờ</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {timeLeft.minutes}
          </div>
          <div className="text-xs text-muted-foreground">Phút</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {timeLeft.seconds}
          </div>
          <div className="text-xs text-muted-foreground">Giây</div>
        </div>
      </div>
    </div>
  );
}
