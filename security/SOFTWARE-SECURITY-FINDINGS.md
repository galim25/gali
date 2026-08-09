# Software Security Findings — BarberBook (אפליקציה לניהול תורים למספרה) — 2026-07-26

> Read-only audit against the 16 software-security principles. No code was modified.
> Scope: whole repo (`apps/web`, `apps/worker`, `packages/db`, `packages/shared`).  Verify pass: /security-review skipped (not available in this environment).

## Summary

| Severity | Count |
|---|---|
| 🔴 critical | 3 |
| 🟡 risk | 5 |
| 🔵 nit | 0 |

**Principles covered:** 9 / 11 code-auditable (7 file handling — no upload handlers exist, N/A; 5 Privacy-by-design — noted as out-of-code)  ·  **Domains:** authn/authz · input/files · data/secrets/sessions · errors/defaults · supply-chain

Top 3 to fix first:
1. 🔴 `apps/web/src/lib/actions/auth.ts:106` — password-reset OTP has no rate limit/lockout; brute-forceable within its 10-minute TTL → full account takeover (incl. the seeded admin phone number).
2. 🔴 `packages/db/prisma/seed.ts:24` — admin account is seeded with a hardcoded, weak, known password (`admin123`).
3. 🔴 `apps/web/package.json:12` (`next: "16.2.10"`) — running a Next.js version with published HIGH-severity CVEs, including a middleware/proxy-bypass advisory directly relevant to this app's `/admin` guard design.

---

## 1. Authentication — PASS (with one gap below)

- 🔴 `apps/web/src/lib/actions/auth.ts:106` — `resetPasswordAction` has no attempt limit, lockout, or throttling on guessing the 6-digit `PasswordResetCode.code`. The code space is 10^6 and the TTL is 10 minutes (`packages/shared/src/index.ts:23`, `PASSWORD_RESET_CODE_TTL_MINUTES = 10`). A repo-wide grep for rate-limit/throttle logic found none anywhere in the app. An attacker who knows a victim's phone number (the admin's is a fixed seeded value, see finding below) can call `forgotPasswordAction` then script through the code space against `resetPasswordAction` within the 10-minute window and set a new password — full account takeover, no MFA, no notification to the real owner.
  **Why:** `06-tokens-and-sessions.md §7 "Password-reset token"` + `11-secure-communication.md §Rate limiting & abuse control`. **Fix:** add a per-phone-number (and/or per-IP) attempt counter with lockout/backoff on `resetPasswordAction`, and/or cap outstanding `PasswordResetCode` guesses (e.g. invalidate the code after N failed attempts). Consider lengthening the code or shortening the TTL as a secondary hardening.

- 🟡 `apps/web/src/lib/actions/auth.ts:51` — `loginAction` also has no rate limit/lockout on password attempts (same repo-wide grep found nothing). Passwords only need to be 6+ characters (`apps/web/src/lib/validation.ts:9`), so this is crackable by an unthrottled online attack against a known phone number.
  **Why:** `11-secure-communication.md §Rate limiting`. **Fix:** add login attempt throttling (per phone number and/or per IP), e.g. exponential backoff or a temporary lockout after N failures.

- 🟡 `apps/web/src/lib/actions/auth.ts:76` — `generateOtp()` uses `Math.random()`, not a CSPRNG, to produce the password-reset code. Low incremental risk by itself (the 6-digit space is already small) but it compounds with the missing rate limit above — a hardened implementation should use `crypto.randomInt`.
  **Why:** `06-tokens-and-sessions.md §7`. **Fix:** replace `Math.random()`-based `generateOtp` with `crypto.randomInt(100000, 1000000)`.

## 2. Authorization (IDOR / ownership) — PASS

