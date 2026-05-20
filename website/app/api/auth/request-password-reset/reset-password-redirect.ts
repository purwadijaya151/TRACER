export function resolvePasswordResetRedirectTo(request: Request) {
  const configuredRedirect = process.env.PASSWORD_RESET_REDIRECT_TO?.trim();
  const derivedRedirect = buildResetPasswordUrl(request);

  if (!configuredRedirect) {
    return derivedRedirect;
  }

  if (isLocalRedirect(configuredRedirect) && !isLocalRedirect(derivedRedirect)) {
    return derivedRedirect;
  }

  if (isVercelDeployment() && isLocalRedirect(configuredRedirect)) {
    return derivedRedirect;
  }

  return configuredRedirect;
}

function buildResetPasswordUrl(request: Request) {
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

  if (vercelUrl?.trim()) {
    return `https://${vercelUrl.trim().replace(/^https?:\/\//, "").replace(/\/$/, "")}/reset-password`;
  }

  return `${new URL(request.url).origin}/reset-password`;
}

function isVercelDeployment() {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_URL);
}

function isLocalRedirect(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.trim().toLowerCase();

    if (!/^https?:$/i.test(url.protocol)) {
      return false;
    }

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "[::1]" ||
      hostname === "10.0.2.2" ||
      hostname === "host.docker.internal" ||
      hostname.endsWith(".local")
    ) {
      return true;
    }

    return isPrivateIpv4(hostname);
  } catch {
    return false;
  }
}

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map((part) => Number(part));

  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  if (parts[0] === 10) return true;
  if (parts[0] === 127) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  return false;
}
