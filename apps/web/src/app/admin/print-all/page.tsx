import { requireAdmin } from "@/lib/auth/session";
import { getAllWorkDaysExport } from "@/lib/actions/workdays";
import { ExportWorkDayList } from "@/app/admin/ExportWorkDayList";
import { PrintButton } from "@/app/admin/PrintButton";

export default async function PrintAllPage() {
  await requireAdmin();
  const days = await getAllWorkDaysExport();

  return (
    <main dir="rtl" className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-bold">עותק להדפסה — כל היומן</h1>
        <PrintButton />
      </div>
      {days.length === 0 ? (
        <p className="text-gray-500">אין ימי עבודה במערכת.</p>
      ) : (
        <ExportWorkDayList days={days} />
      )}
    </main>
  );
}
