import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

export async function ensureDevServer({ baseUrl, appPath, timeoutMs = 90_000 }) {
  if (await isServerReady(baseUrl)) return null;

  const { host, port } = devServerAddress(baseUrl);
  const nextDistDir = process.env.NEXT_DIST_DIR || `.next-dev-${port}`;
  const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "npm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", "npm.cmd", "run", "dev", "--", "--hostname", host, "--port", port]
    : ["run", "dev", "--", "--hostname", host, "--port", port];

  const devServer = spawn(command, args, {
    cwd: appPath,
    env: {
      ...process.env,
      NEXT_DIST_DIR: nextDistDir
    },
    shell: false,
    stdio: "ignore",
    windowsHide: true
  });

  await waitForServer(baseUrl, timeoutMs);
  return devServer;
}

export async function waitForServer(baseUrl, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isServerReady(baseUrl)) return;
    await delay(1_000);
  }
  throw new Error(`Dev server tidak siap di ${baseUrl}`);
}

export async function isServerReady(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/login`, { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

export function stopDevServer(processHandle) {
  if (!processHandle) return;
  if (process.platform === "win32" && processHandle.pid) {
    spawnSync("taskkill", ["/pid", String(processHandle.pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true
    });
    return;
  }
  processHandle.kill();
}

function devServerAddress(baseUrl) {
  const parts = new URL(baseUrl);
  return {
    host: parts.hostname || "127.0.0.1",
    port: parts.port || (parts.protocol === "https:" ? "443" : "80")
  };
}
