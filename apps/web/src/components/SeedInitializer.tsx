"use client";

import { useEffect } from "react";
import { seedIfNeeded } from "@/lib/storage/seed";

// Runs once on first load in the browser — populates localStorage with
// demo data (Build Order step 2). Renders nothing.
export function SeedInitializer() {
  useEffect(() => {
    seedIfNeeded();
  }, []);
  return null;
}
