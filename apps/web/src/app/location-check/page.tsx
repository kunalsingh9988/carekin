"use client";
import { useState } from "react";
import Link from "next/link";
import { LocationPicker } from "@/components/onboarding/LocationPicker";
import type { LocationCoordinates } from "@/lib/locations";
export default function LocationCheckPage() {
  const [value,onChange]=useState<LocationCoordinates|null>(null);
  return <main className="mx-auto grid w-full max-w-xl gap-6 px-6 py-10"><h1 className="text-3xl font-semibold">Check your device location</h1><p className="text-text-secondary">Test the same location control used in onboarding. This page does not save your coordinates or change your profile. Allow location when your browser asks. A device location is a coordinate—not an automatically filled postal address.</p><LocationPicker value={value} onChange={onChange}/><Link href="/get-started" className="min-h-tap text-accent-text">Back to getting started</Link></main>;
}
