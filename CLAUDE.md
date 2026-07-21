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

**ידוע ופתוח:** `apps/worker`'s `pnpm build` (`tsc`) + `pnpm start` (`node dist/index.js`) לא עובד כרגע בפועל — `packages/shared`/`packages/db` נצרכים כמקור TS ישיר (בלי build step משלהם), ו-Node הרץ-CommonJS-רגיל לא יודע לפענח את זה. עד שזה יתוקן, מריצים את ה-worker דרך `pnpm exec tsx --env-file=.env src/index.ts` (בלי `--watch` לריצה יציבה ארוכת-טווח) — זה עובד תקין (`tsx` מתרגם TS "on the fly", כולל בין-חבילתי), רק שזה טכנית dev-runtime ולא בינארי מקומפל.

## משתמשים

- **לקוח** — נרשם/מתחבר עם שם מלא + טלפון + סיסמה. קובע תורים לעצמו ולילדיו, משנה תור, שולח בקשת ביטול (טעונה אישור הספר), מקבל תזכורות והודעות.
- **מנהל מערכת (הספר)** — פותח ימי עבודה (תאריך, שעת התחלה/סיום, הפסקות), רואה ומנהל את כל היומן, קובע תורים ידנית, מוחק תורים/ימים שלמים (עם אזהרת אישור), מפרסם הודעות כלליות, מאשר/דוחה בקשות ביטול.

### שם מנהל המערכת

השם המוצג למנהל ("היי [שם]") הוא פשוט `User.full_name` של חשבון ה-administrator — אין הבחנה טכנית בין ספר לספר. כרגע קבוע כ-"יוסי הספר". כדי למסור את המערכת לספר אחר: לשנות את `ADMIN_FULL_NAME` ב-`packages/db/prisma/seed.ts` ולהריץ `pnpm db:seed` (עדכון אידמפוטנטי — `upsert` לפי `phone_number`, מעדכן גם חשבון קיים, לא רק יוצר חדש).

## ישויות עיקריות (ERD)

`User` (role: customer/administrator) · `PasswordResetCode` · `Service` (duration_minutes, `is_child_service`) · `WorkDay` · `WorkBreak` · `BlockedTime` · `Appointment` (status: scheduled/cancelled, attendee_type: self/child/other) · `CancellationRequest` (status: pending/approved/rejected) · `BookingRequest` (status: pending/approved/rejected) · `AppSettings` (סינגלטון, `requires_approval`) · `WaitlistEntry` · `Notification` (type כולל גם `appointment_booked`/`waitlist_slot_available`/`booking_decision`, ו-`read_at`) · `Announcement` · `BlockedPhoneNumber`

