import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { twMerge } from "tailwind-merge";
import type { Alumni, TracerStudy } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | null, pattern = "dd MMM yyyy") {
  if (!value) return "-";
  return format(new Date(value), pattern, { locale: id });
}

export function formatDateTime(value?: string | null) {
  return formatDate(value, "dd MMM yyyy, HH:mm");
}

export function initials(name?: string | null) {
  if (!name) return "AD";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function getTracerRecord(alumni: Alumni): TracerStudy | null {
  if (!alumni.tracer_study) return null;
  if (Array.isArray(alumni.tracer_study)) return alumni.tracer_study[0] ?? null;
  return alumni.tracer_study;
}

export function responseStatus(alumni: Alumni) {
  const tracer = getTracerRecord(alumni);
  return tracer?.is_submitted ? "Sudah Mengisi" : "Belum Mengisi";
}

export function assertEnv(name: string) {
  const value = process.env[name];
  if (!value || isPlaceholderEnvValue(value)) {
    throw new Error(`${name} belum dikonfigurasi`);
  }
  return value;
}

function isPlaceholderEnvValue(value: string) {
  const normalized = value.toLowerCase();
  return normalized.includes("replace-with") || normalized.includes("your-") || normalized.includes("change-this");
}
