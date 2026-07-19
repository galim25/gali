import cron from "node-cron";
import { sendDueReminders } from "./reminders";

console.log("[worker] BarberBook worker starting — appointment reminder cron every minute.");

async function runReminders() {
  try {
    await sendDueReminders();
  } catch (err) {
    console.error("[worker] failed to send reminders:", err);
  }
}

cron.schedule("* * * * *", runReminders);

// Also run once immediately on boot, so reminders don't wait for the first minute tick.
runReminders();
