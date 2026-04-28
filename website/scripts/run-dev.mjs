import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { getAppDir } from "./lib/env.mjs";

const appDir = getAppDir(import.meta.url);
const args = process.argv.slice(2);

const host = readOption(["--host", "--hostname"]) || process.env.HOST || "127.0.0.1";
const port = readOption("--port") || process.env.PORT || "3002";
const distDir = readOption("--dist") || process.env.NEXT_DIST_DIR || `.next-dev-${port}`;
const shouldClean = args.includes("--clean");
const dryRun = args.includes("--dry-run");

const resolvedDistDir = path.resolve(appDir, distDir);
if (!isInsideApp(resolvedDistDir)) {
  throw new Error(`Refusing to use dist dir outside app directory: ${resolvedDistDir}`);
}

if (shouldClean && fs.existsSync(resolvedDistDir)) {
  fs.rmSync(resolvedDistDir, { recursive: true, force: true });
  console.log(`Removed ${resolvedDistDir}`);
}

const nextCommand = resolveNextCommand();
const nextArgs = ["dev", "--hostname", host, "--port", String(port)];

if (dryRun) {
  console.log(JSON.stringify({
    command: nextCommand.command,
    args: [...nextCommand.prefixArgs, ...nextArgs],
    host,
    port,
    distDir: path.relative(appDir, resolvedDistDir)
  }, null, 2));
  process.exit(0);
}

console.log(`Starting Next dev at http://${host}:${port}`);
console.log(`Using dist dir: ${path.relative(appDir, resolvedDistDir)}`);

const devServer = spawn(nextCommand.command, [...nextCommand.prefixArgs, ...nextArgs], {
  cwd: appDir,
  env: {
    ...process.env,
    NEXT_DIST_DIR: path.relative(appDir, resolvedDistDir)
  },
  shell: false,
  stdio: "inherit"
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    devServer.kill(signal);
  });
}

devServer.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

function readOption(names) {
  const optionNames = Array.isArray(names) ? names : [names];

  for (const name of optionNames) {
    const equalsPrefix = `${name}=`;
    const equalsArg = args.find((arg) => arg.startsWith(equalsPrefix));
    if (equalsArg) return equalsArg.slice(equalsPrefix.length).trim();

    const index = args.indexOf(name);
    if (index >= 0) return args[index + 1]?.trim();
  }

  return "";
}

function resolveNextCommand() {
  const localNext = path.join(appDir, "node_modules", "next", "dist", "bin", "next");

  if (fs.existsSync(localNext)) {
    return { command: process.execPath, prefixArgs: [localNext] };
  }

  return {
    command: process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "npx",
    prefixArgs: process.platform === "win32" ? ["/d", "/s", "/c", "npx.cmd", "next"] : ["next"]
  };
}

function isInsideApp(target) {
  const relative = path.relative(appDir, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