Checked every mutating/sensitive-read server action in `apps/web/src/lib/actions/*.ts` (booking, adminAppointments, cancellationRequests, bookingRequests, workdays, waitlist, blocklist, announcements, settings, adminNotifications):
- All admin-only actions gate on `session.role === "administrator"` via a local `requireAdminSession()`/`requireAdmin()` check before touching the DB (admin is intentionally allowed to act on *any* appointment/day/request — that's the product's ownership model, not IDOR).
- Customer-facing mutations correctly scope to the caller: `rescheduleAppointmentAction` (`apps/web/src/lib/actions/booking.ts:209`) checks `appointment.booked_by_user_id !== session.sub`; `requestCancellationAction` (`apps/web/src/lib/actions/cancellationRequests.ts:38`) checks the same; waitlist join/leave (`apps/web/src/lib/actions/waitlist.ts`) always scope by `session.sub`, never a client-supplied id.
- All 11 `/admin/**/page.tsx` files call `requireAdmin()` (verified individually), and `apps/web/src/proxy.ts` matches `/admin/:path*` — the documented double-guard is intact in the code as-is.

No unscoped `findById`/`findUnique` on a user-owned resource reachable by a non-owner was found.

## 3. Input Validation (mass-assignment) — PASS

Next.js Server Actions here take typed function arguments, not a generic `req.body`/`Object.assign` spread — no action reads an arbitrary JSON body into a Prisma `data:` object. Privileged fields (`role`, `booked_by_user_id`, `reviewed_by_user_id`, `blocked_by_user_id`, `published_by_user_id`) are always server-derived from `session.sub`/hardcoded literals, never taken from client input. `registerAction` hardcodes `role: "customer"` (`apps/web/src/lib/actions/auth.ts:43`) — no client path to self-register as admin. No raw SQL (`$queryRaw`/`$executeRaw`), `eval`, or `dangerouslySetInnerHTML` found anywhere in `apps/web/src` or `apps/worker/src` (repo-wide grep, zero hits) — Prisma parameterizes queries and JSX auto-escapes rendered content, closing off SQL-injection/XSS via the obvious sinks.

## 4. Data Protection

- 🟡 `packages/shared/src/sms.ts:5-8` (`MockSmsProvider.send`) + called from `apps/web/src/lib/actions/auth.ts:100` — when the optional `SMS_PROVIDER=mock` env flag is set (offered in `.env.example` as a documented option, not just a dev-only hardcode), the password-reset OTP code is written verbatim to `console.log`, i.e. into whatever captures stdout (terminal, systemd journal, container log driver). A live, guessable-in-window credential landing in general application logs is exactly the anti-pattern the logging principle warns against.
  **Why:** `10-logging-and-audit.md §What to NEVER log` ("OTPs ... never"). **Fix:** if `SMS_PROVIDER=mock` must exist for real (non-dev-machine) environments, redact the code from the logged line (e.g. log "OTP sent" without the value), or gate the mock provider to be unreachable outside a `NODE_ENV=development`/explicit dev flag.

No other sensitive-field exposure found: `password_hash` is never selected into any value returned to a client component (grepped all `prisma.user.find*` call sites); phone numbers are shown only to the admin (who legitimately needs them to contact customers) and to the owning customer.

## 6. Sessions & tokens

- 🟡 `apps/web/src/lib/auth/jwt.ts:5` — sessions are a stateless signed JWT (`SESSION_DURATION_SECONDS = 30 days`) with no server-side store, so there is no way to revoke a specific session early. `logoutAction` (`apps/web/src/lib/actions/auth.ts:70`) only clears the client cookie — a copied/stolen token stays valid for up to 30 days regardless. More concretely, `resetPasswordAction` (`apps/web/src/lib/actions/auth.ts:106`) changes the password but does **not** invalidate any session already issued for that account, so a session hijacked before the reset survives the password change.
  **Why:** `06-tokens-and-sessions.md §Lifecycle: expiry, rotation, revocation` ("On sensitive change ... invalidate existing sessions"). **Fix:** couldn't find a fix that keeps the current fully-stateless design — needs a human decision (why: real revocation requires either a server-side session/denylist store or a per-user `tokens_valid_after` timestamp checked on every `verifySessionToken`, both of which are a real architecture change, not a one-line patch). Shortening `SESSION_DURATION_SECONDS` would reduce exposure without solving it.

