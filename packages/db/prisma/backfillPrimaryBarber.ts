// One-off migration-data script — run once per database, right after the
// `add_barbers_table` migration and before the `barber_id_required`
// migration (see CLAUDE.md, "ספרי משנה"). Not part of the regular seed flow:
// a fresh database has no pre-existing WorkDay rows to backfill, so
// seed.ts's own Barber upsert is enough there. Safe to re-run (upsert +
// `where: { barber_id: null }` is a no-op once everything is backfilled).
import { prisma } from "../src";

const PRIMARY_BARBER_ID = "primary";
// Matches ADMIN_FULL_NAME in seed.ts — kept in sync manually since this
// script only exists for the one-time backfill window described above.
const ADMIN_FULL_NAME = "יוסי הספר";

async function main() {
  await prisma.barber.upsert({
    where: { id: PRIMARY_BARBER_ID },
    update: {},
    create: { id: PRIMARY_BARBER_ID, full_name: ADMIN_FULL_NAME, is_primary: true },
  });

  const { count } = await prisma.workDay.updateMany({
    where: { barber_id: null },
    data: { barber_id: PRIMARY_BARBER_ID },
  });

  console.log(`Backfilled barber_id on ${count} work day(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
