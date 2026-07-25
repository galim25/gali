import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { getRequiresApproval } from "@/lib/actions/settings";
import { ApprovalToggle } from "./ApprovalToggle";
import { PageHeader } from "@/components/PageHeader";
import { AdminBrandHero } from "@/components/AdminBrandHero";

export default async function SettingsPage() {
  await requireAdmin();
  const requiresApproval = await getRequiresApproval();

  return (
    <main dir="rtl" className="bg-cream mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <PageHeader title="הגדרות" topBanner={<AdminBrandHero />} />
      <div className="flex justify-end">
        <Link href="/admin" className="text-barber-teal text-sm underline">
          חזרה לניהול
        </Link>
      </div>

      <ApprovalToggle initialValue={requiresApproval} />

    </main>
  );
}
