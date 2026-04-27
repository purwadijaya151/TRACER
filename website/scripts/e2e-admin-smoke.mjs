import fs from "node:fs";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const appDir = new URL("..", import.meta.url);
loadEnvFile(new URL(".env.local", appDir));

const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const adminNpp = requiredEnv("ADMIN_NPP");
const adminPassword = requiredEnv("ADMIN_PASSWORD");
const edgePath = process.env.E2E_EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const routes = [
  "dashboard",
  "dashboard/alumni",
  "dashboard/tracer-study",
  "dashboard/notifikasi",
  "dashboard/laporan",
  "dashboard/pengaturan"
];

const mobileRoutes = ["dashboard", "dashboard/tracer-study", "dashboard/laporan"];
let devServer;

try {
  const alreadyRunning = await isServerReady();
  if (!alreadyRunning) {
    devServer = spawn("npm.cmd", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3000"], {
      cwd: appDir,
      env: process.env,
      shell: false,
      stdio: "ignore",
      windowsHide: true
    });
    await waitForServer();
  }

  const result = await runSmoke();
  console.log(JSON.stringify(result, null, 2));
} finally {
  if (devServer) devServer.kill();
}

async function runSmoke() {
  const launchOptions = fs.existsSync(edgePath) ? { executablePath: edgePath, headless: true } : { headless: true };
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const pageErrors = [];
  const notFound = [];

  page.on("pageerror", (error) => pageErrors.push(String(error.message ?? error).slice(0, 500)));
  page.on("response", (response) => {
    const url = response.url();
    if (response.status() === 404 && !url.endsWith("/favicon.ico")) notFound.push(url);
  });

  const loginResponse = await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("NPP Admin").fill(adminNpp);
  await page.getByLabel("Password").fill(adminPassword);
  await Promise.all([
    page.waitForURL(/\/dashboard(?:$|\?)/, { timeout: 30_000 }),
    page.getByRole("button", { name: "Masuk" }).click()
  ]);

  const desktop = [];
  for (const route of routes) desktop.push(await pageMetrics(page, route, "desktop"));

  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = [];
  for (const route of mobileRoutes) mobile.push(await pageMetrics(page, route, "mobile"));

  await page.setViewportSize({ width: 1440, height: 900 });
  const modals = await modalSmoke(page);
  await browser.close();

  const failures = [
    ...desktop,
    ...mobile,
    ...modals
  ].filter((item) => item.status && item.status !== 200 || item.horizontalOverflow || item.tinyTextCount > 0 || item.hasRuntimeError || item.hasLoadFailureText);

  if (pageErrors.length > 0 || notFound.length > 0 || failures.length > 0 || loginResponse?.status() !== 200) {
    throw new Error(JSON.stringify({ pageErrors, notFound, failures, loginStatus: loginResponse?.status() ?? null }, null, 2));
  }

  return {
    loginStatus: loginResponse?.status() ?? null,
    desktop,
    mobile,
    modals,
    pageErrors,
    notFound
  };
}

async function pageMetrics(page, route, viewport) {
  const response = await page.goto(`${baseUrl}/${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(250);

  return page.evaluate(({ route, viewport, status }) => {
    const textNodes = visibleTextNodes(document);
    const bodyText = document.body.innerText || "";
    return {
      route,
      viewport,
      status,
      headings: Array.from(document.querySelectorAll("h1,h2"))
        .filter(isVisible)
        .map((element) => (element.textContent || "").trim())
        .filter(Boolean)
        .slice(0, 5),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      tinyTextCount: textNodes.filter((item) => item.fontSize < 12).length,
      visibleTextCount: textNodes.length,
      hasRuntimeError: /Application error|Unhandled Runtime Error|NEXT_PUBLIC_SUPABASE|belum dikonfigurasi/i.test(bodyText),
      hasLoadFailureText: /Gagal memuat data/i.test(bodyText)
    };

    function visibleTextNodes(root) {
      return Array.from(root.querySelectorAll("p,span,label,button,a,th,td,h1,h2,h3,input,select,textarea"))
        .filter(isVisible)
        .map((element) => {
          const style = window.getComputedStyle(element);
          const text = element.tagName === "INPUT" || element.tagName === "TEXTAREA"
            ? element.getAttribute("placeholder") || element.getAttribute("aria-label") || ""
            : (element.textContent || "").trim();
          return {
            text: text.replace(/\s+/g, " ").slice(0, 80),
            fontSize: Number.parseFloat(style.fontSize)
          };
        })
        .filter((item) => item.text);
    }

    function isVisible(element) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    }
  }, { route, viewport, status: response?.status() ?? null });
}

async function modalSmoke(page) {
  const checks = [
    {
      route: "dashboard/alumni",
      name: "Tambah Alumni",
      button: /Tambah Alumni/
    },
    {
      route: "dashboard/notifikasi",
      name: "Kirim Notifikasi",
      button: /Kirim Notifikasi/
    },
    {
      route: "dashboard/laporan",
      name: "Generate Laporan",
      button: /Laporan Data Alumni/
    }
  ];

  const results = [];
  for (const check of checks) {
    await page.goto(`${baseUrl}/${check.route}`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: check.button }).click();
    await page.waitForSelector('[data-testid="modal-panel"]', { state: "visible", timeout: 10_000 });
    results.push(await modalMetrics(page, check.name));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  }
  return results;
}

async function modalMetrics(page, name) {
  return page.locator('[data-testid="modal-panel"]').evaluate((panel, name) => {
    const textNodes = Array.from(panel.querySelectorAll("p,span,label,button,th,td,h2,h3,input,select,textarea"))
      .filter(isVisible)
      .map((element) => {
        const style = window.getComputedStyle(element);
        const text = element.tagName === "INPUT" || element.tagName === "TEXTAREA"
          ? element.getAttribute("placeholder") || element.getAttribute("aria-label") || ""
          : (element.textContent || "").trim();
        return {
          text: text.replace(/\s+/g, " ").slice(0, 80),
          fontSize: Number.parseFloat(style.fontSize)
        };
      })
      .filter((item) => item.text);

    return {
      name,
      title: panel.querySelector("h2")?.textContent?.trim() ?? "",
      status: 200,
      horizontalOverflow: panel.scrollWidth > panel.clientWidth + 1,
      tinyTextCount: textNodes.filter((item) => item.fontSize < 12).length,
      visibleTextCount: textNodes.length,
      hasRuntimeError: false,
      hasLoadFailureText: /Gagal memuat data/i.test(panel.textContent || "")
    };

    function isVisible(element) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    }
  }, name);
}

async function waitForServer() {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (await isServerReady()) return;
    await delay(1_000);
  }
  throw new Error(`Dev server tidak siap di ${baseUrl}`);
}

async function isServerReady() {
  try {
    const response = await fetch(`${baseUrl}/login`, { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

function loadEnvFile(url) {
  if (!fs.existsSync(url)) return;
  const lines = fs.readFileSync(url, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = stripQuotes(rawValue.trim());
  }
}

function stripQuotes(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} belum dikonfigurasi`);
  return value;
}
