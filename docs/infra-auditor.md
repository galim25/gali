# agent-hardening-review

בודק את התצורה של **סוכן הקוד עצמו** (`.claude/` של ה-repo) מול 8 שכבות הקשחה, ומפיק דוח פערים
Markdown (read-only). זה האח של `secure-code-review`: זה בודק מה *תצורת הסוכן* מאפשרת, לא מה קוד
האפליקציה מאפשר. לתמונה הכוללת + ההבדל בין skill ל-workflow: ראו `../README.md`.

## רכיבים
```text
SKILL.md                                ← המתודולוגיה: מעבר על 8 השכבות
references/06-agent-hardening.md         ← 8 השכבות, כל אחת עם שורת AUDIT + caveats מאומתים
assets/hardening-findings-template.md    ← פורמט הדוח (טבלת שכבות + מצב + סיכון)
~/.claude/agents/agent-config-auditor.md ← הסוכן (read-only) שסורק את .claude/
~/.claude/commands/agent-harden-audit.md ← הטריגר /agent-harden-audit
```

## 8 השכבות (חלש→חזק)
```text
התנהגותי (מנחה, לא אוכף):  1 CLAUDE.md   2 permissions.deny
אוכף (חוסם בפועל):         3 PreToolUse hook (exit 2)   4 sandbox
                            5 reviewer subagent (read-only)   6 CI security-review
גבולות אמון:                7 MCP   8 secrets handling
```
רק שכבות **3,4,5,6 אוכפות**. הציון המרכזי בדוח: כמה מהן קיימות (X/4).
שני ה-🔴 הקלאסיים: אין hook חוסם-סודות עם `exit 2` (שכבה 3), או סודות חשופים לסוכן (שכבה 8).

## ניואנסים שהסוכן מאמת (לא סומך על grep)
- hook שקיים אבל עושה `exit 1` = **מזהיר ולא חוסם** → 🔴 (תחושת ביטחון כוזבת).
- `permissions.deny` בלי hook מגבה = WARN (דווחו באגי אכיפה ל-deny).
- reviewer subagent עם `Bash`/`Edit` ברשימת הכלים = **לא** read-only, יכול לשנות קוד.

## הפעלה
```bash
/agent-harden-audit /path
```
פלט: `<path>/security/AGENT-HARDENING-FINDINGS.md`. בקרות חסרות מדווחות כ-finding — לא נוצרות אוטומטית.

> אין כרגע מסלול Workflow כאן: 8 הבדיקות זולות וסוכן יחיד מספיק. אפשר להוסיף `agent-harden-max`
> (שכבה-לכל-סוכן) אם רוצים, אבל הערך נמוך.
