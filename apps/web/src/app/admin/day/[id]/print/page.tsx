import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getWorkDayExport } from "@/lib/actions/workdays";
import { ExportWorkDayList } from "@/app/admin/ExportWorkDayList";
import { PrintButton } from "@/app/admin/PrintButton";

export default async function PrintDayPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const day = await getWorkDayExport(id);
  if (!day) notFound();

  return (
    <main dir="rtl" className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 bg-white p-6 text-gray-900">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-bold">עותק להדפסה — יום עבודה</h1>
        <PrintButton />
      </div>
      <ExportWorkDayList days={[day]} />
    </main>
  );
}
