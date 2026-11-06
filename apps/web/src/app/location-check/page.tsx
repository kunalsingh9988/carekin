"use client";
import { useState } from "react";
import Link from "next/link";
import { LocationPicker } from "@/components/onboarding/LocationPicker";
import type { LocationCoordinates } from "@/lib/locations";
export default function LocationCheckPage() {
  const [value,onChange]=useState<LocationCoordinates|null>(null);
  const [address,setAddress]=useState("");
  return <main className="mx-auto grid w-full max-w-xl gap-6 px-6 py-10"><h1 className="text-3xl font-semibold">Choose your care location</h1><p className="text-text-secondary">Try address search, current location and map-pin confirmation. This page does not save your coordinates or change your profile. Map and address requests use Geoapify after you open the picker.</p><LocationPicker value={value} onChange={onChange} address={address} onAddressConfirmed={setAddress}/><Link href="/get-started" className="min-h-tap text-accent-text">Back to getting started</Link></main>;
}
