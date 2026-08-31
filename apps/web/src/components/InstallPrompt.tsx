"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "pwa-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own (non-standard) flag for "added to home screen".
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY) || isStandalone()) return;

    if (isIos()) {
      // Reading a browser-only global (navigator.userAgent) on mount — can't
      // move to render, this component is SSR'd where `window` doesn't exist.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowIosHint(true);
      return;
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDeferredPrompt(null);
    setShowIosHint(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  if (!deferredPrompt && !showIosHint) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-between gap-3 rounded-xl border border-barber-teal bg-white p-4 shadow-lg">
      <p className="text-sm text-ink">
        {showIosHint
          ? "להתקנת האפליקציה: הקישו על כפתור השיתוף ואז \"הוסף למסך הבית\""
          : "התקינו את BarberBook כדי לגשת אליה ישירות ממסך הבית"}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        {!showIosHint && (
          <button
            onClick={install}
            className="rounded-full bg-barber-teal px-4 py-2 text-sm font-medium text-cream-text"
          >
            התקנה
          </button>
        )}
        <button onClick={dismiss} className="text-sm text-slate-muted" aria-label="סגירה">
          ✕
        </button>
      </div>
    </div>
  );
}
