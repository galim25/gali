import bcrypt from "bcryptjs";
import { SERVICE_DEFINITIONS } from "@barberbook/shared";
import { prisma } from "../src";

async function main() {
  for (const service of SERVICE_DEFINITIONS) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: { duration_minutes: service.duration_minutes },
      create: service,
    });
  }

  const adminPhone = "0500000000";
  const existingAdmin = await prisma.user.findUnique({ where: { phone_number: adminPhone } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        full_name: "מנהל המערכת",
        phone_number: adminPhone,
        password_hash: await bcrypt.hash("admin123", 10),
        role: "administrator",
      },
    });
    console.log(`Seeded admin user: phone=${adminPhone} password=admin123`);
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
