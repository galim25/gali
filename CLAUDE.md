# BarberBook — מערכת ניהול תורים למספרה

אפליקציה לניהול תורים עבור ספר עצמאי. לקוחות קובעים, משנים ומבקשים לבטל תורים בעצמם לפי הזמינות שהספר מגדיר; הספר מנהל את היומן במלואו מתוך מסך ניהול.

מסמכי המקור המלאים נמצאים ב-`docs/`:
- `# PRD BarberBook.txt` — דרישות מוצר, User Stories, Functional Requirements
- `# ERD BarberBook.txt` — מודל נתונים (Mermaid ERD + טבלאות שדות)
- `# STACK BarberBook.txt` — ארכיטקטורת מערכת

קרא את הקבצים המלאים לפני שינויים משמעותיים — הסיכום כאן חלקי בכוונה.

## Stack וארכיטקטורה

```
Browser / Mobile Web
   → Nginx (aaPanel)
   → Next.js App Container (מסכי לקוח, מסכי ניהול, API/Server Actions, Auth)
   → PostgreSQL
   ↑
Worker Container — שולח תזכורות, החלטות ביטול, SMS על שינוי תור
```

## משתמשים

- **לקוח** — נרשם/מתחבר עם שם מלא + טלפון + סיסמה. קובע תורים לעצמו ולילדיו, משנה תור, שולח בקשת ביטול (טעונה אישור הספר), מקבל תזכורות והודעות.
- **מנהל מערכת (הספר)** — פותח ימי עבודה (תאריך, שעת התחלה/סיום, הפסקות), רואה ומנהל את כל היומן, קובע תורים ידנית, מוחק תורים/ימים שלמים (עם אזהרת אישור), מפרסם הודעות כלליות, מאשר/דוחה בקשות ביטול.

## ישויות עיקריות (ERD)

`User` (role: customer/administrator) · `PasswordResetCode` · `Service` (duration_minutes, `is_child_service`) · `WorkDay` · `WorkBreak` · `BlockedTime` · `Appointment` (status: scheduled/cancelled, attendee_type: self/child/other) · `CancellationRequest` (status: pending/approved/rejected) · `Notification` · `Announcement` · `BlockedPhoneNumber`

הערות מודל חשובות:
- `Appointment.booked_by_user_id` אופציונלי — תור ידני שהספר קובע יכול להתקיים בלי חשבון משתמש מקושר.
- אין ישות `Child` נפרדת — פרטי הילד נשמרים ברמת התור (`attendee_name`, `attendee_type`).
- **שתי פעולות נפרדות ושונות על תור/יום, אל תתבלבלו ביניהן:** "ביטול תור בודד" (`cancelAppointmentAction`) הוא soft — רק מחליף `status` ל-`cancelled`, הרשומה נשארת. "מחיקת היסטוריה" (`deleteWorkDayAction`/`deleteAllWorkDaysAction`) היא hard delete אמיתי — מחיקה מלאה, לא שמירה בארכיון, מסתמכת על ה-cascade בסכימה.
- לכל תור יכולה להיות בקשת ביטול פעילה אחת בו־זמנית.

## שירותים ומשכי זמן (קבועים ב-PRD, לא להמציא ערכים אחרים)

| שירות | משך |
|---|---|
| תספורת מבוגר | 10 דק' |
| תספורת + זקן | 15 דק' |
| תספורת ילד | 10 דק' |
| הסרת שיער בלייזר | 10 דק' |
| חלאקה | 15 דק' |

## חוקי עסק קריטיים

- מוצגות ללקוח רק שעות פנויות בתוך ימי עבודה שהספר פתח — אסור חפיפה בין תורים.
- שינוי תור מותר רק לשעה פנויה; שולחת הודעה על השינוי.
- ביטול תור דורש בקשה מהלקוח **ואישור מפורש** מהספר — התור לא מתבטל אוטומטית.
- מחיקת יום/תור דורשת הודעת אזהרה ואישור מפורש לפני ביצוע.
- איפוס סיסמה — קוד חד־פעמי ב-SMS, לא מייל.
- הרשאות: מסכי ניהול נגישים רק ל-`administrator`; לקוח לא מחובר לא יכול לערוך תורים.
- **גישה ל-`/admin` חייבת שתי הגנות בו-זמנית, לעולם לא רק אחת:**
  1. `apps/web/src/proxy.ts` — רץ ב-edge *לפני* כל קוד עמוד, על כל נתיב תחת `/admin/:path*` (matcher). זו ההגנה שמונעת גישה ע"י הקלדת URL בלבד, גם אם עמוד ספציפי ישכח לבדוק הרשאה.
  2. `requireAdmin()` (`lib/auth/session.ts`) — נקרא בתוך כל עמוד/`page.tsx` תחת `/admin`.
  כל נתיב/עמוד ניהול חדש (כולל routes דינמיים כמו `/admin/day/[id]`) **חייב** גם להיכלל תחת ה-matcher ב-`proxy.ts` וגם לקרוא ל-`requireAdmin()` בעצמו — אף אחד מהשניים אינו תחליף לשני. (הערה: Next.js 16 החליף את השם `middleware.ts` ב-`proxy.ts` — קובץ בשם `middleware.ts` יגרום להתנגשות ולקריסת השרת אם `proxy.ts` כבר קיים.)

