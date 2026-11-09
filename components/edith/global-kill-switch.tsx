"use client"

import { LockKeyhole, OctagonAlert, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GlobalKillSwitchProps {
  locked: boolean
  onActivate: () => void
  onLift: () => void
}

export function GlobalKillSwitch({ locked, onActivate, onLift }: GlobalKillSwitchProps) {
  return (
    <section
      aria-label="Global security override"
      className="sticky top-[4.5rem] z-20 overflow-hidden rounded-xl border border-danger/60 bg-gradient-to-r from-black via-[oklch(0.17_0.05_25)] to-[oklch(0.24_0.1_25)] p-4 shadow-[0_8px_40px_-12px] shadow-danger/60 md:p-5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -bottom-20 size-56 rounded-full bg-danger/25 blur-3xl"
      />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-danger/20 text-danger ring-1 ring-danger/50">
            {!locked && (
              <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-xl bg-danger/20" />
            )}
            {locked ? (
              <LockKeyhole className="relative size-7" aria-hidden="true" />
            ) : (
              <OctagonAlert className="relative size-7" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-widest text-danger uppercase">
              {locked ? "Lockdown active" : "Global security override"}
            </p>
            <h2 className="text-base font-semibold text-balance text-white md:text-lg">
              {locked
                ? "All third-party access is suspended."
                : "Identity Compromised? Instantly suspend all third-party access."}
            </h2>
            {locked && (
              <p className="text-sm text-white/60">
                Connected apps cannot read your data until you lift the lockdown.
              </p>
            )}
          </div>
        </div>

        {locked ? (
          <Button
            size="lg"
            variant="outline"
            onClick={onLift}
            className="h-11 shrink-0 border-white/20 bg-white/5 px-5 text-white hover:bg-white/10"
          >
            <Unlock className="size-4" aria-hidden="true" />
            Lift Lockdown
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={onActivate}
            className="h-11 shrink-0 bg-danger px-6 text-sm font-bold tracking-wide text-white shadow-lg shadow-danger/40 hover:bg-danger/85 focus-visible:ring-danger/50 md:h-12 md:text-base"
          >
            <LockKeyhole className="size-5" aria-hidden="true" />
            ACTIVATE GLOBAL LOCKDOWN
          </Button>
        )}
      </div>
    </section>
  )
}
