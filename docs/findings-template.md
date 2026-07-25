# server-hardening-review

ביקורת אבטחה **read-only של שרת חי** דרך SSH — מודאליות *server-state* (משלימה את `infra-security-review`
שבודקת קונפיג ב-repo). מתרגמת מודל אבטחת-שרת מקצה-לקצה ל-8 קטגוריות בנות-בדיקה, מריצה רק פקודות קריאה,
וכותבת דוח פערים בעברית מעוגן ל**פקודה + פלט**.

## מה זה בודק (8 קטגוריות)
`access` SSH/משתמשים · `network` חומת אש ופורטים · `edge` nginx/HTTPS/Cloudflare · `secrets` .env/git/הרשאות ·
`updates` עדכונים · `backups` גיבויים · `observability` לוגים+ניטור · `incident` מוכנות לאירוע.

## הפעלה
```bash
# מסלול רזה (ברירת מחדל)
/server-audit user@host [output-dir]

# מסלול מקסימום, דטרמיניסטי (יקר, opt-in): אימות אדוורסרי + completeness-critic
Workflow({ name: "server-audit-max", args: "user@host" })
```
הדוח נכתב ל-`<output-dir>/security/SERVER-HARDENING-FINDINGS.md` (ברירת מחדל cwd). **השרת לעולם לא משתנה.**

## בטיחות (read-only)
מריצה רק פקודות לא-משנות מתוך allowlist (`references/01-overview.md`): status/show/list/cat/ls/grep/ss/
`sshd -T`/`ufw status`/`apt list --upgradable` וכו'. `sudo` רק לפעלי קריאה. **אסור:** ufw enable, apt
upgrade, systemctl restart, chmod/chown/rm, docker run, הפניות פלט, התקנות. תיקונים = המלצות בדוח בלבד.
לפני חיבור לשרת אמיתי — מאשרים עם המשתמש.

## רכיבים
- `SKILL.md` + `references/01–09` + `assets/server-findings-template.md`
- subagent: `~/.claude/agents/server-hardening-auditor.md`
- command: `~/.claude/commands/server-audit.md`
- workflow: `~/.claude/workflows/server-audit-max.js`

מקור הידע: מצגת "שרתים ואבטחת שרתים" (course/website meeting12 + meeting6).
