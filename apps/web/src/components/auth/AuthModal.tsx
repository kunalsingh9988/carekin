"use client";
import { backendEnabled } from "@/lib/backend/config";
import { BackendSignIn } from "./BackendSignIn";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { loginAsDemo, loginAsRole } from "@/lib/auth";
import { getMyProvider, getDocuments } from "@/lib/storage/repositories/providers";
import { get } from "@/lib/storage/client";
import { getFamilyProfile } from "@/lib/storage/repositories/families";
import { PhoneNumber, UserRole, type UserRoleValue } from "@/lib/validation/schemas";
import { useAuthModal } from "./AuthModalProvider";
import { BrandLogo } from "@/components/ui/BrandLogo";

type Step = "phone" | "otp";

// Demo mode: no real SMS provider exists in this prototype (Guardrails,
// Section 2/8) — any 6-digit code is accepted, and the on-screen note says
// so explicitly rather than silently auto-passing.
export function AuthModal() {
  const { isOpen, close, defaultRole } = useAuthModal();
  if (!backendEnabled) return <DemoAuthModal />;
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"><div role="dialog" aria-modal="true" aria-label="Sign in" className="relative w-full max-w-lg rounded-lg bg-surface p-6 pt-16"><button className="absolute right-3 top-3 min-h-tap px-3" onClick={close} aria-label="Close sign in">Close</button><BackendSignIn defaultRole={defaultRole} onDone={close} /></div></div>;
}
function DemoAuthModal() {
  const { isOpen, close, defaultRole } = useAuthModal();
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>("phone");
  const [role, setRole] = useState<UserRoleValue>(defaultRole);
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) queueMicrotask(() => setRole(defaultRole));
  }, [isOpen, defaultRole]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>("input, button")?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleCancel();
      if (e.key === "Tab") {
        const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href], select') ?? []);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("keydown", onKeyDown); previous?.focus(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  function reset() {
    setStep("phone");
    setPhone("+91");
    setOtp("");
    setError(null);
  }

  function handleCancel() {
    reset();
    close();
  }

  function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = PhoneNumber.safeParse(phone);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid phone number");
      return;
    }
    setStep("otp");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter any 6 digits — this is demo mode.");
      return;
    }

    const parsedRole = UserRole.safeParse(role);
    const user = loginAsRole(phone, parsedRole.success ? parsedRole.data : "family");
    reset();
    close();
    await routeAfterLogin(user);
  }

  // The no-login path: one tap continues on the seeded demo identity for
  // the selected role — same destination routing as a real login.
  async function handleSkip() {
    const parsedRole = UserRole.safeParse(role);
    const user = loginAsDemo(parsedRole.success ? parsedRole.data : "family");
    reset();
    close();
    await routeAfterLogin(user);
  }

  async function routeAfterLogin(user: { id: string; role: UserRoleValue }) {
    if (user.role === "admin") {
      router.push(get(`adminOnboarding:${user.id}`, false) ? "/admin" : "/admin/onboarding");
    } else if (user.role === "provider") {
      const provider = await getMyProvider(user.id);
      const documents = provider ? await getDocuments(provider.id) : [];
      router.push(!provider ? "/provider/onboarding" : documents.some((doc) => doc.type === "id_proof") && documents.some((doc) => doc.type === "address_proof") ? "/provider/verification-status" : "/provider/onboarding/documents");
    } else {
      // New family → the onboarding flow builds their profile + first care
      // recipient; a returning family goes straight to the dashboard.
      const family = await getFamilyProfile(user.id);
      router.push(family && !get(`familyOnboarding:${user.id}`, false) ? "/family" : "/family/onboarding");
    }
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4" onClick={handleCancel} role="presentation">
      <div
        className="relative my-auto grid max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-lg border border-border bg-surface md:grid-cols-[0.85fr_1.15fr]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        ref={dialogRef}
        aria-modal="true"
        aria-label="Log in or sign up"
      >
        <button aria-label="Close sign in" onClick={handleCancel} className="absolute right-3 top-3 z-10 flex min-h-tap min-w-tap items-center justify-center rounded-full bg-surface text-text-primary"><X className="h-5 w-5" /></button>
        <div className="relative h-36 md:h-auto"><Image src={`/images/carekin/brand-v2/${role === "provider" ? "caregiver-arrival" : role === "admin" ? "elder-care-checkin" : "family-peace"}.webp`} alt="Illustrative scene of care at home" fill sizes="(max-width: 767px) 100vw, 340px" className="object-cover object-[right_top]" /><span className="absolute bottom-3 left-3 rounded-md bg-ink px-2 py-1 text-xs text-white">Illustrative care scene</span></div>
        <div className="p-6 sm:p-8 md:pt-16">
        <div className="mb-5"><BrandLogo /></div>
        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <h2 className="font-display-latin text-lg font-semibold text-text-primary">Log in / Sign up</h2>

            <div className="flex gap-2">
              <RoleButton label="I need care" active={role === "family"} onClick={() => setRole("family")} />
              <RoleButton label="I provide care" active={role === "provider"} onClick={() => setRole("provider")} />
              <RoleButton label="Admin" active={role === "admin"} onClick={() => setRole("admin")} />
            </div>

            <label className="flex flex-col gap-1 text-sm text-text-secondary">
              Phone number
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                className="min-h-tap rounded-md border border-border bg-surface px-4 text-base text-text-primary placeholder:text-text-secondary"
              />
            </label>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex gap-2">
              <button type="button" onClick={handleCancel} className="min-h-tap flex-1 rounded-md border border-border text-base font-medium text-text-secondary">
                Cancel
              </button>
              <button type="submit" className="min-h-tap flex-1 rounded-md bg-accent text-base font-semibold text-white transition-colors hover:bg-accent-hover">
                Send OTP
              </button>
            </div>

            <button type="button" onClick={handleSkip} className="min-h-tap rounded-md text-sm font-medium text-accent-text transition-colors hover:text-text-primary">
              Skip — explore as a demo {role === "family" ? "family" : role}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-text-primary">Enter the code</h2>
            <p className="-mt-2 text-sm text-text-secondary">Sent to {phone}</p>
            <p className="demo-note rounded-md px-3 py-2 text-xs">Demo mode: enter any 6 digits — no real SMS is sent.</p>

            <label className="flex flex-col gap-1 text-sm text-text-secondary">
              6-digit OTP
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                inputMode="numeric"
                placeholder="123456"
                className="min-h-tap rounded-md border border-border bg-surface px-4 text-center text-lg tracking-widest text-text-primary placeholder:text-text-secondary"
              />
            </label>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex gap-2">
              <button type="button" onClick={handleCancel} className="min-h-tap flex-1 rounded-md border border-border text-base font-medium text-text-secondary">
                Cancel
              </button>
              <button type="submit" disabled={otp.length !== 6} className="min-h-tap flex-1 rounded-md bg-accent text-base font-semibold text-white transition-colors hover:bg-accent-hover">
                Verify
              </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}

function RoleButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-tap flex-1 rounded-full border px-2 text-xs font-medium ${active ? "border-accent bg-accent-tint text-accent-text" : "border-border text-text-secondary"}`}
    >
      {label}
    </button>
  );
}
