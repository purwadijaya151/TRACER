const cliBaseUrl = process.argv[2]?.trim();
const envBaseUrl = process.env.WEBSITE_BASE_URL?.trim();
const rawBaseUrl = cliBaseUrl || envBaseUrl;

if (!rawBaseUrl) {
  console.error("WEBSITE_BASE_URL belum diisi. Pakai argumen atau environment variable.");
  process.exit(1);
}

const websiteBaseUrl = rawBaseUrl.replace(/\/+$/, "");
const checks = [
  {
    name: "register-alumni",
    url: `${websiteBaseUrl}/api/auth/register-alumni`,
    body: { nim: "", password: "" }
  },
  {
    name: "request-password-reset",
    url: `${websiteBaseUrl}/api/auth/request-password-reset`,
    body: { nim: "", email: "" }
  }
];

const failures = [];

for (const check of checks) {
  const response = await fetch(check.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(check.body)
  }).catch((error) => {
    failures.push(`${check.name}: request gagal (${error.message})`);
    return null;
  });

  if (!response) continue;

  if (response.status === 404) {
    failures.push(`${check.name}: endpoint belum ter-deploy (${response.status})`);
    continue;
  }

  if (response.status >= 500) {
    failures.push(`${check.name}: server error (${response.status})`);
    continue;
  }

  console.log(`[OK] ${check.name}: HTTP ${response.status}`);
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`[FAIL] ${failure}`));
  process.exit(1);
}

console.log(`Mobile auth endpoints OK untuk ${websiteBaseUrl}`);
