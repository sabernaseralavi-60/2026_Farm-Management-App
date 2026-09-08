import type { NextConfig } from "next";

// Baseline security headers — there were none configured before, which left
// every page framable by any origin (clickjacking) and no explicit MIME/
// referrer hardening. `frame-ancestors 'none'` (not `script-src`/`style-src`)
// is deliberately the only CSP directive set here: it can't break Next's
// hydration/RSC inline scripts, while still closing the clickjacking gap —
// a stricter script-src CSP would need nonce wiring through middleware,
// which is a bigger change than this pass covers.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Browsers ignore this over plain http (dev), so it's a no-op locally and
  // only takes effect once the app is actually served over https.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
