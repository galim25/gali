# Infrastructure Security Findings — BarberBook (אפליקציה לניהול תורים למספרה) — 2026-07-26

> Read-only audit of domain-2 infra config (proxy · ports · TLS/headers · containers · secrets/CI).
> No config was modified. Scope: `/home/runner/אפליקציה לניהול תורים למספרה`. This audits *config*,
> not live behavior — confirm reachability with `runtime-verify`.

## Headline result

**There is essentially no infra-as-code in this repo to audit.** No `Dockerfile*`, no
`docker-compose*.yml`, no `nginx/` directory or `*.conf`, no `.github/workflows/` (no CI at all),
no `.dockerignore`. Confirmed by direct search:

```
find . -iname "*docker*" -o -iname "*compose*" -o -iname "*nginx*"   → no matches (excl. node_modules/.git)
find . -path "*/.github/workflows/*"                                  → no matches
```

Per `CLAUDE.md`, the intended production architecture is `Nginx (aaPanel) → Next.js container →
PostgreSQL` + a worker container, but that layer has **not been built yet** — the project is
local-dev-only (`pnpm dev` / `pnpm worker` via `tsx`, no `next start` in a container, no reverse
proxy). Domain-2 categories 1–3 below (network exposure, TLS/headers, container hardening) have
**no artifacts to check** — this is reported as-is rather than padded with speculative findings.
The one real, audit-able surface is **secrets/env handling**, which was checked and is clean.

## Summary

| Severity | Count |
|---|---|
| 🔴 critical | 0 |
| 🟡 risk | 0 |
| 🔵 nit | 2 |

Top findings:
1. 🔵 `apps/web/next.config.ts: allowedDevOrigins` — real server IP (`161.97.89.252`) committed to
   git history — minor infra-topology disclosure.
2. 🔵 No security-header config exists anywhere in the stack (app or proxy) — expected at this
   stage since there's no proxy yet, but flagged so it isn't forgotten when `Nginx (aaPanel)` is
   actually stood up.

No 🔴 and no 🟡: there is no committed live secret, no published database port, no Dockerfile
running as root, no CI pipeline to leak a token from — because none of that infrastructure exists
in the repo yet.

---

## Network exposure / ports / proxy — N/A (no infra-as-code present)
No `docker-compose*.yml`, no `Dockerfile`, no `nginx/`/`*.conf` in the repo. Nothing publishes a
container port and there is no front-proxy config to route/expose paths — so **§1 (published
ports)** and **§2 (proxy routing)** from `02-network-and-ports.md` have no artifact to check. No
`PORT_MAP.md` exists either, so §3 (port-map hygiene) is also not applicable.

- 🔵 `apps/web/next.config.ts:2` — `allowedDevOrigins: ["161.97.89.252"]` is a real, specific host
  IP committed to git (added in commit `f027001`, "Phase 2: booking flow..."). **Why:**
  `02-network-and-ports.md §4` (app-edge binding is infra-visible) — this confirms the app today is
  reached directly on its own port from that IP, with no proxy in front, which matches the
  documented "local dev only" status but is worth knowing is now in git history. **Fix:** no fix
  needed while this is a dev IP with no sensitive exposure; if this becomes the production host,
  consider whether committing the specific address is desired or should move to an env var.

Neither `apps/web` (`next dev`/`next start`, default host binding) nor `apps/worker`
(`tsx`/`node`, no server socket at all — it's a cron loop, not a listener) declare an explicit
bind address in the repo; there's no compose/proxy layer to say what's actually reachable from the
internet today. That's a live-reachability question, out of scope for a config audit (→
`runtime-verify`).

## TLS / HTTPS / security headers — N/A (no proxy, no header config)
No nginx/Traefik/LB config exists, so §1 (HTTP→HTTPS redirect), §2 (TLS versions/ciphers), §3
(HSTS), and §5 (cert hygiene, `server_tokens`) from `03-tls-and-headers.md` have nothing to
inspect. `apps/web/next.config.ts` sets no `headers()` block either, so no CSP /
`X-Frame-Options` / `X-Content-Type-Options` / `Referrer-Policy` / `Permissions-Policy` are
configured at the app layer.

