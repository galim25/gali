---
name: agent-hardening-review
description: >
  Audit a repository's coding-agent configuration (its .claude/ — CLAUDE.md, settings.json
  permissions, hooks, subagents, sandbox, CI security-review, MCP, secret handling) against the 8
  agent-hardening layers, and produce a read-only Markdown gap report keyed by layer with file:line
  evidence and short risk notes. Use when the user asks to review/harden the agent setup, check
  Claude Code security config, audit hooks/permissions/sandbox, or runs /agent-harden-audit.
  Read-only — reports gaps, never generates the enforcement files.
metadata:
  author: skill-crator session
  version: "1.0"
---

# agent-hardening-review

Audit how well a repo hardens the **coding agent itself** (defense-in-depth around the agent, not the
app's runtime code). Emit one Markdown gap report keyed by the 8 layers. **Read-only**: only the report
is written. The missing hooks/settings/subagents are *described as findings*, never generated — the
user decides whether to add them.

This is the sibling of `secure-code-review`: that one audits what the app's code allows; this one
audits what the agent's configuration allows.

## The baseline (load on demand)
- **`references/06-agent-hardening.md`** — the 8 layers, each with an **AUDIT** line (what to look for),
  the weakest→strongest behavioral/enforcing split, the verified caveats (deny-not-enforced; sandbox is
  Bash-only; subagent inherits parent mode; the Action isn't injection-hardened), and the recommended
  starter layout. **Load this first.**

## What "enforcing" means (drives severity)
Only layers **3 (PreToolUse hook), 4 (sandbox), 5 (tool-restricted subagent), 6 (CI Action)** actually
block. Layers 1 (CLAUDE.md) and 2 (permissions) are behavioral — present = partial credit, never
counts as real enforcement. The two highest-severity gaps:
- **Layer 3 missing** (no `PreToolUse` secret-block hook, or one that uses `exit 1` instead of `exit 2`)
  → 🔴 headline. `exit 1` warns but does **not** block.
- **Layer 8** secrets sitting in agent-visible files with no blocking hook → 🔴.

## Workflow
1. **Resolve scope.** `TARGET = $ARGUMENTS` or repo root.
2. **Load `references/06-agent-hardening.md`.**
3. **Spawn `agent-config-auditor`** (read-only) on TARGET. It inventories `.claude/settings*.json`,
   `.claude/hooks/`, `.claude/agents/`, `CLAUDE.md`, `.github/workflows/`, and MCP config, and returns
   per-layer PRESENT/MISSING + `file:line` + severity. (One auditor is enough; the 8 checks are cheap.)
4. **Confirm the two enforcing details by reading the files yourself:** does the PreToolUse hook really
   `exit 2`? does the reviewer subagent's `tools` list truly exclude Edit/Bash/Write? does the CI Action
   require external-contributor approval? These nuances decide 🔴 vs PASS — verify, don't trust a grep.
5. **Write the report** to `<TARGET>/security/AGENT-HARDENING-FINDINGS.md` from
   `assets/hardening-findings-template.md` with real `file:line`, `date +%F`, and the enforcing-layers
   count. Only this file is written.
6. Tell the user the path, the X/4 enforcing-layers score, and the headline gap.

## Rules
- Read-only. Never create `.claude/` hooks/settings/subagents — describe them as "Recommends:" lines.
- Real `file:line` (or "absent"). No invented paths.
- A layer is only PASS if you actually confirmed its enforcing detail (esp. layers 3, 5, 6).
- Carry the verified caveats into the report so the user doesn't over-trust `permissions.deny` alone.

## Gotchas
- A hook that exists but uses `exit 1` is a **false sense of security** — it warns, never blocks. Flag 🔴.
- `permissions.deny` present without a backing hook → WARN, not PASS (deny enforcement bugs are real).
- A reviewer subagent with `Bash`/`Edit` in its tools is **not** read-only — it can change code. Flag it.
- No `.claude/` at all → every layer MISSING; lead with layers 3 and 8.
