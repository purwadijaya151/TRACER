import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function getAppDir(importMetaUrl) {
  return path.resolve(path.dirname(fileURLToPath(importMetaUrl)), "..");
}

export function loadEnvFiles(appDir, filenames = [".env", ".env.local"]) {
  const loaded = {};

  for (const filename of filenames) {
    Object.assign(loaded, readEnvFile(path.join(appDir, filename)));
  }

  for (const [key, value] of Object.entries(loaded)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return { ...loaded, ...process.env };
}

export function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return acc;

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) return acc;

      const [, key, rawValue] = match;
      acc[key] = stripEnvQuotes(rawValue.trim());
      return acc;
    }, {});
}

export function requiredEnv(name, env = process.env) {
  const value = env[name]?.trim();
  if (!value || isPlaceholderValue(value)) {
    throw new Error(`${name} belum dikonfigurasi`);
  }
  return value;
}

export function envOrDefault(name, fallback, env = process.env) {
  return env[name]?.trim() || fallback;
}

export function numberEnvOrDefault(name, fallback, env = process.env) {
  const raw = env[name]?.trim();
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value)) throw new Error(`${name} harus angka bulat`);
  return value;
}

function stripEnvQuotes(value) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function isPlaceholderValue(value) {
  const normalized = value.toLowerCase();
  return normalized.includes("replace-with") || normalized.includes("your-") || normalized.includes("change-this");
}
