---
name: secure-code-review
description: >
  Audit a codebase against 16 software-security principles (authentication, authorization/IDOR,
  input validation/mass-assignment, data protection, sessions & tokens, safe file handling, secure
  communication, logging, fail-closed error handling, secure defaults) and produce a read-only
  Markdown gap report with clickable file:line links and a short problem + fix per finding. Use when
  the user asks to security-review / audit code, find auth or IDOR bugs, check input validation,
  hunt mass-assignment, review error handling, or runs /secure-audit. Read-only — writes only the
  report. Pairs with the built-in /security-review as a final verify step.
metadata:
  author: skill-crator session
  version: "1.0"
---

# secure-code-review

Audit application code against a fixed baseline of software-security principles, then emit one
Markdown gap report. **Read-only**: the *only* file written is the report. Never edit audited code.

This skill supplies what the built-in `/security-review` lacks: a named-principle **baseline** and
**whole-architecture** gap analysis (not just a diff scan). `/security-review` runs at the end as a
verify pass.

## The baseline (load on demand)

The principles live in `references/`. Load the file you need, when you need it — don't inline all of it:
- **`references/02-software-principles.md`** — the core. The 11 code-auditable principles, each with a
  concrete AUDIT CHECK (what to grep/read for). **Load this first, always.**
- **`references/01-cia-and-domains.md`** — CIA lens + the 3 domains. Load when scoping or explaining.
- **`references/03-error-handling.md`** — load when auditing principle 10 (fail-closed, swallowed
  errors, half-updated state, blind retry, leaked stack traces).
- **`references/04-secure-defaults.md`** — load when auditing principle 11 (default-open roles/routes/
  fields, debug-in-prod, hard-delete, CORS).
- **`references/05-operational-permissions.md`** — domain 3. Mostly **process, not code**; load only to
  phrase out-of-code context notes. Do not file these as code defects.

Deep-dive references (load when a domain needs depth beyond the audit check in `02`):
- **`references/06-tokens-and-sessions.md`** — token types, transport/storage, rotation/revocation
  (principle 6). Load for the `data-secrets-sessions` domain.
- **`references/07-authorization-and-roles.md`** — RBAC/ABAC/ownership, IDOR variants, privilege
  escalation (principle 2). Load for the `authn-authz` domain — the highest-value findings live here.
- **`references/08-input-validation-and-injection.md`** — allowlist, mass-assignment, SQL/NoSQL/command/
  XSS/SSRF/traversal/deserialization, file uploads (principles 3, 7). Load for the `input-files` domain.
- **`references/09-secrets-management.md`** — secret storage, credential hashing, frontend exposure,
  rotation, webhook signing secrets (principle 4). Load for the `data-secrets-sessions` domain.
- **`references/10-logging-and-audit.md`** — audit-trail events, never-log list, masking, retention
  (principle 9). Load for the `data-secrets-sessions` domain.
- **`references/11-secure-communication.md`** — TLS, webhook signatures, replay, rate limit, CORS
  (principle 8). Load for the `data-secrets-sessions` or `input-files` domain as relevant.
- **`references/12-supply-chain.md`** — dependency CVE scan, lockfile, version floats, install hooks,
  typosquat (principle 12). Load for the `supply-chain` domain — audited by `dependency-auditor`.

## Workflow

1. **Resolve scope.** Target path = `$ARGUMENTS` or repo root. Detect stack (grep for framework: NestJS/
   Express/Flask/Django/Rails/etc.) so auditors know where routes, models, upload handlers live.
2. **Load `references/02-software-principles.md`** for the audit checks.
3. **Spawn `appsec-auditor` subagents in PARALLEL, one per domain** (Task tool, single message, multiple
   calls). Each is read-only `[Read, Grep, Glob, Bash]` and returns structured findings only:
   - `authn-authz` — principles 1, 2 (focus: IDOR / missing server-side ownership on `/x/:id` mutations)
   - `input-files` — principles 3, 7 (focus: mass-assignment / whole-body save; upload allowlist)
   - `data-secrets-sessions` — principles 4, 5, 6, 9 (focus: secrets/PII in logs or URLs; masking; audit log)
   - `errors-defaults` — principles 10, 11 (focus: fail-open auth, swallowed catches, default-open, debug-in-prod)
   - `supply-chain` — principle 12 (**use the `dependency-auditor` agent**, not appsec-auditor): runs
     `npm audit`/`pip-audit`/`osv-scanner` read-only + reads lockfiles/manifests for CVEs, floats, install hooks
   Give each auditor: the target path, its principles' AUDIT CHECK text, **which deep-dive file(s) to
   load for its domain** (07/06 · 08 · 06/09/10/11 · 03/04 · 12 respectively), and the finding line format.
4. **Collect + dedupe** findings (same file:line+issue = one). Sort by severity.
5. **Verify pass:** invoke the built-in **`/security-review`** on the target (via the Skill tool) and
   **merge** anything it catches that the auditors missed, tagged `[security-review]`. If it can't run
   (no git diff / not applicable), note "skipped" in the report — don't fail.
6. **Spot-check every 🔴** by reading the cited lines before listing it. Drop anything you can't confirm.
   A false 🔴 destroys trust in the whole report.
7. **State coverage limits — don't over-claim.** Fill the report's **"Coverage gaps & follow-ups"**
   section: list what you did NOT check (a dir/subsystem never opened, a cross-file flow not traced,
   frontend, business logic) and what is **out of scope** here — dependencies/supply-chain
   (→ the `supply-chain` domain / `12-supply-chain.md`), infrastructure (→ `infra-security-review`),
   runtime behavior (→ `runtime-verify`). If you discarded a borderline finding, put it in
   **"Low-confidence / needs human review"** rather than deleting it. A report that names its blind
   spots is trustworthy; one that implies it found everything is not.
8. **Write the report** to `<path>/security/SOFTWARE-SECURITY-FINDINGS.md` using
   `assets/findings-template.md`. Fill real repo-relative `file:line`, real date, real counts. This is
   the only write. Tell the user the path + the top-3.

## Rules

- Read-only on audited code. If a fix is obvious, describe it in the **Fix:** field — do not apply it.
- Repo-relative paths so `file:line` is clickable.
- Don't invent line numbers. Unsure → omit the finding.
- A principle section appears only if it has findings or you mark it PASS after actually checking.
- Operational-permission (domain 3) items go in the "Out-of-code" section as context, never as 🔴 code bugs.
- Date is read at run time (`date +%F`), never hard-coded.

## Gotchas

- The highest-value, most-missed finding is **IDOR** (principle 2): a resource fetched by id with no
  ownership scope. Prioritize hunting it.
- Second: **mass-assignment** (principle 3) — whole-body save with no field allowlist; check for an
  `is_admin`-style escalation field.
- `/security-review` is diff-scoped and principle-blind — it complements, it does not replace, the
  auditors. Always run the auditors even if `/security-review` is available.
