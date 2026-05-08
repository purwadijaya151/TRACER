export function buildAvatarUrl(src?: string | null, cacheKey?: string | null) {
  if (!src) return null;
  if (!cacheKey) return src;

  try {
    const url = new URL(src);
    url.searchParams.set("v", cacheKey);
    return url.toString();
  } catch {
    const separator = src.includes("?") ? "&" : "?";
    return `${src}${separator}v=${encodeURIComponent(cacheKey)}`;
  }
}
