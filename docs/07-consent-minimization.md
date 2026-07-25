# secure-code-review

בודק את **קוד האפליקציה** מול 16 עקרונות אבטחת תוכנה ומפיק דוח פערים Markdown (read-only).
לתמונה הכוללת + ההבדל בין skill ל-workflow: ראו `../README.md`.

## רכיבים
```text
SKILL.md                              ← המוח: מתודולוגיה + מתי לטעון כל reference
references/
  01-cia-and-domains.md               CIA + 3 הדומיינים (העדשה)
  02-software-principles.md           אינדקס — 16 עקרונות, לכל אחד audit check + מצביע ל-deep-dive
  03-error-handling.md                fail-closed (עיקרון 10)
  04-secure-defaults.md               סגור-כברירת-מחדל (עיקרון 11)
  05-operational-permissions.md       דומיין 3 — תהליך, לא קוד (קונטקסט בלבד)
  06-tokens-and-sessions.md           8 סוגי טוקנים · transport/storage · rotation/revocation
  07-authorization-and-roles.md       RBAC/ABAC/ownership · IDOR · privilege escalation
  08-input-validation-and-injection.md  allowlist/mass-assignment · SQLi/XSS/cmd/SSRF · uploads
  09-secrets-management.md            אחסון סודות · hashing · דליפת frontend · rotation
  10-logging-and-audit.md             audit trail · מה לא ללוג · masking · retention
  11-secure-communication.md          TLS · webhook signature · replay · rate limit · CORS
assets/findings-template.md           פורמט הדוח
~/.claude/agents/appsec-auditor.md    הסוכן הפרמטרי (read-only) שמבצע את הביקורת
~/.claude/commands/secure-audit.md    הטריגר /secure-audit
~/.claude/workflows/secure-audit-max.js  המסלול הדטרמיניסטי (11 סוכנים + אימות אדוורסרי)
```

## איך זה עובד
1. זיהוי stack + scope.  2. טעינת `02` (audit checks).  3. הפעלת `appsec-auditor` במקביל לפי דומיין —
כל סוכן טוען את ה-deep-dive שלו ומחזיר ממצאים מובְנים.  4. dedupe + מיון.  5. `/security-review`
כ-verify.  6. spot-check לכל 🔴.  7. כתיבת `SOFTWARE-SECURITY-FINDINGS.md`.

## הפרדת דומיין→deep-dive (מה כל auditor טוען)
```text
authn-authz           → 07, 06       (IDOR / ownership / tokens)
input-files           → 08           (mass-assignment / injection / uploads)
data-secrets-sessions → 06,09,10,11  (tokens / secrets / logging / communication)
errors-defaults       → 03, 04       (fail-closed / secure-defaults)
```

## הפעלה
```bash
/secure-audit /path                                    # רזה: 4 סוכנים לפי דומיין
Workflow({ name:"secure-audit-max", args:"/path" })    # מקסימום: 11 סוכנים לפי עיקרון
```
הממצא הכי שכיח ובעל-ערך: **IDOR** (עיקרון 2). שני: **mass-assignment** (עיקרון 3).
