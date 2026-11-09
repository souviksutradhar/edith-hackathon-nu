"use client";

import { useEffect, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Flame,
  HelpCircle,
  Info,
  Loader2,
  Lock,
  Play,
  RotateCcw,
  Scale,
  Shield,
  ShieldAlert,
  ShieldOff,
  Sparkles,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ComplaintDossier, ConnectedApp } from "@/lib/edith-data"
import { cn } from "@/lib/utils"

const RADAR_STAGES = [
  { stage: 1, id: "LURE_RECEIVED", label: "1. Lure Detected", sub: "WhatsApp link" },
  { stage: 2, id: "SIDELOADED_INSTALL", label: "2. Sideload", sub: "Untrusted source" },
  { stage: 3, id: "INTENT_MISMATCH", label: "3. Intent Mismatch", sub: "Accessibility + SMS" },
  { stage: 4, id: "SECOND_STAGE_PAYLOAD", label: "4. 2nd Stage Drop", sub: "DEX payload & hide" },
  { stage: 5, id: "ATTEMPTED_HARVEST", label: "5. Harvest Attempt", sub: "Auto-Freeze Triggered" },
]

interface ScamRadarProps {
  apps: ConnectedApp[]
  currentStage: number
  dossier: ComplaintDossier | null
  hinglishWarning: string
  onStepSimulate: (stage?: number) => Promise<void> | void
  onReset: () => Promise<void> | void
  onOpenDossier: () => void
}

