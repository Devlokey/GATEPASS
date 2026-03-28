import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind CSS classes safely
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert paise to rupees display string (e.g. 50000 → "₹500")
export function formatPrice(paise: number): string {
  if (paise === 0) return "Free";
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

// Convert rupees to paise for storage
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

// Generate a URL-safe slug from a title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Format a date for display
export function formatDate(dateStr: string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return "TBD";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  });
}

// Format a datetime for display
export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Check if a registration window is open
export function isRegistrationOpen(start: string | null, end: string | null): boolean {
  const now = new Date();
  if (start && new Date(start) > now) return false;
  if (end && new Date(end) < now) return false;
  return true;
}

// Truncate long strings for display
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}