Cookie flags themselves are handled correctly: `httpOnly: true`, `sameSite: "lax"`, and `secure` correctly env-gated via `COOKIE_SECURE`/`NODE_ENV` (`apps/web/src/lib/auth/session.ts:22-36`, matches the documented rationale in `CLAUDE.md`). JWT verification pins `alg: HS256` server-side (never trusts a header), and `getSecretKey()` (`apps/web/src/lib/auth/jwt.ts:7-13`) fails closed (throws) if `SESSION_SECRET` is missing or under 16 chars.

## 9. Logging & monitoring — PASS (see Data Protection #4 for the one OTP-logging gap, filed there to avoid duplicating it)

No other `console.log`/`console.error` call in `apps/web/src` dumps a request body, password, or token — the only console output sites in the whole repo are `apps/worker/src/index.ts` (cron status/error logging, no PII), `packages/db/prisma/seed.ts` (seed status), and `packages/shared/src/sms.ts` (the OTP-leak finding above).

## 10. Error handling (fail-closed) — WARN

- 🟡 `apps/web/src/lib/actions/blocklist.ts:64` — `unblockPhoneNumberAction` does `prisma.blockedPhoneNumber.delete({ where: { id } }).catch(() => null)` and then unconditionally returns `{ success: true }`. Deleting an already-removed row is safely idempotent, but this also silently swallows *any other* delete failure (e.g. a transient DB error) and reports success to the admin regardless, so a real failure would go unnoticed.
  **Why:** `03-error-handling.md §7 "Don't swallow critical errors"`. **Fix:** only swallow the specific "record not found" case (Prisma error code `P2025`) and surface/log other errors instead of a blanket `.catch(() => null)`.

All other action `catch` blocks reviewed (`booking.ts`, `adminAppointments.ts`) map specific thrown sentinel errors (`SLOT_TAKEN`, `PAST_SLOT`, `DAY_BLOCKED`, etc.) to safe, generic Hebrew user-facing messages and fall through to a generic "couldn't save, try again" for anything unrecognized — no raw stack traces or Prisma/DB error text is returned to the client in any reviewed action. Multi-step booking/reschedule flows correctly use `runSerializable`/`prisma.$transaction` (e.g. `apps/web/src/lib/actions/booking.ts:103`, `apps/web/src/lib/actions/adminAppointments.ts:74`) so there's no observed half-updated-state risk in the appointment-slot logic.

## 11. Secure defaults — FAIL

- 🔴 `packages/db/prisma/seed.ts:16-27` — the seed script upserts an `administrator` account with a hardcoded phone number (`0500000000`) and a hardcoded, weak plaintext-source password (`admin123`, only hashed at insert time). `pnpm db:seed` is part of the documented setup flow (`CLAUDE.md` "שם מנהל המערכת") and the `update:` branch only refreshes `full_name`, so on a fresh deploy this is the actual initial admin credential — a known, guessable default sitting in source control, exactly the "seed data with a fixed admin" anti-pattern.
  **Why:** `04-secure-defaults.md §9 "Dev environment doesn't behave like prod"` (seed data with a fixed admin). **Fix:** generate a random password at seed time and print/require it out-of-band (or force a password reset on first admin login) instead of a fixed literal; at minimum, document loudly that `admin123` must be rotated immediately after the first deploy, and consider failing the seed in a `NODE_ENV=production` run unless an explicit override is passed.

---

