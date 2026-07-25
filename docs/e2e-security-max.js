---
name: israel-privacy-compliance
description: >
  Audit a codebase/system for compliance with Israel's Privacy Protection Law Amendment 13 (Aug 2025),
  the 2017 Information Security Regulations, and the 2025 AI guidance — then WRITE a detailed Hebrew
  compliance document with law citations, gap analysis, and a prioritized recommendations plan. Use
  when asked to check/audit Israeli privacy compliance, תיקון 13, חוק הגנת הפרטיות, data classification,
  security level, MFA/audit-log/encryption requirements, data-subject rights (עיון/תיקון/מחיקה), or AI
  privacy duties, or runs /privacy-audit. Read-only — writes only the compliance report.
metadata:
  author: skill-crator session
  version: "1.0"
---

# israel-privacy-compliance

Audit a system against Israeli privacy law and **write a detailed Hebrew compliance document +
recommendations**. **Read-only**: the only file written is the report. Never modify audited code.

Sibling of `secure-code-review` (same architecture: skill brain · read-only parameterized auditor ·
command · workflow). That skill audits *generic software security*; this one audits *Israeli privacy-law
compliance* and produces a citation-backed compliance document.

## The legal baseline (load on demand)
References live in `references/`. Load `01` first (always), then the file for the category you audit:
- **`references/01-amendment-13-overview.md`** — the 3 regulatory layers + the requirements→category map. **Load first.**
- **`references/02-data-classification.md`** — personal vs specially-sensitive info (Sec 3). [data-classification]
- **`references/03-security-levels.md`** — basic/medium/high determination (2017 regs). [data-classification]
- **`references/04-access-logging.md`** — least-privilege, MFA, audit logs (Reg 8/9/10). [access-logging]
- **`references/05-encryption-network.md`** — TLS, at-rest, network separation (Reg 12/13/14). [encryption-network]
- **`references/06-data-subject-rights.md`** — review/correct/delete, hard-delete (Sec 13/14/15א). [data-subject-rights]
- **`references/07-consent-minimization.md`** — purpose limitation, consent, minimization (Sec 8/11; Reg 2(c)). [consent-minimization]
- **`references/08-ai-processing.md`** — AI notification, scraping, DPA, algorithm correction (2025 guidance). [ai-processing]

## Workflow
1. **Resolve scope.** Target = `$ARGUMENTS` or repo root. Detect the stack (models, routes, auth, loggers,
   AI calls). Load `references/01`.
2. **Classify first.** Load `02`+`03`; map data fields → classification → **security level** (this gates
   which requirements are mandatory — medium is the floor once specially-sensitive data exists).
3. **Spawn `privacy-auditor` subagents in PARALLEL, one per category** (Task tool, single message). Each is
   read-only `[Read, Grep, Glob, Bash]`, loads its category reference, and returns findings only with a
   **law citation** per finding:
   `data-classification` · `consent-minimization` · `access-logging` · `encryption-network` ·
   `data-subject-rights` · `ai-processing` (mark `ai-processing` N/A if no AI).
   Give each auditor: target path, its category, its reference file, the determined security level, and the
   finding line format.
4. **Collect + dedupe**; sort by severity.
5. **Spot-check every 🔴** against the cited lines before listing it. A false 🔴 destroys trust.
5b. **State coverage limits.** Fill the **"פערי כיסוי והמשך"** section: name any data store / table / 3rd-party
   flow you did NOT open, and what is out-of-code (signed DPA, infra network-separation, org process,
   runtime behavior). Put discarded borderline findings in **"ממצאים בוודאות נמוכה"** rather than deleting
   them. The document must not imply it is exhaustive.
6. **Write the report** to `<path>/privacy/PRIVACY-COMPLIANCE-AMENDMENT13.md` using
   `templates/compliance-report-template.md` — real repo-relative `file:line`, real date (`date +%F`),
   the data-classification table, the determined security level + reasoning, per-category gaps each with a
   **law citation**, and the prioritized action plan. This is the only write. Tell the user the path + top-3.

## Rules
- Read-only on audited code. Only the report is written.
- **Every finding must carry a law anchor** (סעיף/תקנה) from the references — that's what makes it a
  compliance document, not a generic review.
- Repo-relative paths; real line numbers only; unsure → omit.
- Out-of-code items (infra network separation, signed DPA, org process) → reported as **context**, not code defects.
- Carry the mandatory legal disclaimer (technical analysis, not legal advice) into the report.

## Gotchas
- **Hard-delete vs soft-delete tension:** `secure-code-review` may recommend soft-delete; here Sec 14 demands
  *certain deletion/anonymization* of personal data on a data-subject request. Flag the tension (see `06`).
- **Specially-sensitive surprises:** location/GPS and salary/financial are specially-sensitive under Amend 13
  → push the security level to medium and make MFA+audit-logs+encryption mandatory.
- **AI:** PII sent to an external LLM without a no-training/Enterprise tier + DPA is a 🔴 (see `08`).
- Highest financial exposure: data-subject rights (Sec 15א statutory damages) — prioritize `06`.
