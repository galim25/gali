/** The public HTTPS origin Twilio is configured to call (ngrok tunnel in dev, real domain in production) — see docs/# IVR BarberBook.txt §4. */
export function publicBaseUrl(): string {
  const url = process.env.PUBLIC_BASE_URL;
  if (!url) throw new Error("PUBLIC_BASE_URL is not set");
  return url.replace(/\/$/, "");
}