- 🔵 No security-header configuration anywhere in the stack (proxy or app). **Why:**
  `03-tls-and-headers.md §4` (security headers). **Fix:** not urgent today (dev-only, not
  internet-facing per `CLAUDE.md`), but note for the eventual `Nginx (aaPanel)` config or a Next.js
  `headers()` block: add HSTS, CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options`/
  `frame-ancestors`, `Referrer-Policy` before that layer goes live.

This is the one place where the deliberate `COOKIE_SECURE` env-gate (`.env`, `.env.example`,
`apps/web/src/lib/auth/session.ts:22-25`) is directly relevant: the session cookie's `Secure` flag
is correctly made env-controllable *because* there is no real HTTPS yet — that's a documented,
intentional dev accommodation (`CLAUDE.md`, `COOKIE_SECURE` section), not a bug to flag here. It
sits alongside `httpOnly: true` and `sameSite: "lax"` (`session.ts:31-34`), which are both already
correct regardless of the `Secure` gating.

## Containers / images / compose — N/A (no Dockerfile/compose present)
No `Dockerfile*`, no `docker-compose*.yml` anywhere in the repo (verified, excluding
`node_modules`/`.git`). §1 (non-root `USER`), §2 (base-image pinning), §3 (secrets baked into
image), and §4 (dangerous flags: `privileged`, `network_mode: host`, `docker.sock` mount) from
`04-containers-and-images.md` all have no artifact to check — the app currently runs as bare
Node/pnpm processes (`pnpm dev`, `pnpm worker` via `tsx`), not in a container.

## Secrets in env & CI — PASS (checked, clean)
- `.gitignore` (root) ignores `.env`, `.env.local`, `.env.*.local`; `apps/web/.gitignore` also
  ignores `.env*`. Confirmed neither `.env` (root), `apps/web/.env`, nor `apps/worker/.env` is
  git-tracked (`git ls-files | grep env` → only `.env.example`; `git ls-files --error-unmatch .env`
  → not found).
- `.env.example` (root) contains only placeholder values (`postgresql://user:password@localhost...`,
  `"replace-with-a-long-random-secret"`) — no real credentials. **PASS** against
  `05-secrets-and-ci.md §1`.
- Root `.env` holds `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV`, `FIGMA_ACCESS_TOKEN` — all
  untracked, values not inspected further than confirming they exist (values were redacted before
  viewing, per least-exposure practice during this audit) and the file is correctly gitignored.
- No `docker-compose*.yml` → §2 (secrets in compose `environment:`) not applicable.
- No `.github/workflows/` → §3 (CI pipeline secrets, `pull_request_target`, `GITHUB_TOKEN`
  permissions) not applicable — there is no CI at all in this repo yet.
- No `backups/` directory and nothing under `apps/web/public/` looks like a data dump — §4 not
  applicable.
- No `.npmrc` with a registry token, no SSH keys, no `kubeconfig`, no cloud-credential files found
  in the repo.

---

## Low-confidence / needs human review
None. Every claim above was directly verified against the actual file tree, `git ls-files`, and
`.gitignore` contents — nothing is being surfaced as an unconfirmed guess.

## Coverage gaps & follow-ups
This report audits **config only**, and in this repo's current state there is very little of it:

- **No infra-as-code exists yet** for the target architecture (`Nginx (aaPanel) → Next.js
  container → PostgreSQL` + worker container, per `CLAUDE.md`). Once a `Dockerfile`,
  `docker-compose.yml`, and an actual nginx config are added, **re-run this audit** — it will then
  have real artifacts for network-exposure, TLS/headers, and container-hardening.
- **App-code vulns** (IDOR, injection, authz logic, e.g. inside `requireAdmin()`/`proxy.ts`) →
  `/secure-audit`, out of scope here.
- **Coding-agent config** → `/agent-harden-audit`. Note: `security/AGENT-HARDENING-FINDINGS.md`
  already exists in this repo from a prior run of that skill.
- **Live reachability** — is port 3000 (or whatever `next start` binds) actually reachable from
  the internet right now at `161.97.89.252`, and is the aaPanel host itself firewalled? →
  `runtime-verify`. This audit cannot answer that; it only confirms no config *declares* an
  exposure, because there's no config.
- **Cloud/hosting-provider firewall, aaPanel's own nginx defaults, VPS-level hardening** — genuinely
  infra-ops, out of scope for a repo-config audit. If aaPanel's nginx is later configured outside
  this git repo (common for aaPanel, which manages vhosts through its own UI/state), that config
  won't show up in future re-runs of this audit either unless it's exported into the repo.
- Blind spots: did not inspect `node_modules/`, `.next/` build output, or `pnpm-lock.yaml` contents
  (irrelevant to domain-2 infra config); did not open the full contents of `.env` values beyond
  confirming they're placeholders vs. real-shaped strings and that the file is untracked.

## Method
- Auditor (read-only): performed sequentially by a single general-purpose agent (the skill's
  `infra-auditor` subagent type is not registered in this environment), covering all four
  categories — `network-exposure`, `tls-headers`, `container-hardening`, `secrets-config` — each
  against its `infra-security-review/references/0{2,3,4,5}-*.md` baseline, per `01-infra-overview.md`.
- Searched for `docker-compose*.yml`, `Dockerfile*`, `nginx/`+`*.conf`, `.github/workflows/`,
  `.env*`, `.dockerignore` across the full repo tree (excluding `node_modules`/`.git`) — none of
  the compose/Dockerfile/nginx/CI artifacts exist.
- No port-map file (e.g. `PORT_MAP.md`) present, so no port-map cross-check was possible.
- Verified `.env` tracking status via `git ls-files` and `git ls-files --error-unmatch .env`
  (confirms untracked); read `.gitignore` (root and `apps/web/`) directly.
- Read `apps/web/src/lib/auth/session.ts`, `apps/web/src/proxy.ts`, `apps/web/next.config.ts`,
  `apps/web/package.json`, `apps/worker/package.json`, `packages/db/package.json`,
  `pnpm-workspace.yaml`, root `package.json`, `.env.example` in full.
