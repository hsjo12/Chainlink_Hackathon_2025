import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLocalDate(
  iso: string,
  locale: string = navigator.language
): string {
  const d = new Date(iso);

  const timeStr = d
    .toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();

  const dateStr = d.toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `${timeStr} ${dateStr}`;
}

export function formatDateForInput(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function isoToEpoch(isoString: string): number {
  return Math.floor(new Date(isoString).getTime() / 1000);
}
