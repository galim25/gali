import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { getRequiresApproval } from "@/lib/actions/settings";
import { ApprovalToggle } from "./ApprovalToggle";
import { PageHeader } from "@/components/PageHeader";

export default async function SettingsPage() {
  await requireAdmin();
  const requiresApproval = await getRequiresApproval();

  return (
    <main dir="rtl" className="bg-prussian-blue mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <PageHeader title="הגדרות" />
      <div className="flex justify-end">
        <Link href="/admin" className="text-neon-ice text-sm underline">
          חזרה לניהול
        </Link>
      </div>

      <ApprovalToggle initialValue={requiresApproval} />
    </main>
  );
}
