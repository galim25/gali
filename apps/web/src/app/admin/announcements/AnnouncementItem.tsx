"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteAnnouncementAction,
  updateAnnouncementAction,
  type AnnouncementView,
} from "@/lib/actions/announcements";

export function AnnouncementItem({
  announcement,
  publishedAt,
}: {
  announcement: AnnouncementView;
  publishedAt: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setError(undefined);
    const result = await updateAnnouncementAction({ id: announcement.id, title, content });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function del() {
    if (!window.confirm("למחוק את ההודעה הזו? הלקוחות כבר לא יראו אותה.")) return;
    setPending(true);
    setError(undefined);
    const result = await deleteAnnouncementAction(announcement.id);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (editing) {
    return (
      <li className="border-barber-teal bg-white flex flex-col gap-2 rounded-xl border p-3 text-sm">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-barber-teal bg-white text-ink rounded-xl border p-2"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="border-barber-teal bg-white text-ink rounded-xl border p-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={pending}
            className="bg-barber-teal text-cream-text rounded-full px-3 py-1 text-sm font-bold disabled:opacity-50"
          >
            {pending ? "שומר..." : "שמירה"}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setTitle(announcement.title);
              setContent(announcement.content);
              setError(undefined);
            }}
            className="border-barber-teal text-barber-teal rounded-full border px-3 py-1 text-sm font-medium"
          >
            ביטול
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="border-barber-teal bg-white rounded-xl border p-3 text-sm">
      <p className="text-ink font-bold">{announcement.title}</p>
      <p className="whitespace-pre-wrap text-slate-muted">{announcement.content}</p>
      <p className="text-slate-muted">{publishedAt}</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="mt-2 flex gap-3">
        <button onClick={() => setEditing(true)} className="text-barber-teal text-sm underline">
          עריכה
        </button>
        <button onClick={del} disabled={pending} className="text-sm text-red-600 underline disabled:opacity-50">
          {pending ? "מוחק..." : "מחיקה"}
        </button>
      </div>
    </li>
  );
}
