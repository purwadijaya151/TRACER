import fs from "node:fs";
import path from "node:path";
import { getAppDir } from "./lib/env.mjs";

const appDir = getAppDir(import.meta.url);
const workspaceRoot = path.resolve(appDir);
const dryRun = process.argv.includes("--dry-run");
const cleanAll = process.argv.includes("--all");
const keepNames = new Set(readOptionValues("--keep"));

const targets = cleanAll ? findNextCacheDirs() : [".next"];
const removed = [];
const skipped = [];

for (const targetName of targets) {
  if (keepNames.has(targetName)) {
    skipped.push(`${targetName} (kept)`);
    continue;
  }

  const target = path.resolve(appDir, targetName);
  assertInsideApp(target);

  if (!fs.existsSync(target)) {
    skipped.push(`${targetName} (missing)`);
    continue;
  }

  if (dryRun) {
    skipped.push(`${targetName} (dry-run)`);
    continue;
  }

  fs.rmSync(target, { recursive: true, force: true });
  removed.push(targetName);
}

if (dryRun) {
  console.log(`Dry run: would remove ${targets.filter((target) => !keepNames.has(target)).join(", ") || "nothing"}`);
} else if (removed.length) {
  console.log(`Removed ${removed.join(", ")}`);
} else {
  console.log("No Next cache removed.");
}

if (skipped.length) {
  console.log(`Skipped ${skipped.join(", ")}`);
}

function findNextCacheDirs() {
  return fs
    .readdirSync(appDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && (entry.name === ".next" || entry.name.startsWith(".next-dev")))
    .map((entry) => entry.name)
    .sort();
}

function readOptionValues(name) {
  const values = [];
  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === name && args[index + 1]) {
      values.push(args[index + 1]);
      index += 1;
    } else if (arg.startsWith(`${name}=`)) {
      values.push(arg.slice(name.length + 1));
    }
  }

  return values.map((value) => value.trim()).filter(Boolean);
}

function assertInsideApp(target) {
  const relative = path.relative(workspaceRoot, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to remove path outside app directory: ${target}`);
  }
}
