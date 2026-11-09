"use client";

import { useState } from "react"
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Copy, ShieldAlert, ShieldOff, Undo2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ThreatAnalysis } from "@/lib/edith-data"

interface ThreatModalProps {
  threat: ThreatAnalysis | null
  isOpen: boolean
  onClose: () => void
  onQuarantine?: () => void
  onRestore?: () => void
}

export function ThreatModal({ threat, isOpen, onClose, onQuarantine, onRestore }: ThreatModalProps) {
  const [showJson, setShowJson] = useState(true)
  const [copied, setCopied] = useState(false)

  if (!isOpen || !threat) return null

  const isHighThreat = threat.threat_level?.toLowerCase() === "high"
  const rawData = threat.rawJson || {
    threat_level: threat.threat_level,
    recommended_action: threat.recommended_action || "suspend_app",
    trust_score_deduction: threat.trust_score_deduction || 40,
    reason_for_user: threat.reason_for_user,
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(rawData, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="threat-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-danger/60 bg-card p-6 shadow-2xl shadow-danger/25 md:p-8">
        {/* Glow accent */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-72 rounded-full bg-danger/20 blur-3xl"
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-danger/20 text-danger ring-1 ring-danger/50 shadow-inner">
            <ShieldAlert className="size-7 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-danger text-white uppercase tracking-wider font-bold">
                {isHighThreat ? "Critical Threat Detected" : "Security Notice"}
              </Badge>
              {threat.targetApp && (
                <Badge variant="outline" className="border-border text-foreground font-mono">
                  Target: {threat.targetApp}
                </Badge>
              )}
            </div>
            <h2 id="threat-modal-title" className="mt-2 text-xl font-bold tracking-tight text-foreground md:text-2xl">
              Gemini AI Threat Detection Assessment
            </h2>
            <p className="mt-1 text-xs text-muted-foreground font-mono">
              E.D.I.T.H. Heuristic Engine &middot; Real-time Anomaly Inspection
            </p>
          </div>
        </div>

        {/* Threat Metric Pills */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
            <span className="text-xs text-muted-foreground">Threat Level</span>
            <p className="mt-1 font-mono text-base font-bold uppercase text-danger">
              {threat.threat_level}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
            <span className="text-xs text-muted-foreground">Trust Deduction</span>
            <p className="mt-1 font-mono text-base font-bold text-danger">
              -{threat.trust_score_deduction || 40} pts
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
            <span className="text-xs text-muted-foreground">Recommendation</span>
            <p className="mt-1 font-mono text-xs font-semibold uppercase text-warning truncate">
              {threat.recommended_action || "suspend_app"}
            </p>
          </div>
        </div>

        {/* Gemini Explanation */}
        <div className="mt-4 rounded-xl border border-danger/30 bg-danger/5 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-danger">
            <AlertTriangle className="size-4 shrink-0" />
            AI Diagnosis for User
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            {threat.reason_for_user}
          </p>
        </div>

        {/* Gemini Exact Structured JSON Viewer */}
        <div className="mt-4 rounded-xl border border-border bg-black/60">
          <button
            type="button"
            onClick={() => setShowJson((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-2 font-mono">
              <span>{`{ }`}</span> Gemini Structured JSON Output
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              {showJson ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </span>
          </button>

          {showJson && (
            <div className="relative border-t border-border/60 p-3">
              <button
                type="button"
                onClick={handleCopy}
                className="absolute right-5 top-5 inline-flex items-center gap-1 rounded bg-muted/80 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
              >
                {copied ? <CheckCircle2 className="size-3 text-success" /> : <Copy className="size-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <pre className="max-h-48 overflow-x-auto overflow-y-auto rounded-lg bg-black/80 p-3 font-mono text-xs text-emerald-400">
                {JSON.stringify(rawData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-border text-foreground hover:bg-muted"
          >
            Acknowledge &amp; Keep Banner
          </Button>

          {onRestore && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onRestore()
                onClose()
              }}
              className="border-success/40 text-success hover:bg-success/15"
            >
              <Undo2 className="size-4 mr-1.5" />
              Restore App
            </Button>
          )}

          {onQuarantine && (
            <Button
              type="button"
              onClick={() => {
                onQuarantine()
                onClose()
              }}
              className="bg-danger text-white hover:bg-danger/85 font-semibold"
            >
              <ShieldOff className="size-4 mr-1.5" />
              Quarantine Immediately
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

