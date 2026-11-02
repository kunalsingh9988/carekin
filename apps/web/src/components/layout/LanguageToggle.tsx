"use client";

import { useEffect, useState } from "react";
import { get, set } from "@/lib/storage/client";

type Lang = "en" | "hi";

// Built now per Section 6, even though only English strings exist yet —
// "so it's not a later retrofit." Purely cosmetic in this prototype: it
// persists a preference but doesn't translate anything.
export function LanguageToggle() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    queueMicrotask(() => setLang(get<Lang>("lang", "en")));
  }, []);

  function toggle() {
    const next: Lang = lang === "en" ? "hi" : "en";
    setLang(next);
    set("lang", next);
  }

  return (
    <button
      onClick={toggle}
      className="min-h-tap rounded-md border border-border px-3 text-xs font-semibold text-text-secondary"
      aria-label="Toggle language"
    >
      {lang === "en" ? "EN" : "हिं"}
    </button>
  );
}
