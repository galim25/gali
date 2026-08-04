import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// Host/IP for `next dev` to accept requests from besides localhost (e.g. a
// VPS IP while testing over the network before a real domain exists) — kept
// out of source so the server's address isn't committed to git history.
// Set DEV_ALLOWED_ORIGIN in .env to your dev host's IP/hostname.
const devAllowedOrigin = process.env.DEV_ALLOWED_ORIGIN;

const nextConfig: NextConfig = {
  ...(devAllowedOrigin ? { allowedDevOrigins: [devAllowedOrigin] } : {}),
};

// Generates public/sw.js from src/app/sw.ts at build time and injects the
// client-side registration script. Disabled in dev by default (Serwist's
// own default) so `next dev` never serves a stale cached bundle — the PWA
// only becomes installable/offline-capable after `pnpm build && pnpm start`.
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

export default withSerwist(nextConfig);
