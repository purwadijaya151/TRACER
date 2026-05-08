import { INSTITUTION_EMAIL_DOMAIN, NPM_REGEX } from "@/lib/constants";

const TEN_DIGIT_NPM_REGEX = /^\d{10}$/;
const NPM_DIGITS_REGEX = /^\d{5,20}$/;

export function normalizeNim(value: string) {
  const trimmed = value.trim().replace(/\s+/g, "");
  const digitsOnly = trimmed.replace(/\./g, "");

  if (TEN_DIGIT_NPM_REGEX.test(digitsOnly)) {
    return `${digitsOnly.slice(0, 4)}.${digitsOnly.slice(4, 6)}.${digitsOnly.slice(6)}`;
  }

  return trimmed;
}

export function isValidNim(value: string) {
  const trimmed = value.trim().replace(/\s+/g, "");
  const digitsOnly = trimmed.replace(/\./g, "");

  return NPM_REGEX.test(trimmed) && NPM_DIGITS_REGEX.test(digitsOnly);
}

export function buildNimLookupCandidates(value: string) {
  const normalized = normalizeNim(value);
  const compact = normalized.replace(/\./g, "");
  const raw = value.trim().replace(/\s+/g, "");

  return Array.from(new Set([normalized, compact, raw].filter(Boolean)));
}

export function nimToInstitutionEmail(value: string) {
  return `${normalizeNim(value).toLowerCase()}@${INSTITUTION_EMAIL_DOMAIN}`;
}
