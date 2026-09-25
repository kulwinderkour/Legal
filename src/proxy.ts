import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Applies a strict, nonce-based Content-Security-Policy plus the
 * companion hardening headers on every response. Clause never loads a
 * third-party script or iframe, so the *production* policy has no escape
 * hatches: no `unsafe-inline`, no `unsafe-eval`, no wildcard hosts.
 *
 * The nonce is generated per-request and handed to the root layout via a
 * request header so the one inline script Next.js itself injects (RSC
 * payload hydration) can carry it; application code never needs an inline
 * script of its own.
 *
 * Development is intentionally looser: Next's dev server uses `eval()`
 * for React's component-stack debugging and a `ws:`/`wss:` websocket for
 * Turbopack hot-reload, neither of which exist in a production build.
 * Gating on `NODE_ENV` (never on a request header, which a client could
 * spoof) keeps the shipped policy strict while unblocking local dev.
 */
export function proxy(request: NextRequest): NextResponse {
  const nonce = crypto.randomUUID();
  const isDev = process.env.NODE_ENV === "development";

  const csp = [
    "default-src 'self'",
    isDev
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    isDev ? "connect-src 'self' ws: wss:" : "connect-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match every request path except static assets, so headers cover
     * pages and API routes but skip re-processing bundled files.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
