import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { getBarbersAdmin } from "@/lib/actions/barbers";
import { AddBarberForm } from "./AddBarberForm";
import { BarberActiveToggle } from "./BarberActiveToggle";
import { PageHeader } from "@/components/PageHeader";
import { AdminBrandHero } from "@/components/AdminBrandHero";

export default async function BarbersPage() {
  await requireAdmin();
  const barbers = await getBarbersAdmin();

  return (
    <main dir="rtl" className="bg-cream mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <PageHeader title="ניהול ספרים" topBanner={<AdminBrandHero />} />
      <div className="flex justify-end">
        <Link href="/admin" className="text-barber-teal text-sm underline">
          חזרה לניהול
        </Link>
      </div>

      <AddBarberForm />

      <div className="flex flex-col gap-2">
        <h2 className="text-ink font-bold">הספרים במערכת</h2>
        <ul className="flex flex-col gap-2">
          {barbers.map((b) => (
            <li
              key={b.id}
              className="border-barber-teal bg-white flex items-center justify-between rounded-xl border p-3 text-sm"
            >
              <p className="text-ink font-bold">
                {b.full_name}
                {b.is_primary && (
                  <span className="bg-barber-teal text-cream-text mr-2 rounded-full px-2 py-0.5 text-xs font-medium">
                    ספר ראשי
                  </span>
                )}
              </p>
              <BarberActiveToggle barberId={b.id} initialValue={b.is_active} isPrimary={b.is_primary} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
