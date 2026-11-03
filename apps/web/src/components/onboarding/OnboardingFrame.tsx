"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { CircleCheck, HeartHandshake } from "lucide-react";
import { StepProgress } from "@/components/ui/StepProgress";

export function OnboardingFrame({ children, steps, step, title, description, image = "hero-family-care" }: {
  children: ReactNode; steps: string[]; step: number; title: string; description: string; image?: string;
}) {
  const contentRef = useRef<HTMLElement>(null);
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    contentRef.current?.scrollIntoView({ block: "start" });
    const heading = contentRef.current?.querySelector("h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, [step]);
  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
      <aside className="flex min-w-0 flex-col overflow-hidden rounded-lg bg-surface-secondary lg:sticky lg:top-24 lg:self-start">
        <div className="relative h-48 sm:h-64 lg:h-80">
          <Image src={`/images/carekin/${image}.webp`} alt="Illustrative scene of everyday care and family life" fill sizes="(max-width: 1023px) 100vw, 45vw" className={`object-cover ${image === "caregiver-arrival" ? "object-top" : "object-center"}`} priority />
          <span className="absolute bottom-3 right-3 rounded-md bg-ink px-2 py-1 text-xs text-white">Illustrative care scene</span>
        </div>
        <div className="p-5 sm:p-7">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent-tint text-accent-text"><HeartHandshake className="h-5 w-5" /></div>
          <h2 className="text-3xl font-bold leading-3xl text-text-primary">{title}</h2>
          <p className="mt-3 text-sm leading-sm text-text-secondary">{description}</p>
          <ol aria-label="Your onboarding journey" className="mt-6 hidden flex-col gap-4 lg:flex">
            {steps.map((label, index) => <li key={label} aria-current={index + 1 === step ? "step" : undefined} className={`flex items-center gap-3 text-sm ${index + 1 === step ? "font-semibold text-text-primary" : "text-text-secondary"}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${index + 1 <= step ? "bg-accent-tint text-accent-text" : "bg-surface"}`}>{index + 1 < step ? <CircleCheck className="h-4 w-4" /> : index + 1}</span>{label}</li>)}
          </ol>
          <div className="mt-6 hidden grid-cols-2 gap-3 lg:grid"><div className="relative h-24 overflow-hidden rounded-md"><Image src="/images/carekin/family-peace.webp" alt="A father and son sharing time together" fill sizes="200px" className="object-cover" /></div><div className="relative h-24 overflow-hidden rounded-md"><Image src="/images/carekin/babysitting-storytime.webp" alt="A sitter reading with a child" fill sizes="200px" className="object-cover" /></div></div>
        </div>
      </aside>
      <section ref={contentRef} className="flex min-w-0 scroll-mt-24 flex-col gap-6 rounded-lg border border-border bg-surface p-5 sm:p-8 lg:p-10">
        <StepProgress step={step} total={steps.length} label={steps[step - 1]} />
        {children}
      </section>
    </main>
  );
}
