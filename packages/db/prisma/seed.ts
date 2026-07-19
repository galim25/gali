import bcrypt from "bcryptjs";
import { SERVICE_DEFINITIONS } from "@barberbook/shared";
import { prisma } from "../src";

async function main() {
  for (const service of SERVICE_DEFINITIONS) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: { duration_minutes: service.duration_minutes, is_child_service: service.is_child_service },
      create: service,
    });
  }

  // The barber's display name — change this and re-run `pnpm db:seed` to hand
  // the system to a different barber (see CLAUDE.md, "שם מנהל המערכת").
  const ADMIN_FULL_NAME = "יוסי הספר";
  const adminPhone = "0500000000";
  await prisma.user.upsert({
    where: { phone_number: adminPhone },
    update: { full_name: ADMIN_FULL_NAME },
    create: {
      full_name: ADMIN_FULL_NAME,
      phone_number: adminPhone,
      password_hash: await bcrypt.hash("admin123", 10),
      role: "administrator",
    },
  });
  console.log(`Seeded/updated admin user: phone=${adminPhone}`);

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
