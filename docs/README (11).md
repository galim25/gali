# infra-security-review

Read-only audit of **domain 2 — where the code runs**: reverse proxy/nginx, published Docker ports,
TLS/HTTPS & security headers, container/image hardening, secrets in env & CI. Writes a Markdown gap
report anchored to file+directive. Third sibling of `secure-code-review` (domain 1, code) and
`agent-hardening-review` (the coding agent). For the big picture + skill-vs-workflow: `../README.md`.

```text
infra-security-review/
├── SKILL.md
├── references/
│   ├── 01-infra-overview.md        domain-2 scope + category map + two-layers + optional port-map check
│   ├── 02-network-and-ports.md     published ports · proxy routing · internal-service exposure
│   ├── 03-tls-and-headers.md       HTTPS enforce · HSTS · TLS versions · security headers
│   ├── 04-containers-and-images.md non-root · pinned images · no baked secrets · dangerous flags
│   └── 05-secrets-and-ci.md        committed env/secrets · compose env · CI pipeline · backups
└── assets/infra-findings-template.md
~/.claude/agents/infra-auditor.md        read-only, parameterized by category
~/.claude/commands/infra-audit.md        /infra-audit [path]
~/.claude/workflows/infra-audit-max.js   per-category fan-out + verify + critic + write
```

## Run
```bash
/infra-audit <path-to-repo>                              # lean: 4 auditors by category
Workflow({ name:"infra-audit-max", args:"<path-to-repo>" })  # max: + adversarial verify + critic
```
Output: `<path>/security/INFRA-SECURITY-FINDINGS.md`.

## Key points
- **Two layers:** compose `ports:` (host publishes) AND front nginx (internet reaches). Safe at one ≠ safe.
- Top finding shape: `ports: "5432:5432"` → DB on 0.0.0.0 (public). `docker.sock` mount / `privileged` = host takeover.
- Committed secret → recommend **rotate**, not just remove.
- Config-level only — "published" ≠ "reachable right now". Confirm live reachability with **runtime-verify**.
- Cross-checks published ports against the repo's port-map file (e.g. `PORT_MAP.md`) if it keeps one.
