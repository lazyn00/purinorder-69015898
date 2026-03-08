import { useEffect, useState, useRef } from "react";
import { getActiveHoliday } from "@/hooks/useHoliday";

function setEmojiFavicon(emoji: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.font = "56px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, 32, 36);
  
  const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']") || document.createElement("link");
  link.type = "image/png";
  link.rel = "icon";
  link.href = canvas.toDataURL();
  document.head.appendChild(link);
}

interface Particle {
  id: number;
  emoji: string;
  x: number;
  delay: number;
  duration: number;
  size: number;
}

export function HolidayEffects() {
  const holiday = getActiveHoliday();
  const [particles, setParticles] = useState<Particle[]>([]);
  const idCounter = useRef(0);

  useEffect(() => {
    if (!holiday) return;
    setEmojiFavicon(holiday.favicon);
    return () => {
      // Reset favicon on cleanup
      const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (link) link.href = "/favicon.ico";
    };
  }, [holiday]);

  useEffect(() => {
    if (!holiday) return;

    // Create initial batch
    const initial: Particle[] = Array.from({ length: 12 }, () => ({
      id: idCounter.current++,
      emoji: holiday.particles[Math.floor(Math.random() * holiday.particles.length)],
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4,
      size: 14 + Math.random() * 12,
    }));
    setParticles(initial);

    // Spawn new particles periodically
    const interval = setInterval(() => {
      setParticles(prev => {
        const filtered = prev.length > 20 ? prev.slice(-15) : prev;
        return [...filtered, {
          id: idCounter.current++,
          emoji: holiday.particles[Math.floor(Math.random() * holiday.particles.length)],
          x: Math.random() * 100,
          delay: 0,
          duration: 4 + Math.random() * 4,
          size: 14 + Math.random() * 12,
        }];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [holiday]);

  if (!holiday) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes holiday-fall {
          0% { transform: translateY(-5vh) rotate(0deg); opacity: 1; }
          70% { opacity: 0.8; }
          100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: "-5vh",
            fontSize: `${p.size}px`,
            animation: `holiday-fall ${p.duration}s linear ${p.delay}s forwards`,
            willChange: "transform",
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
