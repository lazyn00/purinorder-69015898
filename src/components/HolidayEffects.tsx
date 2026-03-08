import { useEffect } from "react";
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

export function HolidayEffects() {
  const holiday = getActiveHoliday();

  useEffect(() => {
    if (!holiday) return;
    setEmojiFavicon(holiday.favicon);
    return () => {
      const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (link) link.href = "/favicon.ico";
    };
  }, [holiday]);

  // No visual rendering — header decoration is handled by Layout
  return null;
}

export { getActiveHoliday };
