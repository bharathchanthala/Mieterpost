// Small helpers that turn raw database values into display text.
import type { Message } from "@/db/schema";

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
});

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "Europe/Berlin",
});

const euroFormat = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
});

const numberFormat = new Intl.NumberFormat("en-GB");

export function formatDateTime(value: Date) {
  return dateTimeFormat.format(value);
}

// Accepts a Date or a "YYYY-MM-DD" string (how Postgres `date` columns arrive).
export function formatDate(value: Date | string) {
  return dateFormat.format(new Date(value));
}

// Rent is stored in cents; divide by 100 only for display.
export function formatEuro(cents: number) {
  return euroFormat.format(cents / 100);
}

// Postgres `numeric` columns arrive as strings like "54.50".
export function formatNumber(value: string | number) {
  return numberFormat.format(Number(value));
}

export const statusLabels: Record<Message["status"], string> = {
  new: "New",
  drafted: "Drafted",
  answered: "Answered",
};

export const categoryLabels: Record<
  NonNullable<Message["category"]>,
  string
> = {
  repair: "Repair",
  payment: "Payment",
  question: "Question",
  other: "Other",
};
