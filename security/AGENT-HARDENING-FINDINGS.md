# Agent Hardening Findings — אפליקציה לניהול תורים למספרה (BarberBook) — 2026-07-26

> Read-only audit of this repo's coding-agent configuration (`.claude/`) against the 8 hardening
> layers. No config files were created or modified — gaps are reported, not auto-fixed.
> Scope: `/home/runner/אפליקציה לניהול תורים למספרה`.

## Summary

| | Layer | Status | Severity if missing |
|---|---|---|---|
| 1 | CLAUDE.md security rules | MISSING | 🟡 |
| 2 | permissions.deny on secrets | MISSING | 🟡 |
| 3 | PreToolUse block-secrets hook (`exit 2`) | MISSING | 🔴 |
| 4 | Sandbox / dev-container | MISSING | 🟡 |
| 5 | Read-only reviewer subagent | MISSING | 🟡 |
| 6 | CI security-review Action | MISSING | 🟡 |
| 7 | MCP trust segregation | N-A (no MCP config found) | 🟡 |
| 8 | Secrets out of agent-visible files + CI secret-scan | MISSING (partial: gitignored, but agent-visible, no blocking hook, no CI scan) | 🔴 |

**Enforcing layers present:** 0 / 4 (layers 3, 4, 5, 6 are the ones that actually block).

Headline: no `PreToolUse` hook exists anywhere in this repo, so nothing stops the agent from reading
`.env` (which sits, unencrypted, at the repo root and in `apps/worker/`) — Layer 3 and Layer 8 are both
wide open, and there is no CI secret-scan as a last net either.

---

## Layer 1 — CLAUDE.md security rules  *(behavioral)*
**Status:** MISSING (no dedicated security section).
`CLAUDE.md` (35KB, `/home/runner/אפליקציה לניהול תורים למספרה/CLAUDE.md`) is thorough on product/UX/architecture
conventions but has no section instructing the agent on secret handling, forbidden paths, or auth
invariants. The only brush with the topic is incidental: `CLAUDE.md:73` documents `COOKIE_SECURE` as an
app-level env flag, and `CLAUDE.md:85` notes `FIGMA_ACCESS_TOKEN` is stored in `.env` "not in git" — both
are informational asides about the app, not agent-facing rules (e.g. no "don't read/print `.env` or
`secrets/`" instruction anywhere).
Recommends: add a security section — parameterized queries only, never read/print `.env`/`secrets/**`,
every id-scoped mutation checks ownership, default closed (see reference file 6, Layer 1).

## Layer 2 — permissions.deny on secrets  *(behavioral, enforcement-bug caveat)*
**Status:** MISSING — no `.claude/settings.json` exists at all (`find .claude -type f` returns only
`.claude/skills/barberbook-design/SKILL.md`).
Even if added, note the known deny-not-always-enforced caveat (issues #6699, #6631, #8961, #24846) — a
`permissions.deny` must be backed by the Layer-3 hook, not relied on alone.
Recommends: `.claude/settings.json` with `permissions.deny` covering `Read(./.env)`, `Read(./.env.*)`,
`Read(./apps/worker/.env)`, `Read(~/.aws/**)`, `Read(~/.ssh/**)`.

## Layer 3 — PreToolUse block-secrets hook 🔒  *(enforcing — the one to rely on)*
**Status:** MISSING. No `.claude/hooks/` directory exists, and no `hooks` key is configured anywhere
(there is no `settings.json` to hold one). Confirmed via `find "$TARGET" -type d -iname hooks` (only hit
was `.git/hooks`, which is unrelated git-native tooling, not a Claude Code hook).
🔴 headline. Recommends: `PreToolUse` hook that `exit 2`s on paths matching `\.env|secrets/|\.aws/|\.ssh/`
(reference file 6, Layer 3). This is the single highest-value gap to close — two real `.env` files exist
in this repo (root and `apps/worker/`) and nothing currently blocks the agent from reading either.

## Layer 4 — Sandbox / dev-container  *(enforcing, Bash-only)*
**Status:** MISSING. No `sandbox` setting (no `settings.json` at all), no `.devcontainer/`, no
`Dockerfile` found anywhere outside `node_modules/`. Agent work in this repo runs unsandboxed at the OS
level; remember sandbox only covers Bash and its children even where enabled — Read/Edit are unaffected
regardless.

## Layer 5 — Read-only reviewer subagent  *(enforcing via narrow tools)*
**Status:** MISSING. No `.claude/agents/` directory exists (only `.claude/skills/barberbook-design/`,
which is a UI-convention skill, not a security-reviewer subagent, and is not tool-restricted).

## Layer 6 — CI security-review Action  *(enforcing-ish)*
**Status:** MISSING. No `.github/` directory exists in the repo at all (`find "$TARGET/.github"` returns
nothing), so no CI pipeline runs on PRs — meaning no `claude-code-security-review` Action, and no CI of
any kind (also no automated tests wired to CI, though that's outside this audit's scope).
Recommends: add `.github/workflows/security-review.yml` running `anthropics/claude-code-security-review`
on every PR with "Require approval for all external contributors" enabled.

## Layer 7 — MCP trust boundaries
**Status:** N-A. No `.mcp.json`/MCP server configuration found anywhere in the repo (searched for
`*.mcp.json` and `mcp.json`, no hits outside `node_modules`). Nothing to segregate at this time — revisit
if MCP servers are added later.

## Layer 8 — Secrets handling
**Status:** MISSING (real risk, mixed picture). Two `.env` files exist: repo root
(`/home/runner/אפליקציה לניהול תורים למספרה/.env`, containing `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV`,
`FIGMA_ACCESS_TOKEN`) and `apps/worker/.env` (per `CLAUDE.md:166`, holds `DATABASE_URL`). Both are listed
in `.gitignore:6-8` (`.env`, `.env.local`, `.env.*.local`) and confirmed **not tracked** by git
(`git ls-files | grep '^\.env$'` → no match) — so they will not leak via commits/PRs.
However, they remain fully **agent-visible**: no `permissions.deny` (Layer 2 absent) and no `PreToolUse`
hook (Layer 3 absent) stop the agent from `Read`-ing or echoing their contents into the transcript, and
there is no CI secret-scan (no CI at all, Layer 6 absent) as a last net. This is the exact "reported"
scenario from the baseline: git-ignoring is necessary but not sufficient — the agent doesn't respect
`.gitignore` on its own.
🔴 — `SESSION_SECRET` and `DATABASE_URL` sit in files the agent can read on request, with zero enforcing
layers in front of them.
Recommends: add the Layer-3 hook first (blocks reads immediately regardless of settings), then
`permissions.deny`, then a CI secret-scan (trufflehog/git-secrets) once Layer 6 CI exists.

---

## Method
- Auditor (read-only): performed directly (the `agent-config-auditor` subagent type is not registered
  in this environment; per the skill's own note, one auditor pass is sufficient for these 8 checks).
- Baseline: the 8 layers in `agent-hardening-review/references/06-agent-hardening.md`.
- Verified directly: full recursive listing of `.claude/` (single file: `skills/barberbook-design/SKILL.md`),
  absence of `.claude/settings*.json`, `.claude/hooks/`, `.claude/agents/`, `.github/`, `.devcontainer/`,
  `.mcp.json`; `.env` git-tracking status via `git ls-files`; `.gitignore` contents; `CLAUDE.md` grepped
  for security/secret/permission/hook/sandbox terms (no dedicated section found).
- Reported gaps are recommendations only — no `.claude/` file was written.
