---
name: e2e-security
description: >
  End-to-end behavioral security testing for ANY web app — drive the real running target through generic
  attack/abuse vuln-classes via the browser-mcp (headless Chrome that captures all network/console/storage
  to SQLite), then verify each scenario from the capture DB and, configurably, the app's own database (what
  actually changed). Target-agnostic: a small target profile (provided or auto-discovered) supplies
  baseUrl/auth/accounts/dbUrl; the playbooks are generic (IDOR, broken authz, unauth exposure, token
  leakage, sensitive-data-in-response, mass-assignment, rate-limit, error leaks, data-subject deletion).
  Use when asked to e2e/behavioral/black-box security-test, pentest a running app, confirm a vuln by
  driving the UI, or runs /e2e-security. SIDE-EFFECTING — opt-in, local/staging/seed only, never production.
metadata:
  author: skill-crator session
  version: "1.1"
---

# e2e-security  (generic / target-agnostic)

Drive a **running** app like an attacker, capture everything, and prove the outcome from real evidence.
This is the **behavioral** modality of the audit suite. It is **not bound to any specific system** — it
runs against any target described by a **target profile** (provided or auto-discovered). Side-effecting and
opt-in: it sends real requests and may write seed data. **Local/staging/seed only, never production.**

## How it differs from the other tools
```text
/secure-audit /infra-audit   → static: read code/config, suspect issues
/runtime-confirm             → probe: a few curls confirm a single static finding
e2e-security                 → behavioral: log in per role, drive real flows, capture to SQLite,
                               assert from capture + (optional) the app DB → vulnerable-confirmed | safe
```

## Baseline (load on demand)
- **`references/target-profile.md`** — the profile schema + how to obtain it (user-supplied or
  auto-discover via OpenAPI/crawl/snapshot/DB introspection) + abstract roles. **Load first.**
- **`references/bring-up.md`** — start browser-mcp + register the MCP + start the target (per profile) +
  the preflight. (browser-mcp setup is the same for any target.)
- **`references/playbooks.md`** — the 9 generic vuln-class scenarios, parameterized by the profile, using
  **discovered** endpoints (never hard-coded paths).
- **`references/assertions.md`** — verdict from the capture (network_/console_/storage tools) and, in
  dual-db mode, from the app DB (discover schema → read-only SELECTs against generic column roles).
- `references/examples/example-app.profile.json` — a fictional example profile to copy and fill in.

## Prerequisite (hard)
browser-mcp **running and registered** so `mcp__browser-mcp__*` tools exist (see bring-up). If absent →
stop and give bring-up steps. In a `*-max` workflow the agent reaches these MCP tools via ToolSearch.

## Workflow
1. **Build the profile** (`target-profile.md`): take the user-supplied profile; for any missing field,
   **discover** it (OpenAPI → crawl → snapshot → DB introspection). Minimum: `baseUrl` + a way to auth +
   ≥2 same-role accounts (for IDOR). Map the app's real roles onto `admin`/`userA`/`userB`.
2. **Preflight** (`bring-up.md`): baseUrl non-production + reachable; `mcp__browser-mcp__*` present; dual-db
   `dbUrl` connects. Fail closed.
3. **Per role, in its own browser-mcp session** (`session_new`): authenticate (UI `fill_form`+`click`, or
   `cookies_set`/bearer per the profile) using the profile's accounts.
4. **Run the playbook vuln-classes** for that role: discover the concrete endpoint/resource, drive via
   browser-mcp; the MCP captures all network/console/storage to SQLite.
5. **Assert each scenario** (`assertions.md`) in the selected `assert` mode → verdict
   (vulnerable-confirmed / safe / inconclusive) + evidence (http + capture snippet, + DB row in dual-db).
6. **State coverage limits** — fill "Coverage gaps & follow-ups": roles/flows/scenarios not exercised,
   capture-only write-effect scenarios left inconclusive, vuln-classes not yet scripted. Feeds `/security-ledger`.
7. **Write** `<target>/security/E2E-SECURITY-FINDINGS.md` from `assets/e2e-findings-template.md`.
8. **Clean up** mutated throwaway rows via `profile.reset`.

## Rules
- **Never production.** Refuse prod-like hosts. Opt-in only.
- Seed/throwaway data only; app-DB queries **read-only** (SELECT); the only writes are the scenarios' own
  driven actions, on throwaway rows, reset afterward.
- Bounded volume (rate-limit ~10–15 requests). No fuzzing.
- Every `vulnerable-confirmed` carries ≥1 positive evidence line; no evidence → `inconclusive`, never a pass.
- `assert` is a parameter: `capture-only` (browser saw it) or `dual-db` (+ app state). Write-effect
  scenarios need dual-db for a definitive verdict.
- **No app-specific assumptions** — paths, roles, table/column names are from the profile or discovered.

## Gotchas
- The capture lives **inside the browser-mcp container** — read it via `network_list/get/search` +
  `console_*`, not by opening the .db file.
- For token-leak tests, set browser-mcp redaction to not hide auth headers on the (local, trusted) target.
- Discover before asserting: OpenAPI/crawl for endpoints; `\dt`/`\d <table>` for dual-db schema. Hard-coding
  paths or column names defeats the point of a generic tool.
- Confirmed scenarios can be mapped back to a static finding (if a `/secure-audit` report exists) to turn
  "suspected" into "proven" — note the mapping when known, don't assume one exists.
