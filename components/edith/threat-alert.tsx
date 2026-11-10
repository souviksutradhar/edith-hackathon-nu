"use client";

import { useState } from "react"
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Code2, PauseCircle, ShieldAlert, ShieldCheck, ShieldOff, Undo2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ThreatAnalysis } from "@/lib/edith-data"

export type ThreatState = "active" | "suspended" | "revoked" | "secure"

interface ThreatAlertProps {
  state?: ThreatState
  threat?: ThreatAnalysis | null
  appName?: string
  onRevoke?: () => void
  onSuspend?: () => void
  onQuarantine?: () => void
  onRestore?: () => void
  onOpenModal?: () => void
}

export function ThreatAlert({
  state = "active",
  threat,
  appName = "Resume Builder",
  onRevoke,
  onSuspend,
  onQuarantine,
  onRestore,
  onOpenModal,
}: ThreatAlertProps) {
  const [showJson, setShowJson] = useState(false)

  const isRevoked = state === "revoked"
  const isSuspended = state === "suspended"

  if (isRevoked) {
    return (
      <section
        aria-label="Threat resolved"
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-success/40 bg-success/10 p-4 transition-all"
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />
          <p className="text-sm">
            <span className="font-semibold text-success">Threat Contained.</span>{" "}
            <span className="text-muted-foreground">
              Access for {threat?.targetApp || appName} has been quarantined and high-risk traffic blocked.
            </span>
          </p>
        </div>
        {onRestore && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRestore}
            className="border-success/40 text-success hover:bg-success/20"
          >
            <Undo2 className="size-3.5 mr-1" />
            Restore Application
          </Button>
        )}
      </section>
    )
  }

  // Active threat or incident
  const threatLevel = threat?.threat_level?.toUpperCase() || "HIGH"
  const deduction = threat?.trust_score_deduction || 40
  const explanation =
    threat?.reason_for_user ||
    `This application requested limited scopes initially but attempted anomalous rapid access to Contacts and Drive Files. Trust score was penalized by ${deduction} points.`

  const rawJson = threat?.rawJson || {
    threat_level: threat?.threat_level || "high",
    recommended_action: threat?.recommended_action || "suspend_app",
    trust_score_deduction: deduction,
    reason_for_user: explanation,
  }

  return (
    <section
      role="alert"
      aria-label="Active threat alert"
      className="relative overflow-hidden rounded-[20px] border border-[#D64545]/30 bg-[#FDE8E6]/60 p-5 md:p-6 shadow-none"
    >
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#FDE8E6] text-[#B42318] border border-[#D64545]/30">
            <ShieldAlert className="size-6 animate-pulse text-[#B42318]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B42318] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                <span className="size-1.5 animate-pulse rounded-full bg-white" />
                {threatLevel} Threat Detected
              </span>
              <Badge variant="outline" className="border-[#D64545]/30 text-[#B42318] font-mono text-xs rounded-full">
                -{deduction} Trust Score
              </Badge>
              {isSuspended && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1D6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8A5A00]">
                  <PauseCircle className="size-3" aria-hidden="true" />
                  Suspended
                </span>
              )}
            </div>
            <h2 className="mt-2 text-lg font-bold text-balance md:text-xl text-[#15122B]">
              Gemini Threat Detection: {threat?.targetApp || appName}
            </h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-pretty text-[#5E5A7A]">
              {explanation}
            </p>

            {/* Toggle Structured JSON */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowJson((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#5E5A7A] hover:text-[#15122B] transition-colors"
              >
                <Code2 className="size-3.5" />
                <span>{showJson ? "Hide Gemini Structured JSON" : "View Gemini Structured JSON Analysis"}</span>
                {showJson ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </button>
              {showJson && (
                <pre className="mt-2 max-w-2xl overflow-x-auto rounded-[12px] border border-[#E6E1FA] bg-white p-3 font-mono text-xs text-[#15122B]">
                  {JSON.stringify(rawJson, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {onOpenModal && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenModal}
              className="border-border bg-background/50 hover:bg-accent text-xs"
            >
              Expand AI Report
            </Button>
          )}

          {(onQuarantine || onRevoke) && (
            <Button
              onClick={onQuarantine || onRevoke}
              className="bg-danger text-white hover:bg-danger/85 focus-visible:ring-danger/50"
              size="sm"
            >
              <ShieldOff className="size-3.5 mr-1" aria-hidden="true" />
              Revoke / Quarantine
            </Button>
          )}

          {onRestore && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRestore}
              className="border-success/40 text-success hover:bg-success/15"
            >
              <Undo2 className="size-3.5 mr-1" aria-hidden="true" />
              Restore App
            </Button>
          )}

          {onSuspend && !onRestore && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSuspend}
              disabled={isSuspended}
              className="border-border bg-background/40 hover:bg-accent"
            >
              <PauseCircle className="size-3.5 mr-1" aria-hidden="true" />
              {isSuspended ? "Suspended" : "Suspend"}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