export function ScamRadar({
  apps,
  currentStage,
  dossier,
  hinglishWarning,
  onStepSimulate,
  onReset,
  onOpenDossier,
}: ScamRadarProps) {
  const [isStepping, setIsStepping] = useState(false)
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const targetApp = apps.find((a) => a.name === "RTO Challan QuickPay") || apps[2] || {
    name: "RTO Challan QuickPay",
    trustScore: 88,
    status: "Active",
  }

  const score = targetApp?.trustScore ?? 88
  const isWarning = currentStage >= 3 && currentStage < 5
  const isFrozen = currentStage === 5 || targetApp?.status === "Frozen"

  const handleStep = async () => {
    try {
      setIsStepping(true)
      await onStepSimulate()
    } finally {
      setIsStepping(false)
    }
  }

  const handleAutoRun = async () => {
    try {
      setIsAutoRunning(true)
      for (let s = 1; s <= 5; s++) {
        await onStepSimulate(s)
        await new Promise((res) => setTimeout(res, 1000))
      }
    } finally {
      setIsAutoRunning(false)
    }
  }

  const handleReset = async () => {
    try {
      setIsResetting(true)
      await onReset()
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Card className="border border-border bg-card shadow-xl overflow-hidden">
      {/* Background radial accent */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-24 -top-24 size-80 rounded-full blur-3xl transition-all duration-700",
          isFrozen
            ? "bg-danger/30 opacity-100"
            : isWarning
              ? "bg-warning/25 opacity-80"
              : "bg-primary/10 opacity-50"
        )}
      />

      <CardHeader className="border-b border-border/60 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-all",
                isFrozen
                  ? "bg-danger/25 text-danger ring-danger/50 shadow-lg shadow-danger/25 animate-pulse"
                  : isWarning
                    ? "bg-warning/20 text-warning ring-warning/40 shadow-lg shadow-warning/15"
                    : "bg-primary/15 text-primary ring-primary/30"
              )}
            >
              {isFrozen ? (
                <ShieldAlert className="size-6 animate-pulse" />
              ) : isWarning ? (
                <AlertTriangle className="size-6 text-warning" />
              ) : (
                <Shield className="size-6 text-primary" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base md:text-lg font-bold">
                  Scam Kill-Chain Radar: Indian Mobile APK Fraud Defense
                </CardTitle>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono text-[10px] uppercase font-bold",
                    isFrozen
                      ? "border-danger text-danger bg-danger/10"
                      : isWarning
                        ? "border-warning text-warning bg-warning/10"
                        : "border-primary/40 text-primary bg-primary/10"
                  )}
                >
                  Target: RTO Challan QuickPay.apk
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Explainable heuristic kill-chain detecting WhatsApp fake challans, KYC apk droppers &amp; OTP harvesting before money leaves the bank.
              </CardDescription>
            </div>
          </div>

          {/* Simulation Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isStepping || isAutoRunning || isFrozen}
              onClick={handleStep}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs"
            >
              {isStepping ? (
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
              ) : (
                <Play className="size-3.5 mr-1.5 fill-current" />
              )}
              Simulate Next Kill-Chain Step
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isAutoRunning || isStepping || isFrozen}
              onClick={handleAutoRun}
              className="border-primary/50 text-primary hover:bg-primary/10 font-bold text-xs"
            >
              {isAutoRunning ? (
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
              ) : (
                <Zap className="size-3.5 mr-1.5 text-warning fill-warning" />
              )}
              Quick Run Attack (5s Demo)
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isResetting || isAutoRunning}
              onClick={handleReset}
              className="border-border text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className={cn("size-3.5 mr-1.5", isResetting && "animate-spin")} />
              Reset Environment
            </Button>
          </div>
        </div>

        {/* 5-Stage Kill-Chain Radar Progress Indicator */}
        <div className="mt-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {RADAR_STAGES.map((s) => {
              const isPast = currentStage > s.stage
              const isCurrent = currentStage === s.stage
              const isNeutralized = s.stage === 5 && currentStage === 5

              return (
                <div
                  key={s.id}
                  className={cn(
                    "relative flex flex-col justify-between rounded-xl border p-3 transition-all",
                    isNeutralized
                      ? "border-danger bg-danger/15 ring-2 ring-danger/40 shadow-lg shadow-danger/25"
                      : isCurrent
                        ? s.stage >= 3
                          ? "border-warning bg-warning/15 ring-2 ring-warning/40 shadow-md shadow-warning/20"
                          : "border-primary bg-primary/15 ring-1 ring-primary/40"
                        : isPast
                          ? "border-border/80 bg-muted/40 opacity-80"
                          : "border-border/50 bg-muted/15 opacity-45"
                  )}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold">STAGE 0{s.stage}</span>
                    {isNeutralized ? (
                      <span className="flex size-2 rounded-full bg-danger animate-ping" />
                    ) : isCurrent ? (
                      <span className="flex size-2 rounded-full bg-warning animate-pulse" />
                    ) : isPast ? (
                      <CheckCircle2 className="size-3 text-success" />
                    ) : null}
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-bold leading-tight text-foreground truncate">
                      {s.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{s.sub}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {/* Real-time Trust Score Drop & Telemetry Breakdown */}
        <div className="grid gap-4 md:grid-cols-12 items-center">
          {/* Real-time Trust Score Drop Gauge (88 -> 10) */}
          <div className="md:col-span-4 flex items-center gap-4 rounded-xl border border-border/80 bg-muted/20 p-4">
            <div className="relative flex size-24 shrink-0 items-center justify-center">
              <svg className="size-full -rotate-90 transform" viewBox="0 0 36 36">
                <path
                  className="text-muted/30"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={cn(
                    "transition-all duration-700 ease-out",
                    isFrozen
                      ? "text-danger"
                      : isWarning
                        ? "text-warning"
                        : "text-emerald-500"
                  )}
                  strokeDasharray={`${score}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span
                  className={cn(
                    "text-2xl font-extrabold tabular-nums tracking-tight",
                    isFrozen ? "text-danger" : isWarning ? "text-warning" : "text-emerald-400"
                  )}
                >
                  {score}
                </span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">/100</span>
              </div>
            </div>

            <div className="min-w-0">
              <span className="text-xs font-mono uppercase text-muted-foreground">Radar Trust Metric</span>
              <p
                className={cn(
                  "text-base font-bold tracking-tight",
                  isFrozen ? "text-danger" : isWarning ? "text-warning" : "text-emerald-400"
                )}
              >
                {isFrozen
                  ? "AUTO-FROZEN (10/100)"
                  : isWarning
                    ? `WARNING STATE (${score}/100)`
                    : `BASELINE ACTIVE (${score}/100)`}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                {isFrozen
                  ? "Threshold breached (Trust < 30). Auto-freeze revoked permissions & triggered 1930 incident dossier."
                  : currentStage === 0
                    ? "Normal sandbox behavior. No intent mismatch."
                    : `Stage ${currentStage} active: Additive risk signals accumulated.`}
              </p>
            </div>
          </div>

          {/* Active Risk Signals Matrix */}
          <div className="md:col-span-8 rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground pb-2 border-b border-border/50">
              <span>Deterministic Heuristic Weights (100 - Total Risk)</span>
              <span className="font-semibold text-foreground">
                Active Signals: {targetApp.activeRiskSignals?.length || 0}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(!targetApp.activeRiskSignals || targetApp.activeRiskSignals.length === 0) && (
                <span className="text-xs text-muted-foreground italic">
                  No anomalous risk signals detected. Application operating in declared utility scope.
                </span>
              )}
              {targetApp.activeRiskSignals?.map((signal) => {
                const weights: Record<string, number> = {
                  BRAND_IMPERSONATION: 15,
                  SIDELOADED_CHAT_BROWSER: 25,
                  INTENT_MISMATCH_SMS: 25,
                  INTENT_MISMATCH_ACCESSIBILITY: 35,
                  HIDDEN_SECOND_STAGE_PAYLOAD: 30,
                  CONCEALING_APP_ICON: 20,
                  FIRST_BULK_SMS_OTP_READ: 40,
                }
                const weight = weights[signal] || 20

                return (
                  <Badge
                    key={signal}
                    variant="outline"
                    className="border-danger/40 bg-danger/10 text-danger text-xs font-mono py-1"
                  >
                    <Flame className="size-3 mr-1 text-danger" />
                    +{weight} {signal}
                  </Badge>
                )
              })}
            </div>
          </div>
        </div>

        {/* Incident & Containment Panel (Urgent Hinglish Warning + 1930 Complaint Dossier) */}
        {currentStage >= 3 && (
          <div
            className={cn(
              "rounded-xl border p-4 md:p-5 transition-all",
              isFrozen
                ? "border-danger bg-danger/10 shadow-lg shadow-danger/20"
                : "border-warning bg-warning/10"
            )}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3.5">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    isFrozen ? "bg-danger text-white animate-pulse" : "bg-warning text-foreground"
                  )}
                >
                  {isFrozen ? <Lock className="size-5" /> : <AlertTriangle className="size-5" />}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn("text-xs font-bold uppercase", isFrozen ? "bg-danger text-white" : "bg-warning text-foreground")}>
                      {isFrozen ? "CONTAINMENT: AUTO-FREEZE EXECUTED" : "HEURISTIC WARNING TRIGGERED"}
                    </Badge>
                    <Badge variant="outline" className="border-border text-foreground font-mono text-[11px]">
                      BNS 318(4) &middot; IT Act 66D
                    </Badge>
                  </div>

                  {/* Urgent Plain Hindi/Hinglish Warning */}
                  <div className="mt-2.5 rounded-lg border border-border/80 bg-black/60 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      <Sparkles className="size-3.5" />
                      Gemini Multilingual Victim Warning (Hindi / Hinglish):
                    </div>
                    <p className="mt-1 text-sm md:text-base font-semibold leading-relaxed text-foreground">
                      &ldquo;{hinglishWarning}&rdquo;
                    </p>
                  </div>

                  <p className="mt-2 text-xs text-foreground/85">
                    {targetApp.alert ||
                      "APK permissions have been isolated. Malicious accessibility stream severed to safeguard bank OTPs."}
                  </p>
                </div>
              </div>

              {/* National Cyber Crime Reporting Portal (1930) Button */}
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  onClick={onOpenDossier}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs py-2 px-3.5 shadow-md shadow-primary/30"
                >
                  <Scale className="size-4 mr-1.5" />
                  National Cyber Crime Portal (1930) Dossier
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Discreet Simulator Footnote / Disclaimer */}
        <div className="pt-2 border-t border-border/40 text-center">
          <p className="text-[11px] text-muted-foreground font-mono">
            E.D.I.T.H. Prototype Telemetry Simulator. Production deployment requires Android AppOps / OEM system privilege integration.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

