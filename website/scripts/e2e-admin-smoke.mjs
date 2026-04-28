import fs from "node:fs";
import { chromium } from "playwright";
import { getAppDir, loadEnvFiles, requiredEnv } from "./lib/env.mjs";
import { ensureDevServer, stopDevServer } from "./lib/next-dev-server.mjs";

const appPath = getAppDir(import.meta.url);
const env = loadEnvFiles(appPath);

const baseUrl = env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const adminNpp = requiredEnv("ADMIN_NPP", env);
const adminPassword = requiredEnv("ADMIN_PASSWORD", env);
const edgePath = env.E2E_EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const routes = [
  "dashboard",
  "dashboard/alumni",
  "dashboard/tracer-study",
  "dashboard/pertanyaan",
  "dashboard/notifikasi",
  "dashboard/laporan",
  "dashboard/pengaturan"
];

const mobileRoutes = routes;
let devServer;

try {
  devServer = await ensureDevServer({ baseUrl, appPath });
  const result = await runSmoke();
  console.log(JSON.stringify(result, null, 2));
} finally {
  if (devServer) stopDevServer(devServer);
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

  const loginResponse = await gotoAppPage(page, "login");
  await page.getByLabel("NPP Admin").fill(adminNpp);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForFunction(() => window.location.pathname.startsWith("/dashboard"), null, { timeout: 30_000 });
  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => null);

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
  const response = await gotoAppPage(page, route);
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
      route: "dashboard/pertanyaan",
      name: "Tambah Pertanyaan",
      button: /Tambah Pertanyaan/
    },
    {
      route: "dashboard/laporan",
      name: "Generate Laporan",
      button: /Laporan Data Alumni/
    }
  ];

  const results = [];
  for (const check of checks) {
    await gotoAppPage(page, check.route);
    await page.getByRole("button", { name: check.button }).click();
    await page.waitForSelector('[data-testid="modal-panel"]', { state: "visible", timeout: 10_000 });
    results.push(await modalMetrics(page, check.name));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  }
  return results;
}

async function gotoAppPage(page, route) {
  const path = route.startsWith("/") ? route : `/${route}`;
  const response = await page.goto(`${baseUrl}${path}`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000
  });

  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => null);
  return response;
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
