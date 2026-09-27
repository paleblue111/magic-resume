/**
 * Access codes map 1:1 to a server-side namespace folder under ./data/spaces/<code>/.
 * Treat the code as a shared-secret folder name — sanitize aggressively.
 */

const CODE_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$/;
const RESERVED = new Set([".", "..", "con", "prn", "aux", "nul"]);

export function sanitizeSpaceCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim();
  if (!code || code.length < 3 || code.length > 64) return null;
  if (code.includes("/") || code.includes("\\") || code.includes("\0")) return null;
  if (code.includes("..")) return null;
  if (!CODE_PATTERN.test(code)) return null;
  if (RESERVED.has(code.toLowerCase())) return null;
  return code;
}

export const SPACE_COOKIE = "space_code";
export const SPACE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

export function getSpaceCodeFromRequest(request: Request): string | null {
  const cookies = parseCookies(request.headers.get("cookie"));
  return sanitizeSpaceCode(cookies[SPACE_COOKIE] ?? "");
}

function cookieSecureFlag(): string {
  // Opt-in Secure for HTTPS deployments. Default off so local `pnpm start` on HTTP works.
  if (process.env.COOKIE_SECURE === "1" || process.env.COOKIE_SECURE === "true") {
    return "; Secure";
  }
  return "";
}

export function buildSetSpaceCookie(code: string): string {
  return `${SPACE_COOKIE}=${encodeURIComponent(code)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SPACE_COOKIE_MAX_AGE}${cookieSecureFlag()}`;
}

export function buildClearSpaceCookie(): string {
  return `${SPACE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${cookieSecureFlag()}`;
}
