---
name: infra-security-review
description: >
  Audit a repo's infrastructure config (domain 2 — reverse proxy/nginx, published Docker ports,
  TLS/HTTPS & security headers, container/image hardening, secrets in env & CI) and produce a read-only
  Markdown gap report anchored to file+directive. Use when asked to review infra/deployment security,
  check exposed ports, nginx/proxy config, Docker/compose hardening, TLS/security headers, committed
  secrets or CI pipeline risk, or runs /infra-audit. Read-only — writes only the report. Sibling of
  secure-code-review (code) and agent-hardening-review (the agent).
metadata:
  author: skill-crator session
  version: "1.0"
---

# infra-security-review

Audit **domain 2 — where the code runs** (proxy, ports, TLS, containers, secrets/CI). Read-only: the
only file written is the report. Complements `secure-code-review` (domain 1) — that finds an unauth
`/metrics` route *in code*; this finds it *exposed at the nginx/compose layer*, a second angle on the
same risk.

## Baseline (load on demand)
- **`references/01-infra-overview.md`** — domain-2 scope, the category map, the two layers (container
  ports vs front proxy), and the optional port-map cross-check. **Load first.**
- **`references/02-network-and-ports.md`** — published ports, proxy routing, internal-service exposure. [network-exposure]
- **`references/03-tls-and-headers.md`** — HTTPS enforce, HSTS, TLS versions, security headers. [tls-headers]
- **`references/04-containers-and-images.md`** — non-root, pinned images, no baked secrets, dangerous flags. [container-hardening]
- **`references/05-secrets-and-ci.md`** — committed env/secrets, compose env, CI pipeline, backups. [secrets-config]

## Workflow
1. **Resolve scope.** Target = `$ARGUMENTS` or repo root. Locate `docker-compose*.yml`, `Dockerfile*`,
   `nginx/`+`*.conf`, `.github/workflows/`, `.env*`, `.dockerignore`. Load `references/01`.
2. **Spawn `infra-auditor` subagents in PARALLEL, one per category** (Task tool, single message): read-only
   `[Read, Grep, Glob, Bash]`, each loads its reference and returns findings anchored to **file+directive**:
   `network-exposure` · `tls-headers` · `container-hardening` · `secrets-config`.
3. **Cross-check published ports** against the repo's port-map file (e.g. `PORT_MAP.md`) if present —
   undocumented/public ports are findings; otherwise infer intended exposure from compose/proxy config.
4. **Collect + dedupe**; sort by severity. **Spot-check every 🔴** against the actual config lines.
5. **State coverage limits.** Fill **"Coverage gaps & follow-ups"**: app-code → `/secure-audit`; agent
   config → `/agent-harden-audit`; **live reachability → `runtime-verify`**; cloud/firewall → out of scope.
   Put unconfirmed findings in **"Low-confidence"**, don't drop them.
6. **Write** `<path>/security/INFRA-SECURITY-FINDINGS.md` using `assets/infra-findings-template.md` —
   real `file: directive`, real date, real counts. Only this file is written. Tell the user path + top-3.

## Rules
- Read-only on config. Anchor every finding to the exact **file + directive** (this is config, not law).
- Severity: 🔴 internet-reachable exposure / committed live secret · 🟡 missing hardening · 🔵 minor.
- Two layers matter: compose `ports:` (host publishes) AND front nginx (internet reaches) — a service
  safe at one can be exposed at the other. Check both.
- Don't claim a port is reachable — config says it's *published*; runtime says it's *reachable*
  (`runtime-verify`).

## Gotchas
- `ports: "5432:5432"` binds 0.0.0.0 → public; `expose:` or `127.0.0.1:` keeps it internal. The single
  most common real finding.
- `docker.sock` mounted into a container = host takeover; `privileged: true` / `network_mode: host` ≈ same.
- A committed secret is compromised even after deletion → recommend **rotate**, not just remove.
- This layer often re-confirms a code-audit finding from a second angle: e.g. an unauth `/metrics` or a
  publicly-served file path shows up here at the proxy/compose layer — reinforcing the domain-1 finding.
