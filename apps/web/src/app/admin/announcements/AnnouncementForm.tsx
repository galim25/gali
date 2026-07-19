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
    <form onSubmit={submit} className="border-tropical-teal flex flex-col gap-3 rounded border p-4">
      <h2 className="text-neon-ice font-medium">פרסום הודעה חדשה</h2>
      <input
        placeholder="כותרת"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border-tropical-teal bg-space-indigo text-neon-ice placeholder-gray-400 rounded border p-2"
        required
      />
      <textarea
        placeholder="תוכן ההודעה"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="border-tropical-teal bg-space-indigo text-neon-ice placeholder-gray-400 rounded border p-2"
        rows={4}
        required
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-tropical-teal text-prussian-blue rounded p-2 font-medium disabled:opacity-50"
      >
        {pending ? "מפרסם..." : "פרסום"}
      </button>
    </form>
  );
}
