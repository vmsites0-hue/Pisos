const SENSITIVE_KEY = /(password|contrase(?:n|ñ)a|token|secret|cookie|authorization)/i;

export function sanitizeAuditData(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(sanitizeAuditData);
  if (typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      SENSITIVE_KEY.test(key) ? "[REDACTED]" : sanitizeAuditData(nested),
    ]),
  );
}