הערות מודל חשובות:
- `Appointment.booked_by_user_id` אופציונלי — תור ידני שהספר קובע יכול להתקיים בלי חשבון משתמש מקושר.
- אין ישות `Child` נפרדת — פרטי הילד נשמרים ברמת התור (`attendee_name`, `attendee_type`).
- **שתי פעולות נפרדות ושונות על תור/יום, אל תתבלבלו ביניהן:** "ביטול תור בודד" (`cancelAppointmentAction`) הוא soft — רק מחליף `status` ל-`cancelled`, הרשומה נשארת. "מחיקת היסטוריה" (`deleteWorkDayAction`/`deleteAllWorkDaysAction`) היא hard delete אמיתי — מחיקה מלאה, לא שמירה בארכיון, מסתמכת על ה-cascade בסכימה.
- לכל תור יכולה להיות בקשת ביטול פעילה אחת בו־זמנית, ולכל היותר בקשת תור (`BookingRequest`) אחת (נוצרת רק כשהתור נקבע בזמן שהמדיניות "דורש אישור" דלוקה).
- `BookingRequest` אינה "כוונה" — ה-`Appointment` הנלווה נוצר מיד עם סטטוס `scheduled` ותופס את השעה ביומן מרגע הבקשה; דחייה משנה את הסטטוס ל-`cancelled` ומשחררת את השעה, אישור לא נוגע בתור כלל.
- `AppSettings` היא שורה יחידה קבועה (`id = "singleton"`, ראו `settings.ts`'s get-or-create) — לא טבלת key-value כללית; אם יתווספו הגדרות גלובליות נוספות, כנראה עדיף עמודות נוספות לאותה שורה.
- `WaitlistEntry` כללית במכוון — לא משויכת לתאריך/שעה/שירות ספציפיים; `user_id` הוא `@unique`, אז לקוח יכול להיות ברשימה פעם אחת בלבד (הצטרפות חוזרת = no-op, לא כפילות).

## שירותים ומשכי זמן (קבועים ב-PRD, לא להמציא ערכים אחרים)

| שירות | משך |
|---|---|
| תספורת מבוגר | 10 דק' |
| תספורת + זקן | 15 דק' |
| תספורת ילד | 10 דק' |
| הסרת שיער בלייזר | 10 דק' |
| חלאקה | 15 דק' |

## חוקי עסק קריטיים

- מוצגות ללקוח רק שעות פנויות בתוך ימי עבודה שהספר פתח — אסור חפיפה בין תורים, ואסור גם שעה שכבר עברה (גם אם היא בתוך יום עבודה פתוח שטרם הסתיים).
- שינוי תור מותר רק לשעה פנויה שעדיין לא עברה; שולחת הודעה על השינוי.
- **מדיניות "דורש אישור" (`AppSettings.requires_approval`, ברירת מחדל כבויה) קובעת גלובלית את ההתנהגות של קביעת תור חדש *וגם* של בקשת ביטול:**
  - דלוקה: קביעת תור נשמרת כ-`BookingRequest` ממתין (התור עצמו כבר תופס את השעה); בקשת ביטול נשמרת כ-`CancellationRequest` ממתינה — בשני המקרים רק החלטת הספר קובעת בפועל.
  - כבויה: גם קביעת תור וגם בקשת ביטול קורים **מיידית**, בלי המתנה להחלטת הספר.
  - אל תניחו שביטול/קביעה **תמיד** דורשים אישור מפורש — זה תלוי במתג, בדקו את `getRequiresApproval()`.
- מחיקת יום/תור דורשת הודעת אזהרה ואישור מפורש לפני ביצוע.
- איפוס סיסמה — קוד חד־פעמי ב-SMS, לא מייל.
- הרשאות: מסכי ניהול נגישים רק ל-`administrator`; לקוח לא מחובר לא יכול לערוך תורים.
- **גישה ל-`/admin` חייבת שתי הגנות בו-זמנית, לעולם לא רק אחת:**
  1. `apps/web/src/proxy.ts` — רץ ב-edge *לפני* כל קוד עמוד, על כל נתיב תחת `/admin/:path*` (matcher). זו ההגנה שמונעת גישה ע"י הקלדת URL בלבד, גם אם עמוד ספציפי ישכח לבדוק הרשאה.
  2. `requireAdmin()` (`lib/auth/session.ts`) — נקרא בתוך כל עמוד/`page.tsx` תחת `/admin`.
  כל נתיב/עמוד ניהול חדש (כולל routes דינמיים כמו `/admin/day/[id]`) **חייב** גם להיכלל תחת ה-matcher ב-`proxy.ts` וגם לקרוא ל-`requireAdmin()` בעצמו — אף אחד מהשניים אינו תחליף לשני. (הערה: Next.js 16 החליף את השם `middleware.ts` ב-`proxy.ts` — קובץ בשם `middleware.ts` יגרום להתנגשות ולקריסת השרת אם `proxy.ts` כבר קיים.)
- **`COOKIE_SECURE`** (`.env`, ראו `.env.example`) — עוקף את ברירת המחדל (`NODE_ENV === "production"`) לדגל ה-`Secure` של עוגיית הסשן. `next start` תמיד מפעיל `NODE_ENV=production`, וללא HTTPS אמיתי עוגיית `Secure` נזרקת בשקט ע"י הדפדפן — כניסה "לא עובדת" בלי שום שגיאה גלויה. יש להשאיר `COOKIE_SECURE=false` כל עוד משרתים HTTP גולמי (כתובת IP:פורט, בלי דומיין+TLS), ולהסיר/להפוך ל-`true` ברגע שיש HTTPS אמיתי.

## עיצוב (Design System)

מסמכי מקור: אין קובץ עיצוב נפרד — הכללים כאן הם המקור היחיד, נקבעו בשיחה עם המשתמשת ב-2026-07-19.

### לוגו

- קומפוננטה: `<Logo />` ב-`apps/web/src/components/Logo.tsx`.
- קובץ המקור: `apps/web/public/logo.svg`.
- לעולם לא לשנות פרופורציות (הרוחב תמיד `auto` לפי גובה), לא להוסיף צללים.
- גודל מינימלי: 24px.
- מרווח סביב הלוגו: פרמטר `padding` אופציונלי (ברירת מחדל: חצי מהגובה). לשימוש ה-hero הגלובלי (ראו `<PageHeader />`) המרווח מוקטן במפורש ל-16px.
- **הלוגו הוא כותרת-העל (hero) של כל עמוד — ממורכז, גובה 160px, מעל כל שאר התוכן.** זה מחליף כלל קודם ("תמיד בצד שמאל") שבוטל.
- מתחת ללוגו, בצד ימין (`text-right`): המילה **"בס"ד"**, באותו גודל/צבע/משקל כמו טקסט הכותרת/ברכה שמתחתיה.
- קומפוננטת `<PageHeader title?: string />` (`apps/web/src/components/PageHeader.tsx`) עוטפת את כל זה — כל עמוד אמור להשתמש בה בראש ה-`<main>` שלו במקום לשכפל את המבנה.

### פלטת צבעים (Tailwind theme tokens, `globals.css`)

| טוקן | HEX | תפקיד |
|---|---|---|
| `prussian-blue` | `#0b132b` | רקע כהה גלובלי (`body`, כל `<main>`) |
| `space-indigo` | `#1c2541` | רקע כרטיסים/משטחים מורמים |
| `dusk-blue` | `#3a506b` | טקסט משני/עמום (תאריכים, timestamps) |
| `tropical-teal` | `#5bc0be` | CTA ראשי (רקע כפתור), מסגרות |
| `neon-ice` | `#6fffe9` | טקסט ראשי/כותרות על רקע כהה |

**ערכת נושא כהה קבועה** — לא מתחלף אוטומטית לפי `prefers-color-scheme`. אין בפלטה גוון בהיר/ניטרלי, אז אין "מצב בהיר" חלופי כרגע.

**חריג מכוון:** עמודי הדפסה/ייצוא (`admin/day/[id]/print`, `admin/print-all`) **נשארים בהירים** (רקע לבן, טקסט כהה) בכוונה — הם מיועדים להדפסה/PDF בפועל, ורקע כהה שם מבזבז דיו ופוגע בקריאות על נייר.

### פונט

- **Rubik** (Google Fonts, `next/font/google`, subsets `hebrew`+`latin`), נטען גלובלית ב-`app/layout.tsx` על תגית ה-`<html>`. אין להוסיף אותו שוב בעמודים בודדים.

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
- **בקשת ביטול מהלקוח** (US-008, `CancellationRequest`) — לקוח שולח בקשה מ-`account/appointments` (`RequestCancellationButton`). **ההתנהגות תלויה במדיניות "דורש אישור" (ראו למטה):** כשהיא דלוקה, הבקשה ממתינה עד שהספר מאשר/דוחה ב-`/admin/cancellation-requests` (badge מספר ממתינות ב-`/admin`) — רק אישור משנה את `Appointment.status` ל-`cancelled` בפועל, דחייה משאירה את התור פעיל, והלקוח מקבל הודעה על ההחלטה (`type: cancellation_decision`). כשהיא כבויה, `requestCancellationAction` מבטלת את התור **מיידית** בלי ליצור `CancellationRequest` כלל — אותה תוצאה כמו ביטול ישיר ע"י הספר. `CancellationRequest.appointment_id` הוא `@unique` בסכימה — רק שורה אחת אי-פעם לכל תור, אז בקשה שנדחתה מתעדכנת בחזרה ל-`pending` בבקשה נוספת במקום ליצור שורה שנייה.
- **מדיניות "דורש אישור"** (US-018, `AppSettings`, `apps/web/src/lib/actions/settings.ts`) — מתג יחיד וגלובלי (`getRequiresApproval()`/`setRequiresApprovalAction()`) שנקרא גם בקביעת תור וגם בבקשת ביטול; לא לפי יום/לקוח/שירות. מוגדר ב-`/admin/settings` (`ApprovalToggle`). ברירת מחדל: כבוי.
- **בקשות תורים** (US-019/US-020, `BookingRequest`) — כשהמדיניות דלוקה, `bookAppointmentAction` יוצרת את ה-`Appointment` (סטטוס `scheduled`, תופס את השעה מיד) **וגם** `BookingRequest` (`pending`) לצידו, ומחזירה `pendingApproval: true` ללקוח (מסך "הבקשה שלך נשלחה לאישור הספר" ב-`account/book`) במקום את התראת "נקבע תור חדש" הרגילה למנהל. הספר מאשר/דוחה ב-`/admin/booking-requests` (badge ב-`/admin`, `getPendingBookingRequestCount()`): אישור לא נוגע בתור; דחייה הופכת אותו ל-`cancelled` (ומפעילה `notifyWaitlistOfFreedSlot` אם השעה עדיין עתידית) ושולחת ללקוח הודעת `booking_decision`.
- **התראות מנהל** (US-021, `notifyAdmin.ts`, `adminNotifications.ts`, `/admin/notifications`) — כשהמדיניות כבויה, כל תור שלקוח קובע לעצמו (`notifyAdminsOfNewBooking`) יוצר `Notification` מסוג `appointment_booked` לכל מנהל (בתוך האפליקציה בלבד, בלי SMS); תור ידני שהספר קובע לא מפעיל את זה. badge ב-`/admin` סופר לפי `read_at IS NULL`; `markAdminNotificationsReadAction` היא "סמן הכל כנקרא" (bulk `updateMany`) — אין סימון פר-שורה.
- **רשימת המתנה** (US-022–US-025, `WaitlistEntry`, `apps/web/src/lib/actions/waitlist.ts`) — כללית, לא לפי תאריך/שירות; `user_id` הוא `@unique` אז הצטרפות חוזרת היא no-op. `joinWaitlistAction`/`leaveWaitlistAction`/`isOnWaitlist` בצד הלקוח (`account/book`, `LeaveWaitlistButton` ב-`/account`); `getWaitlistEntries`/`removeWaitlistEntryAction` בצד הספר (`/admin/waitlist`) — הסרה ידנית, בלי הודעה ללקוח. שתי טריגרים נפרדים להודעה (`type: waitlist_slot_available`, דרך helper משותף `notifyAllWaitlistEntries`): (1) `notifyWaitlistOfFreedSlot` — כל ביטול תור עתידי (ביטול ישיר ע"י הספר, אישור/ביטול-מיידי של בקשת ביטול, דחיית בקשת תור); (2) `notifyWaitlistOfExtendedHours` — רק כש-`updateWorkDayHoursAction` **מרחיבה** יום שכבר פתוח (טווח חדש רחב מהישן), לא כשנפתח יום חדש לגמרי (`createWorkDayAction` לא נוגע ברשימת ההמתנה).
- **חסימת שעות שעברו** (FR-28) — `getSlotsForDate` מסננת שעות עם `d < now` לפני שהן מוצגות ללקוח; `bookAppointmentAction`/`rescheduleAppointmentAction` בודקות שוב `starts_at < new Date()` בתוך הטרנזקציה עצמה (זורקות `PAST_SLOT`) כרשת ביטחון למקרה שהמסך אצל הלקוח לא עדכני. הבדיקה **לא** בתוך `findAvailableSlots`/`isSlotAvailable` עצמן (`apps/web/src/lib/availability.ts`) — הן נשארות טהורות/דטרמיניסטיות ומכוסות ב-11 הטסטים הקיימים; הסינון לפי "עכשיו" הוא רק בשכבת ה-action.
- **הודעות כלליות** (US-009, `Announcement`) — הספר מפרסם ב-`/admin/announcements`; מוצגות ללקוח ב-`/account` (הכי חדשה קודם). ללא SMS/Notification per-customer — ה-PRD דורש רק תצוגה באפליקציה, לא שידור טקסטים.
- **`apps/worker`** — לא עוד placeholder: `node-cron` (כבר היה תלות מוצהרת מ-Phase 1) מריץ כל דקה `sendDueReminders()` (`apps/worker/src/reminders.ts`) שמאתר תורים `scheduled` עם חשבון מקושר שמתחילים בתוך `APPOINTMENT_REMINDER_LEAD_MINUTES` (120 דק', `packages/shared`) וללא `Notification` מסוג `appointment_reminder` קיים עדיין — האידמפוטנטיות מסתמכת רק על הבדיקה הזו (אין דגל "תזכורת נשלחה" נפרד בסכימה). נבדק ידנית קצה-לקצה (יצירת תור זמני 30 דק' קדימה, הרצה כפולה, מחיקה) — נשלחת פעם אחת בלבד. השרת דורש `apps/worker/.env` (מקומי, לא ב-git כמו שאר קבצי ה-.env) עם `DATABASE_URL`; `pnpm --filter @barberbook/worker dev` (או `pnpm worker` מהשורש) מריץ אותו עם `--env-file=.env`.
- `formatIsraelDate`/`formatIsraelTime` הועברו מ-`apps/web/src/lib/notifyCustomer.ts` ל-`packages/shared` כדי ש-`apps/worker` (חבילה נפרדת, בלי גישה ל-`apps/web`) יוכל להשתמש בהן גם כן.

**טרם קיים קוד עבורו:** שום דבר מה-PRD הנוכחי. הכל ב-US-001 עד US-025 ו-FR-1 עד FR-35 ממומש.

**הערת בדיקה:** US-018 עד US-023 (מדיניות אישור, בקשות תורים, התראות מנהל, הצטרפות/ניהול רשימת המתנה) נבדקו ידנית בדפדפן ע"י המשתמשת ב-2026-07-20/21. US-024 (התפנות תור) עבד בפועל באותה בדיקה כתופעת לוואי (בקשת תור שנדחתה שחררה שעה). חסימת שעות שעברו (FR-28) ו-US-025 (הודעת הרחבת שעות) נכתבו אחרי אותה בדיקה — עברו `tsc`, את 11 הטסטים הקיימים (`pnpm test`), ואימות לוגיקה ידני מול הסכימה/DB, אבל **לא עברו עדיין בדיקה ידנית בדפדפן** על ה-flow המלא (למשל: לקוח שרואה בפועל ש-09:00 נעלם מרשימת השעות אחרי שהשעה עברה; לקוח ברשימת המתנה שמקבל בפועל SMS/Notification אחרי שהספר הרחיב יום).
