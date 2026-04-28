export function quotePostgrestValue(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function buildIlikeOrFilter(columns: string[], search: string) {
  const trimmed = search.trim();
  if (!trimmed) return "";

  const pattern = quotePostgrestValue(`%${trimmed}%`);
  return columns.map((column) => `${column}.ilike.${pattern}`).join(",");
}
