import { useEffect, useState } from "react";

const IN_APP_PATTERNS = [
  /FBAN|FBAV|FB_IAB|FBIOS/i,        // Facebook
  /Instagram/i,
  /Messenger/i,
  /Line\//i,
  /Twitter/i,
  /TikTok|musical_ly|BytedanceWebview/i,
  /Zalo/i,
  /MicroMessenger/i,                 // WeChat
];

export function detectInAppBrowser(): { isInApp: boolean; name: string } {
  if (typeof navigator === "undefined") return { isInApp: false, name: "" };
  const ua = navigator.userAgent || "";
  for (const re of IN_APP_PATTERNS) {
    if (re.test(ua)) {
      const name = ua.match(/FBAN|FBAV|FB_IAB|Instagram|Messenger|Line|Twitter|TikTok|BytedanceWebview|Zalo|MicroMessenger/i)?.[0] || "App";
      return { isInApp: true, name };
    }
  }
  return { isInApp: false, name: "" };
}

export function useInAppBrowser() {
  const [info, setInfo] = useState<{ isInApp: boolean; name: string }>({ isInApp: false, name: "" });
  useEffect(() => { setInfo(detectInAppBrowser()); }, []);
  return info;
}

/** Try to open the current URL in the system browser */
export function openInExternalBrowser() {
  const url = window.location.href;
  const ua = navigator.userAgent || "";
  // Android intent - works in most in-app browsers
  if (/Android/i.test(ua)) {
    const cleaned = url.replace(/^https?:\/\//, "");
    window.location.href = `intent://${cleaned}#Intent;scheme=https;package=com.android.chrome;end`;
    return;
  }
  // iOS - copy link as fallback (no reliable way to escape in-app browser)
  navigator.clipboard?.writeText(url).catch(() => {});
  window.open(url, "_blank", "noopener,noreferrer");
}
