import type { NextConfig } from "next";

// Host/IP for `next dev` to accept requests from besides localhost (e.g. a
// VPS IP while testing over the network before a real domain exists) — kept
// out of source so the server's address isn't committed to git history.
// Set DEV_ALLOWED_ORIGIN in .env to your dev host's IP/hostname.
const devAllowedOrigin = process.env.DEV_ALLOWED_ORIGIN;

const nextConfig: NextConfig = {
  ...(devAllowedOrigin ? { allowedDevOrigins: [devAllowedOrigin] } : {}),
};

export default nextConfig;
