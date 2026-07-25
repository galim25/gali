"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAnnouncementAction } from "@/lib/actions/announcements";

export function AnnouncementForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    const result = await createAnnouncementAction({ title, content });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setTitle("");
    setContent("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="border-barber-teal bg-white flex flex-col gap-3 rounded-xl border p-4">
      <h2 className="text-ink font-bold">פרסום הודעה חדשה</h2>
      <input
        placeholder="כותרת"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border-barber-teal bg-white text-ink placeholder-slate-muted rounded-xl border p-2"
        required
      />
      <textarea
        placeholder="תוכן ההודעה"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="border-barber-teal bg-white text-ink placeholder-slate-muted rounded-xl border p-2"
        rows={4}
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-barber-teal text-cream-text rounded-full p-2 font-bold disabled:opacity-50"
      >
        {pending ? "מפרסם..." : "פרסום"}
      </button>
    </form>
  );
}
