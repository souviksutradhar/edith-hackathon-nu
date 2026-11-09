"use client";

import { useState } from "react"
import {
  AlertTriangle,
  Cast,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Layers,
  Loader2,
  PhoneCall,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DeviceTelemetry, RATIncident } from "@/lib/edith-data"
import { cn } from "@/lib/utils"

interface MobileShieldProps {
  telemetry: DeviceTelemetry | null
  isLoading?: boolean
  onSimulateAttack: () => Promise<void> | void
  onResetDevice: () => Promise<void> | void
}

export function MobileShield({
  telemetry,
  isLoading = false,
  onSimulateAttack,
  onResetDevice,
}: MobileShieldProps) {
  const [isSimulating, setIsSimulating] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showJson, setShowJson] = useState(false)
  const [copied, setCopied] = useState(false)

  const score = telemetry?.trust_score ?? 95
  const isCompromised = score < 50 || telemetry?.status?.includes("COMPROMISED")
  const incident: RATIncident | null | undefined = telemetry?.last_incident

  const handleSimulate = async () => {
    try {
      setIsSimulating(true)
      await onSimulateAttack()
    } finally {
      setIsSimulating(false)
    }
  }

  const handleReset = async () => {
    try {
      setIsResetting(true)
      await onResetDevice()
    } finally {
      setIsResetting(false)
    }
  }

  const copyJson = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border border-border bg-card transition-all shadow-lg overflow-hidden">
      {/* Glow accent */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-20 -top-20 size-64 rounded-full blur-3xl transition-opacity",
          isCompromised ? "bg-danger/25 opacity-100" : "bg-primary/10 opacity-60"
        )}
      />

      <CardHeader className="border-b border-border/60 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-all",
                isCompromised
                  ? "bg-danger/20 text-danger ring-danger/40 shadow-lg shadow-danger/20"
                  : "bg-success/20 text-success ring-success/30 shadow-lg shadow-success/10"
              )}
            >
              {isCompromised ? (
                <ShieldAlert className="size-6 animate-pulse" />
              ) : (
                <ShieldCheck className="size-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base md:text-lg font-bold">
                  Mobile Shield: Zero-Trust RAT &amp; Accessibility Defense
                </CardTitle>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono text-[10px] uppercase font-bold",
                    isCompromised ? "border-danger text-danger bg-danger/10" : "border-success/50 text-success bg-success/10"
                  )}
                >
                  {telemetry?.device || "Pixel 7A (Android 14)"}
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Real-time heuristic protection against Remote Access Tools (AnyDesk/RustDesk) + Malicious Fake APKs reading Banking OTPs.
              </CardDescription>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              disabled={isSimulating || isLoading}
              onClick={handleSimulate}
              className="relative overflow-hidden bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold shadow-md shadow-red-900/40 text-xs py-2 px-3.5 transition-all active:scale-[0.98]"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Gemini Evaluating Behavioral Vector...
                </>
              ) : (
                <>
                  <span className="relative flex size-2 mr-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-white" />
                  </span>
                  Simulate APK + AnyDesk Takeover Attack
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isResetting || isLoading}
              onClick={handleReset}
              className="border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60"
            >
              <RotateCcw className={cn("size-3.5 mr-1.5", isResetting && "animate-spin")} />
              Reset Telemetry
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {/* Device Health Gauge & Key Metric Summary */}
        <div className="grid gap-4 md:grid-cols-12 items-center">
          {/* Zero-Trust Device Health Gauge */}
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
                    isCompromised ? "text-danger" : "text-success"
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
                <span className={cn("text-2xl font-extrabold tabular-nums tracking-tight", isCompromised ? "text-danger" : "text-success")}>
                  {score}
                </span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">/100</span>
              </div>
            </div>

            <div className="min-w-0">
              <span className="text-xs font-mono uppercase text-muted-foreground">Zero-Trust Health</span>
              <p className={cn("text-base font-bold tracking-tight", isCompromised ? "text-danger" : "text-success")}>
                {isCompromised ? "COMPROMISED (15/100)" : "SECURE (95/100)"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                {isCompromised
                  ? "Screen mirror active & accessibility hooked to banking screen. Automated mitigation applied."
                  : "All telephony, screen display, and accessibility hooks operating in baseline bounds."}
              </p>
            </div>
          </div>

          {/* Telemetry Status Strip (The 4 Key Behavioral Correlation Flags) */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Flag 1: Telephony State */}
            <div
              className={cn(
                "rounded-xl border p-3 transition-colors",
                telemetry?.telephony_state?.includes("CALL_ACTIVE")
                  ? "border-danger/40 bg-danger/10"
                  : "border-border/70 bg-muted/20"
              )}
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1.5">
                  <PhoneCall className={cn("size-3.5", telemetry?.telephony_state?.includes("CALL_ACTIVE") ? "text-danger animate-pulse" : "text-muted-foreground")} />
                  1. Voice Call State
                </span>
                {telemetry?.telephony_state?.includes("CALL_ACTIVE") && (
                  <Badge className="bg-danger text-white text-[9px] px-1.5 py-0 font-bold uppercase">
                    Offhook Call
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs font-semibold text-foreground truncate">
                {telemetry?.telephony_state || "IDLE (No active voice calls)"}
              </p>
            </div>

            {/* Flag 2: Remote Access / Mirroring */}
            <div
              className={cn(
                "rounded-xl border p-3 transition-colors",
                telemetry?.remote_access_service?.includes("AnyDesk") || telemetry?.remote_access_service?.includes("Active")
                  ? "border-danger/40 bg-danger/10"
                  : "border-border/70 bg-muted/20"
              )}
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1.5">
                  <Cast className={cn("size-3.5", telemetry?.remote_access_service?.includes("AnyDesk") ? "text-danger animate-bounce" : "text-muted-foreground")} />
                  2. Screen Mirroring / RAT
                </span>
                {telemetry?.remote_access_service?.includes("AnyDesk") && (
                  <Badge className="bg-danger text-white text-[9px] px-1.5 py-0 font-bold uppercase">
                    RAT Active
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs font-semibold text-foreground truncate">
                {telemetry?.remote_access_service || "NONE (No active mirroring)"}
              </p>
            </div>

            {/* Flag 3: Accessibility Hook */}
            <div
              className={cn(
                "rounded-xl border p-3 transition-colors",
                telemetry?.accessibility_status?.includes("GRANTED") || telemetry?.accessibility_status?.includes("OBSERVING")
                  ? "border-danger/40 bg-danger/10"
                  : "border-border/70 bg-muted/20"
              )}
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1.5">
                  <Eye className={cn("size-3.5", telemetry?.accessibility_status?.includes("GRANTED") ? "text-danger" : "text-muted-foreground")} />
                  3. Accessibility API Hook
                </span>
                {telemetry?.accessibility_status?.includes("GRANTED") && (
                  <Badge className="bg-danger text-white text-[9px] px-1.5 py-0 font-bold uppercase">
                    API Abused
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs font-semibold text-foreground truncate">
                {telemetry?.accessibility_status || "DEFAULT_SYSTEM_SERVICES_ONLY"}
              </p>
            </div>

            {/* Flag 4: Sensitive Foreground App & Sideloaded APK */}
            <div
              className={cn(
                "rounded-xl border p-3 transition-colors",
                telemetry?.foreground_app?.includes("phonepe") || telemetry?.sideloaded_app?.includes("Bijli")
                  ? "border-warning/40 bg-warning/10"
                  : "border-border/70 bg-muted/20"
              )}
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1.5">
                  <Layers className="size-3.5 text-warning" />
                  4. Foreground App / Sideload
                </span>
                {telemetry?.foreground_app?.includes("phonepe") && (
                  <Badge className="bg-warning text-foreground text-[9px] px-1.5 py-0 font-bold uppercase">
                    Sensitive UPI
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs font-semibold text-foreground truncate">
                {telemetry?.foreground_app || "com.android.launcher"} &middot; {telemetry?.sideloaded_app?.split(" ")[0] || "Play Protect OK"}
              </p>
            </div>
          </div>
        </div>

        {/* Live E.D.I.T.H. AI Incident Response Card (Appears upon Simulated Attack) */}
        {isCompromised && (
          <div className="rounded-xl border border-danger/60 bg-danger/10 p-5 shadow-inner">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-danger/20 text-danger ring-1 ring-danger/40">
                  <Zap className="size-5 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-danger text-white font-bold uppercase tracking-wider text-[10px]">
                      {incident?.ai_response?.threat_level || "CRITICAL"} THREAT DETECTED
                    </Badge>
                    <Badge variant="outline" className="border-danger/40 text-danger font-mono text-[11px]">
                      Attack Vector: {incident?.ai_response?.attack_vector || "REMOTE_ACCESS_TAKEOVER"}
                    </Badge>
                    <Badge variant="outline" className="border-border text-foreground/80 font-mono text-[11px]">
                      Confidence: {incident?.confidence_score || incident?.ai_response?.confidence_score || 98}%
                    </Badge>
                    <Badge variant="outline" className="border-danger/40 text-danger font-mono text-[11px]">
                      Trust Penalty: -80 pts
                    </Badge>
                  </div>

                  <h3 className="mt-2 text-sm md:text-base font-bold text-foreground">
                    Gemini AI Behavioral Diagnosis: Fraud Incident Containment
                  </h3>
                  <p className="mt-1 text-xs md:text-sm text-foreground/85 leading-relaxed">
                    {incident?.incident_summary ||
                      "Active Remote Access session (AnyDesk) detected concurrently with an offhook voice call while a sideloaded APK (Bijli_Bill_Update.apk) exploits Android Accessibility APIs over sensitive UPI payment screen com.phonepe.app."}
                  </p>

                  {/* Automated Zero-Trust Mitigation */}
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 p-2.5 text-xs text-success">
                    <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-success" />
                    <div>
                      <span className="font-bold uppercase tracking-wide">
                        Automated Defense Action Executed:
                      </span>{" "}
                      <span className="font-mono">
                        {incident?.automated_mitigation || "TERMINATE_MIRRORING_AND_REVOKE_ACCESSIBILITY"}
                      </span>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Screen stream forced to FLAG_SECURE (blacked out to AnyDesk); Malicious accessibility hook detached; UPI credentials preserved.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* JSON Toggle */}
              <div className="flex shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowJson((v) => !v)}
                  className="border-border text-xs font-mono"
                >
                  {showJson ? <ChevronUp className="size-3.5 mr-1" /> : <ChevronDown className="size-3.5 mr-1" />}
                  {showJson ? "Hide JSON" : "View Gemini JSON"}
                </Button>
              </div>
            </div>

            {/* Collapsible Gemini JSON Output */}
            {showJson && (
              <div className="relative mt-4 rounded-lg border border-border/70 bg-black/85 p-3.5 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50 text-muted-foreground text-[11px]">
                  <span>Gemini 1.5 Flash Structured Response</span>
                  <button
                    type="button"
                    onClick={() => copyJson(incident?.ai_response || incident)}
                    className="flex items-center gap-1 text-[10px] hover:text-foreground text-muted-foreground"
                  >
                    <Copy className="size-3" />
                    {copied ? "Copied" : "Copy JSON"}
                  </button>
                </div>
                <pre className="overflow-x-auto text-emerald-400 max-h-48">
                  {JSON.stringify(incident?.ai_response || incident, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