## Out-of-code (process/infra) notes
Operational-permission items (domain 3) that surfaced — reported as context, not code defects:
- Rotating/handing off the `admin123` seeded credential after first deploy is an operational step, not just a code fix — even with a code fix (random password), someone has to actually retrieve and use it.
- TLS/HTTPS termination, HSTS, and CORS are handled (per `CLAUDE.md`'s stack diagram) at the Nginx/aaPanel layer in front of the Next.js container, not in this codebase — out of scope for this audit; see `infra-security-review` for that layer. No app-level CORS/security-headers config exists in `apps/web/next.config.ts`, which is consistent with delegating that to the reverse proxy but wasn't independently verified.
- `SESSION_SECRET`/`DATABASE_URL`/`FIGMA_ACCESS_TOKEN` all live in untracked `.env` files (verified via `git ls-files` — none of the four `.env` files in the repo are tracked, and `.gitignore` covers `.env`/`.env.local`/`.env.*.local`). Who has filesystem/deploy access to those `.env` files is a process control, not a code one.

## Low-confidence / needs human review
- 🟡? `apps/web/next.config.ts` — no CSP/HSTS/security-headers configuration in the Next.js app itself. Not flagged as a hard finding because the stack diagram in `CLAUDE.md` places Nginx in front of the app and headers may be set there — but that placement wasn't verified in this audit (no Nginx config in this repo to inspect). Recommend confirming HSTS/CSP are actually set at the Nginx layer.

## Coverage gaps & follow-ups
This report is **not exhaustive**. What was not covered:
- **Not scanned / out of scope:** Nginx/aaPanel reverse-proxy configuration, container/deploy configuration, and OS-level hardening — all infra, not in this repo → `infra-security-review`. Runtime confirmation that the findings above are actually exploitable against a live instance (e.g. actually scripting an OTP brute force end-to-end) was not performed — this is a static code review, not a pentest → `runtime-verify`.
- **Supply-chain (principle 12):** ran `pnpm audit --prod` read-only (no code/lockfile changes). Found: `next@16.2.10` has 5 HIGH-severity published advisories fixed in `>=16.2.11` (patch bump), including `GHSA-6gpp-xcg3-4w24` "Middleware / Proxy bypass in App Router applications using Turbopack and single locale" — flagged as 🔴 in the Top-3 above and cross-referenced here because it's the same code path (`apps/web/src/proxy.ts`) this app's `/admin` guard relies on for layer 1 of its documented double-guard; whether this specific app's dev/build actually uses Turbopack under the vulnerable condition was **not** independently confirmed, but the fix is a zero-risk patch bump regardless. Also found: transitively-pulled `sharp` (via `next`) has 4 HIGH-severity libvips CVEs, fixed by the same `next` upgrade pulling in a patched `sharp`. No dependency confusion, no unpinned floating majors beyond normal `^`/`workspace:*` ranges, and `pnpm-lock.yaml` is present and committed.
- **Blind spots:** frontend/client-component code was read for secret-exposure only (grepped for `NEXT_PUBLIC_`/`process.env` — none found outside server-only files), not for a full UI/business-logic correctness pass (that's `CLAUDE.md`'s own documented territory, e.g. the not-yet-browser-tested FR-28/US-025 flows). Playwright test files, if any beyond `availability.test.ts`/`dayTimeline.test.ts`, were not opened. Principle 5 (privacy-by-design / Amendment 13 field-level data map, retention/export/delete-on-request tooling) was not assessed in depth — flagged generically as a likely gap per the principle's own note that it's "often a gap," not itemized with file:line since no such tooling appears to exist at all (a repo-wide absence, not a specific bug).
- **Unverified claims:** the Next.js proxy-bypass CVE's exact trigger conditions (Turbopack + single-locale) relative to this app's actual `next dev`/`next build` invocation were not confirmed line-by-line against the advisory's technical detail — treat the upgrade recommendation as "do it regardless, it's free" rather than "this exact bypass is proven live here."

## Method
- Auditor: single agent, sequential domain passes (authn-authz, input-files, data-secrets-sessions, errors-defaults, supply-chain) — read-only `Read`/`Grep`/`Bash` only; `dependency-auditor`/`appsec-auditor` subagent types were unavailable in this environment, so the skill's parallel-subagent step was done inline instead (per the run's explicit instructions).
- Baseline: the 16 principles in `secure-code-review/references/`.
- Each 🔴 was spot-checked against the actual code before listing (all four 🔴s above were read in full, in context, not just grepped).
- Step 5 (`/security-review` verify pass): **skipped, not available** in this environment.
