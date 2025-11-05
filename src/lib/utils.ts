import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTH_ABBREVIATIONS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDateLabel(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const datePart = value.includes("T") ? value.split("T")[0] : value;
  const [, month, day] = datePart.split("-");

  const monthIndex = Number.parseInt(month ?? "", 10) - 1;
  const dayNumber = Number.parseInt(day ?? "", 10);

  if (Number.isFinite(monthIndex) && monthIndex >= 0 && monthIndex < MONTH_ABBREVIATIONS.length && Number.isFinite(dayNumber)) {
    return `${MONTH_ABBREVIATIONS[monthIndex]} ${dayNumber}`;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const iso = parsed.toISOString();
    // Avoid infinite loop if parsing did not normalize the value.
    if (iso !== value) {
      return formatDateLabel(iso);
    }
  }

  return null;
}
