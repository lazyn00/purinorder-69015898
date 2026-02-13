import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Get current time in Vietnam timezone */
export function nowVN() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
}

/** Format a date string to Vietnam timezone */
export function formatDateVN(dateStr: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(dateStr).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    ...options,
  });
}

/** Format date only (dd/MM/yyyy) in Vietnam timezone */
export function formatDateOnlyVN(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Format date + time in Vietnam timezone */
export function formatDateTimeVN(dateStr: string) {
  return new Date(dateStr).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
