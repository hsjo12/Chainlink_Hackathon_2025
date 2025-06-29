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

export function truncateText(text: string, maxLength: number = 20): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export async function getNFTsForOwner(ownerAddress: string) {
  const apiKey = "v9bPWLlf-Ss2mawwZD71ErpZUmYA3W0a"; // default
  const url = `https://eth-sepolia.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner?owner=${encodeURIComponent(
    ownerAddress
  )}&withMetadata=true&pageSize=100`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Alchemy API Error: ${error}`);
  }

  const data = await res.json();
  return data;
}
export function escapeStringForSolidity(str: string) {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}
