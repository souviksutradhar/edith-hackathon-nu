"use client"

import { CheckCircle2, PauseCircle, ShieldAlert, ShieldOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export type ThreatState = "active" | "suspended" | "revoked"

interface ThreatAlertProps {
  state: ThreatState
  onRevoke: () => void
  onSuspend: () => void
}

export function ThreatAlert({ state, onRevoke, onSuspend }: ThreatAlertProps) {
  if (state === "revoked") {
    return (
      <section
        aria-label="Threat resolved"
        className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4"
      >
        <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />
        <p className="text-sm">
          <span className="font-semibold">Threat contained.</span>{" "}
          <span className="text-muted-foreground">
            All access for Resume Builder has been revoked and the backend was notified.
          </span>
        </p>
      </section>
    )
  }

  const suspended = state === "suspended"

  return (
    <section
      role="alert"
      aria-label="Active threat alert"
      className="relative overflow-hidden rounded-xl border border-danger/50 bg-danger/10 p-5 shadow-[0_0_40px_-12px] shadow-danger/50 md:p-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-danger/20 blur-3xl"
      />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-danger/20 text-danger ring-1 ring-danger/40">
            <ShieldAlert className="size-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                <span className="size-1.5 animate-pulse rounded-full bg-white" />
                Critical
              </span>
              {suspended && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">
                  <PauseCircle className="size-3" aria-hidden="true" />
                  Suspended
                </span>
              )}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-balance md:text-xl">
              Suspicious Activity Detected: Resume Builder
            </h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-pretty text-foreground/80">
              This application initially requested limited access but has requested{" "}
              <strong className="font-semibold text-foreground">&lsquo;Contacts&rsquo;</strong> and{" "}
              <strong className="font-semibold text-foreground">&lsquo;Drive Files&rsquo;</strong> 50 times in the
              last minute. Its Trust Score has dropped from{" "}
              <strong className="font-semibold text-foreground">92</strong> to{" "}
              <strong className="font-semibold text-danger">34</strong>.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            onClick={onRevoke}
            className="bg-danger text-white hover:bg-danger/85 focus-visible:ring-danger/50"
            size="lg"
          >
            <ShieldOff className="size-4" aria-hidden="true" />
            Revoke All Access
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onSuspend}
            disabled={suspended}
            className="border-border bg-background/40 hover:bg-accent"
          >
            <PauseCircle className="size-4" aria-hidden="true" />
            {suspended ? "Suspended" : "Suspend Temporarily"}
          </Button>
        </div>
      </div>
    </section>
  )
}