## מפורשות מחוץ לסקופ (Out of Scope)

אין לממש: תשלום/סליקת אשראי באפליקציה, מערכת נאמנות, דירוגים/ביקורות, ריבוי ספרים/סניפים, צ'אט לקוח-ספר.

## מצב נוכחי

מונוריפו pnpm פעיל: `apps/web` (Next.js), `apps/worker`, `packages/db` (Prisma), `packages/shared`. הרוב עדיין לא committed (יש שינויים מצטברים ב-worktree) — יש להריץ `git status`/`git diff` לפני שמניחים שמשהו כבר בהיסטוריה.

**קיים ועובד (נבדק ידנית בדפדפן):**
- **אימות לקוח** — הרשמה/כניסה/יציאה/איפוס סיסמה (SMS מדומה דרך `packages/shared/src/sms.ts`).
- **קביעת תור ללקוח** (`account/book`) — בחירת שירות (כולל שירותי ילד, ללא צ'ק-בוקס — `Service.is_child_service` קובע אם מבקשים שם ילד), תאריך, שעה, קביעה נוספת חוזרת לאותה זרימה.
- **שינוי תור ללקוח** (`account/appointments` + `RescheduleButton`).
- **`apps/web/src/lib/availability.ts`** — `findAvailableSlots`/`isSlotAvailable`: רשת קבועה של 10 דקות מתחילת יום העבודה, מתיישרת מחדש בדיוק לסוף כל תור/הפסקה/חסימה (בלי מרווח) — כדי שלא יוצגו שתי אפשרויות בפער קטן מ-10 דקות גם כששירות אינו כפולה של 10. מכוסה בטסטים (`pnpm test` בתוך `apps/web`).
- **תיקון timezone**: כל תצוגת זמן משתמשת ב-`ISRAEL_TIME_ZONE` (`packages/shared`) במפורש — Server Components רצים בשעון השרת, לא בשעון ישראל, אז בלי `timeZone` מפורש התצוגה הייתה שגויה.
- **מסכי ניהול (`/admin`)** — מוגנים ע"י `requireAdmin()` (מפנה לקוח/לא-מחובר הצידה, לא רק מסתיר תוכן):
  - פתיחת יום עבודה חדש + הפסקות דינמיות.
  - עדכון שעות של יום פתוח (נחסם אם יש תור/הפסקה/חסימה מחוץ לטווח החדש).
  - צפייה בתורי יום + העברת תור לשעה אחרת באותו יום (`/admin/day/[id]`) — שולח SMS + רושם `Notification` ללקוח עם חשבון מקושר; תור ידני ללא חשבון מועבר בלי הודעה.
  - קביעת תור ידנית ללקוח ללא חשבון (שם בלבד, ללא טלפון).
  - חסימת/הסרת חסימה של מספרי טלפון (`/admin/blocked-customers`) — נאכף גם בהרשמה וגם בקביעה/שינוי תור, וחל גם על מספרים שטרם נרשמו.
  - **ביטול תור בודד** (`CancelAppointmentButton`, US-017) — soft, הופך `status` ל-`cancelled` ומשחרר את השעה מחדש; שולח SMS+`Notification` ללקוח עם חשבון מקושר.
  - **מחיקת יום/כל היומן לצמיתות** (US-012, "מחיקת היום כולו" ב-`/admin/day/[id]`, "מחיקת כל היומן" ב-`/admin`) — hard delete אמיתי (cascade), עם עותק להדפסה/PDF אופציונלי לפני (`/admin/day/[id]/print`, `/admin/print-all`) והודעת ביטול לכל לקוח עם תור פעיל מקושר בטווח שנמחק.
  - **אישור/דחיית בקשות ביטול** (`/admin/cancellation-requests`, US-008).
- `zonedTimeToUtc()` ב-`packages/shared` — ממיר שעון קיר ישראלי (כולל שעון קיץ/חורף, בלי ספריית tz) ל-UTC; משמש את כל טפסי הניהול.
- `runSerializable()` הועבר ל-`apps/web/src/lib/serializableTransaction.ts` (לא בקובץ `"use server"`) כדי שיהיה ניתן לשימוש חוזר משם.
- `notifyAppointmentCancelled()` ו-`sendCustomerNotification()` (גנרי) ב-`apps/web/src/lib/notifyCustomer.ts` — המקום היחיד שכותב ל-`Notification`; `appointment_id`/`cancellation_request_id` מושארים `null` כשמדובר במחיקה קשה (הרשומה לא שורדת, אי אפשר להצביע אליה).
- **חשוב:** לפני שליחת הודעת ביטול על תור, תמיד לבדוק גם `starts_at >= new Date()` (לא רק `status === "scheduled"`) — אין בסכימה סטטוס "הסתיים" נפרד, אז תור היסטורי נשאר `scheduled` לנצח ועלול לגרום להודעת "בוטל" מטעה על משהו שכבר קרה, אם שוכחים את הבדיקה הזו (זו הייתה תקלה אמיתית שתוקנה ב-`deleteWorkDayAction`/`deleteAllWorkDaysAction`/`cancelAppointmentAction`).
- `account/appointments` **כבר** מסנן `starts_at >= now` — הלקוח אף פעם לא רואה תורים שהתאריך שלהם עבר; אין צורך בשינוי נוסף כדי לממש את זה.
- **בקשת ביטול מהלקוח** (US-008, `CancellationRequest`) — לקוח שולח בקשה מ-`account/appointments` (`RequestCancellationButton`), הספר מאשר/דוחה ב-`/admin/cancellation-requests` (עם badge מספר ממתינות ב-`/admin`). רק אישור מהספר משנה את `Appointment.status` ל-`cancelled` בפועל; דחייה משאירה את התור פעיל. הלקוח מקבל הודעה על ההחלטה (`type: cancellation_decision`). `CancellationRequest.appointment_id` הוא `@unique` בסכימה — רק שורה אחת אי-פעם לכל תור, אז בקשה שנדחתה מתעדכנת בחזרה ל-`pending` בבקשה נוספת במקום ליצור שורה שנייה.
- **הודעות כלליות** (US-009, `Announcement`) — הספר מפרסם ב-`/admin/announcements`; מוצגות ללקוח ב-`/account` (הכי חדשה קודם). ללא SMS/Notification per-customer — ה-PRD דורש רק תצוגה באפליקציה, לא שידור טקסטים.
- **`apps/worker`** — לא עוד placeholder: `node-cron` (כבר היה תלות מוצהרת מ-Phase 1) מריץ כל דקה `sendDueReminders()` (`apps/worker/src/reminders.ts`) שמאתר תורים `scheduled` עם חשבון מקושר שמתחילים בתוך `APPOINTMENT_REMINDER_LEAD_MINUTES` (120 דק', `packages/shared`) וללא `Notification` מסוג `appointment_reminder` קיים עדיין — האידמפוטנטיות מסתמכת רק על הבדיקה הזו (אין דגל "תזכורת נשלחה" נפרד בסכימה). נבדק ידנית קצה-לקצה (יצירת תור זמני 30 דק' קדימה, הרצה כפולה, מחיקה) — נשלחת פעם אחת בלבד. השרת דורש `apps/worker/.env` (מקומי, לא ב-git כמו שאר קבצי ה-.env) עם `DATABASE_URL`; `pnpm --filter @barberbook/worker dev` (או `pnpm worker` מהשורש) מריץ אותו עם `--env-file=.env`.
- `formatIsraelDate`/`formatIsraelTime` הועברו מ-`apps/web/src/lib/notifyCustomer.ts` ל-`packages/shared` כדי ש-`apps/worker` (חבילה נפרדת, בלי גישה ל-`apps/web`) יוכל להשתמש בהן גם כן.

**טרם קיים קוד עבורו:** שום דבר מה-PRD הנוכחי. הכל ב-US-001 עד US-017 ו-FR-1 עד FR-27 ממומש.
