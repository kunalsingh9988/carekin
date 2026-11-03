"use client";

import { useEffect } from "react";
import { seedIfNeeded } from "@/lib/storage/seed";
import { backendEnabled } from "@/lib/backend/config";
import { initializeBackendAuth } from "@/lib/auth";

// Runs once on first load in the browser — populates localStorage with
// demo data (Build Order step 2). Renders nothing.
export function SeedInitializer() {
  useEffect(() => {
    if (backendEnabled) return initializeBackendAuth();
    seedIfNeeded();
  }, []);
  return null;
}
