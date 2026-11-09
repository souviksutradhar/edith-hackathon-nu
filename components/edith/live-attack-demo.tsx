"use client"

import { useState } from "react"
import {
  AlertTriangle,
  ArrowDownToLine,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Cpu,
  ExternalLink,
  Flame,
  Globe,
  Info,
  Layers,
  Loader2,
  Lock,
  Phone,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
  FileText,
  HelpCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useSimulation } from "@/lib/simulation-context"
import { AppProfile, RiskEvaluation } from "@/lib/riskEngine"
import { SmsShieldPanel } from "@/components/edith/sms-shield-panel"
import { ComplaintKitModal } from "@/components/edith/complaint-kit-modal"
import { toast } from "sonner"

// Animated Circular Trust Score Ring (0 to 100)
function TrustRing({ score }: { score: number }) {
  const radius = 24
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  let colorClass = "stroke-emerald-500 text-emerald-400"
  let bgClass = "stroke-emerald-950/40"
  if (score < 40) {
    colorClass = "stroke-rose-500 text-rose-400"
    bgClass = "stroke-rose-950/40"
  } else if (score <= 70) {
    colorClass = "stroke-amber-500 text-amber-400"
    bgClass = "stroke-amber-950/40"
  }

  return (
    <div className="relative flex items-center justify-center size-14 shrink-0">
      <svg className="size-14 -rotate-90 transform" viewBox="0 0 60 60">
        <circle
          cx="30"
          cy="30"
          r={radius}
          className={cn("fill-none stroke-[5px]", bgClass)}
        />
        <circle
          cx="30"
          cy="30"
          r={radius}
          className={cn("fill-none stroke-[5px] transition-all duration-700 ease-out", colorClass)}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className={cn("absolute font-mono text-xs font-bold", colorClass)}>
        {score}
      </span>
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  if (status === "Trusted") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-800 bg-emerald-950/40 text-emerald-400 font-mono text-[10px] px-2 py-0.5 font-bold"
      >
        <span className="size-1.5 rounded-full bg-emerald-400 mr-1.5" />
        Trusted
      </Badge>
    )
  }
  if (status === "Watching") {
    return (
      <Badge
        variant="outline"
        className="border-amber-800 bg-amber-950/40 text-amber-300 font-mono text-[10px] px-2 py-0.5 font-bold"
      >
        <span className="size-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse" />
        Watching
      </Badge>
    )
  }
  if (status === "Suspicious") {
    return (
      <Badge
        variant="outline"
        className="border-rose-800 bg-rose-950/40 text-rose-300 font-mono text-[10px] px-2 py-0.5 font-bold"
      >
        <span className="size-1.5 rounded-full bg-rose-400 mr-1.5 animate-ping" />
        Suspicious
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="border-rose-700 bg-rose-900/60 text-rose-100 font-mono text-[10px] px-2 py-0.5 font-extrabold animate-pulse"
    >
      <ShieldAlert className="size-3 mr-1 text-rose-400" />
      Frozen
    </Badge>
  )
}

function AppCard({
  app,
  evaluation,
  isHighlighted = false,
}: {
  app: AppProfile
  evaluation: RiskEvaluation
  isHighlighted?: boolean
}) {
  const [showBreakdown, setShowBreakdown] = useState(false)
  const isFrozen = evaluation.status === "Frozen"
  const isSuspicious = evaluation.status === "Suspicious"

  return (
    <div
      className={cn(
        "rounded-lg border p-3.5 bg-zinc-950 transition-all duration-300 space-y-2.5",
        isFrozen
          ? "border-rose-600/80 bg-rose-950/15 ring-1 ring-rose-500/30"
          : isSuspicious
          ? "border-amber-600/80 bg-amber-950/10"
          : isHighlighted
          ? "border-cyan-600/60 bg-zinc-900/60"
          : "border-zinc-800/80 hover:border-zinc-700"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <TrustRing score={evaluation.trustScore} />
          <div>
            <h4 className="text-sm font-bold text-zinc-100 leading-tight">{app.name}</h4>
            <p className="text-[11px] font-mono text-zinc-500">{app.packageName}</p>
          </div>
        </div>
        <StatusChip status={evaluation.status} />
      </div>

      {/* Declared Purpose & Source */}
      <div className="text-[11px] font-mono text-zinc-400 space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-zinc-500">Source:</span>
          <span
            className={cn(
              "px-1.5 py-0.2 rounded border text-[10px] font-semibold",
              app.installSource.includes("WhatsApp")
                ? "border-amber-600/60 bg-amber-950/40 text-amber-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-400"
            )}
          >
            {app.installSource}
          </span>
        </div>
        <p className="text-zinc-500 text-[10px]">
          Declared Purpose: <span className="text-zinc-300">{app.declaredPurpose}</span>
        </p>
      </div>

      {/* Permissions Chips */}
      <div className="space-y-1">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
          Runtime Permissions:
        </span>
        <div className="flex flex-wrap gap-1">
          {app.grantedPermissions.map((p, idx) => {
            const isRevoked = p.startsWith("Revoked:")
            const isRisky = p.includes("SMS") || p.includes("Accessibility") || p.includes("Install")
            return (
              <span
                key={idx}
                className={cn(
                  "text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors",
                  isRevoked
                    ? "border-rose-900/80 bg-rose-950/50 text-rose-400 line-through font-bold"
                    : isRisky
                    ? "border-amber-700/60 bg-amber-950/40 text-amber-300 font-semibold"
                    : "border-zinc-800 bg-zinc-900 text-zinc-300"
                )}
              >
                {p}
              </span>
            )
          })}
        </div>
      </div>

      {/* "Why this score" Expandable Breakdown */}
      <div className="border-t border-zinc-900 pt-2 font-mono">
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-between text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors py-0.5"
        >
          <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
            <Info className="size-3" />
            Why this score? ({evaluation.appliedRules.length} rule{evaluation.appliedRules.length === 1 ? "" : "s"} fired)
          </span>
          <span className="flex items-center gap-1 text-[10px] text-zinc-500">
            {showBreakdown ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </span>
        </button>

        {showBreakdown && (
          <div className="mt-2 space-y-1.5 text-[10px] bg-black/60 p-2.5 rounded border border-zinc-800">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800 text-zinc-400">
              <span>Risk Points Incurred:</span>
              <span className="font-bold text-rose-400">+{evaluation.totalRisk} pts</span>
            </div>
            {evaluation.appliedRules.length === 0 ? (
              <p className="text-emerald-400 pt-1">
                Zero anomaly rules triggered. App is behaving strictly within its declared profile.
              </p>
            ) : (
              evaluation.appliedRules.map((r, i) => (
                <div key={i} className="flex items-start justify-between gap-2 py-0.5 text-zinc-300">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-zinc-200 block">&bull; {r.name}</span>
                    <span className="text-zinc-500 text-[9px] block pl-2">{r.reason}</span>
                  </div>
                  <span className="font-bold text-amber-400 shrink-0">+{r.points}</span>
                </div>
              ))
            )}
            <div className="pt-1.5 border-t border-zinc-800 text-[10px] text-zinc-400 flex items-center justify-between">
              <span>Trust Formula:</span>
              <span className="text-zinc-200 font-bold">100 - {evaluation.totalRisk} = {evaluation.trustScore}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 5-Stage Kill-Chain Stepper
const KILL_CHAIN_STEPS = [
  { step: 1, label: "Lure received" },
  { step: 2, label: "Installed from unknown source" },
  { step: 3, label: "Risky permissions requested" },
  { step: 4, label: "Hidden behaviour detected" },
  { step: 5, label: "Contained" },
]

export function LiveAttackDemo() {
  const {
    isRunning,
    isCompleted,
    currentStep,
    apps,
    evaluations,
    events,
    evidenceHash,
    activeLure,
    runSimulation,
    resetSimulation,
    triggerManualEvent,
  } = useSimulation()

  const [copiedSummary, setCopiedSummary] = useState(false)
  const [showScenarioControls, setShowScenarioControls] = useState(false)
  const [showComplaintKit, setShowComplaintKit] = useState(false)
  const [guideOpen, setGuideOpen] = useState(true)

  const handleCopySummary = () => {
    const summary = `E.D.I.T.H. INCIDENT EVIDENCE DOSSIER
Incident ID: EDITH-INC-2026-8941
Target Malicious Package: com.rto.echallan.quickpay (RTO Challan QuickPay)
Source: WhatsApp file sideload (Not verified by Google Play Store)
Evidence Timeline:
- 17:05:02: Application sideloaded via WhatsApp message link.
- 17:05:06: Declared utility intent mismatch; requested READ_SMS, BIND_ACCESSIBILITY_SERVICE, REQUEST_INSTALL_PACKAGES.
- 17:05:10: Mass SMS harvest: Read 212 SMS in 4 seconds (Device baseline: 0). Attempted 2FA OTP exfiltration.
- 17:05:14: Auto-containment enforced by E.D.I.T.H. Kernel Shield. Process isolated, sensitive scopes revoked.
Evidence SHA-256 Hash: ${evidenceHash}
Statutory Mapping: BNS § 318(4) (Cheating by Personation), IT Act 2000 § 66D.
Prepared for filing at cybercrime.gov.in / National Cyber Helpline 1930.`

    navigator.clipboard.writeText(summary)
    setCopiedSummary(true)
    toast.success("Incident summary copied to clipboard for filing on cybercrime.gov.in")
    setTimeout(() => setCopiedSummary(false), 2500)
  }

  const rtoEvaluation = evaluations["app-rto"] || {
    totalRisk: 0,
    trustScore: 100,
    status: "Trusted",
    appliedRules: [],
    isContained: false,
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold tracking-tight text-zinc-100">
              Live Attack Demo
            </h1>
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono text-[10px] px-2.5 py-0.5 font-bold"
            >
              SIMULATED DEVICE &middot; NO LOGIN &middot; NO DATA COLLECTED
            </Badge>
          </div>
          <p className="text-sm text-zinc-400 font-medium">
            Scam apps behave normally until they don&apos;t. E.D.I.T.H. watches what apps do after install.
          </p>
        </div>

        {/* Primary Simulation Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            onClick={() => setShowScenarioControls(!showScenarioControls)}
            variant="outline"
            className={cn(
              "border-zinc-800 text-zinc-300 font-mono text-xs font-semibold h-9 px-3 transition-colors",
              showScenarioControls ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-900 hover:bg-zinc-800"
            )}
          >
            <Layers className="mr-1.5 size-3.5 text-cyan-400" />
            Scenario Controls
          </Button>

          <Button
            type="button"
            onClick={resetSimulation}
            variant="outline"
            className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs font-semibold h-9 px-3.5"
          >
            <RotateCcw className="mr-1.5 size-3.5 text-zinc-400" />
            Reset
          </Button>

          <Button
            type="button"
            onClick={() => runSimulation()}
            disabled={isRunning}
            className={cn(
              "font-mono text-xs font-bold h-9 px-4 transition-all shadow-md",
              isRunning
                ? "bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500 text-zinc-950 border border-emerald-500/80"
            )}
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 size-3.5 animate-spin text-emerald-400" />
                Simulating Attack (Step {currentStep}/5)...
              </>
            ) : (
              <>
                <Play className="mr-2 size-3.5 fill-current" />
                Run Attack Simulation
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Collapsible Demo Guide Card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => setGuideOpen(!guideOpen)}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-zinc-900/50 hover:bg-zinc-900 transition-colors text-left"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <HelpCircle className="size-3.5 text-cyan-400" />
            <span>Demo guide: What to click</span>
          </div>
          {guideOpen ? (
            <ChevronUp className="size-4 text-zinc-400" />
          ) : (
            <ChevronDown className="size-4 text-zinc-400" />
          )}
        </button>

        {guideOpen && (
          <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-zinc-800/80 bg-zinc-950/40">
            <div className="flex items-start gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-950/80 border border-cyan-700/60 text-[11px] font-bold text-cyan-300 font-mono">
                1
              </span>
              <span className="text-xs text-zinc-300 leading-relaxed">
                Click &quot;Run Attack Simulation&quot; (or select a sample SMS from Virtual Phone on the left).
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-950/80 border border-cyan-700/60 text-[11px] font-bold text-cyan-300 font-mono">
                2
              </span>
              <span className="text-xs text-zinc-300 leading-relaxed">
                Watch the kill-chain advance until E.D.I.T.H. auto-freezes the rogue app before OTP theft.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-950/80 border border-cyan-700/60 text-[11px] font-bold text-cyan-300 font-mono">
                3
              </span>
              <span className="text-xs text-zinc-300 leading-relaxed">
                Click &quot;Generate Complaint Kit&quot; in the green prompt to view your ready-to-file 1930 cyber report.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Manual Scenario Controls Drawer (for interactive judge testing) */}
      {showScenarioControls && (
        <div className="rounded-lg border border-cyan-800/60 bg-cyan-950/20 p-4 space-y-3 font-mono animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-cyan-800/40 pb-2">
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-cyan-400" />
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                Judge Interactive Scenario Controls
              </span>
            </div>
            <span className="text-[10px] text-zinc-400">
              Fire single isolated events to observe dynamic rule derivation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => triggerManualEvent("app-rto", "INSTALL_WHATSAPP")}
              className="h-8 text-[11px] justify-start border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300"
            >
              + WhatsApp Install (+25 pts)
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => triggerManualEvent("app-rto", "GRANT_SMS")}
              className="h-8 text-[11px] justify-start border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-amber-300"
            >
              + Request SMS Read (+30 pts)
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => triggerManualEvent("app-rto", "GRANT_ACCESSIBILITY")}
              className="h-8 text-[11px] justify-start border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-amber-300"
            >
              + Accessibility Service (+30 pts)
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => triggerManualEvent("app-rto", "GRANT_INSTALL_PACKAGES")}
              className="h-8 text-[11px] justify-start border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-amber-300"
            >
              + Install Packages (+20 pts)
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => triggerManualEvent("app-rto", "BULK_SMS_READ")}
              className="h-8 text-[11px] justify-start border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-rose-300"
            >
              + Read 212 SMS in 4s (+25 pts)
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => triggerManualEvent("app-rto", "HIDE_ICON")}
              className="h-8 text-[11px] justify-start border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-rose-300"
            >
              + Hide Launcher Icon (+20 pts)
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => triggerManualEvent("app-rto", "CONTACT_NEW_DOMAIN")}
              className="h-8 text-[11px] justify-start border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-cyan-300"
            >
              + Contact New Domain (+10 pts)
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => triggerManualEvent("app-rto", "RESTORE_APP")}
              className="h-8 text-[11px] justify-start border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400"
            >
              Reset RTO to Baseline
            </Button>
          </div>
        </div>
      )}

      {/* Section 1: Virtual Phone: SMS Shield (Client-side Ingress Heuristics) */}
      <SmsShieldPanel />

      {/* Section 2: Main 3-Column Command Canvas (Kill-Chain Stepper, Apps, Event Feed) */}
      <div id="kill-chain-tracker" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start scroll-mt-6">
        {/* Left Column: 4 App Containers (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Monitored Apps (Device Sandbox)
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              {apps.length} Containers
            </span>
          </div>

          {apps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              evaluation={
                evaluations[app.id] || {
                  totalRisk: 0,
                  trustScore: 100,
                  status: "Trusted",
                  appliedRules: [],
                  isContained: false,
                }
              }
              isHighlighted={app.id === "app-rto" && currentStep > 0}
            />
          ))}
        </div>

        {/* Middle Column: Stepper & Escalating Stages (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Horizontal Kill-Chain Stepper */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                Kill-Chain Stage Tracker
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                {currentStep === 0 && "Step 0: Baseline Normal"}
                {currentStep === 1 && "Stage 1: Lure Ingress"}
                {currentStep === 2 && "Stage 2: Permission Escalation"}
                {currentStep === 3 && "Stage 3: Data Exfiltration"}
                {currentStep >= 4 && "Stage 4: Autonomous Containment"}
              </span>
            </div>

            {/* 5 Stages Stepper */}
            <div className="grid grid-cols-5 gap-1.5">
              {KILL_CHAIN_STEPS.map((s) => {
                const isPassed = currentStep > s.step
                const isCurrent = currentStep === s.step
                return (
                  <div
                    key={s.step}
                    className={cn(
                      "rounded p-2 text-center transition-all border flex flex-col items-center justify-center gap-1",
                      isCurrent
                        ? "border-rose-500 bg-rose-950/50 text-rose-200 ring-1 ring-rose-500/50 animate-pulse"
                        : isPassed
                        ? "border-emerald-800 bg-emerald-950/30 text-emerald-300"
                        : "border-zinc-800/80 bg-zinc-900/40 text-zinc-500"
                    )}
                  >
                    <div className="size-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold">
                      {isPassed ? (
                        <Check className="size-3 text-emerald-400 stroke-[3]" />
                      ) : (
                        <span>{s.step}</span>
                      )}
                    </div>
                    <span className="text-[9px] font-mono leading-tight line-clamp-2">
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step 0 Idle State Prompt */}
          {currentStep === 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6 text-center space-y-3">
              <div className="size-10 rounded-full bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-200">Device in Secure Baseline</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Click <strong className="text-emerald-400">Run Attack Simulation</strong> to watch a simulated scam app arrive from WhatsApp, escalate silently, and get contained before stealing OTPs.
                </p>
              </div>
            </div>
          )}

          {/* Step 2 Dynamic Panel: Intent Mismatch */}
          {currentStep === 2 && (
            <div className="rounded-lg border border-amber-600/70 bg-amber-950/30 p-4 space-y-2 animate-in fade-in-50 duration-300">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertTriangle className="size-4 shrink-0 text-amber-400" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider">
                  Intent Mismatch Flagged by Rule Engine
                </h4>
              </div>
              <div className="text-xs font-mono text-zinc-200 leading-relaxed bg-black/40 p-3 rounded border border-amber-800/40 space-y-1">
                <p>
                  <strong className="text-zinc-400">Expected for a challan viewer:</strong>{" "}
                  <span className="text-emerald-400 font-bold">Internet only.</span>
                </p>
                <p>
                  <strong className="text-zinc-400">Requested:</strong>{" "}
                  <span className="text-rose-400 font-bold">SMS Read (+30), Accessibility (+30), Install packages (+20).</span>
                </p>
              </div>
              <p className="text-[11px] text-amber-400/90 font-mono">
                E.D.I.T.H. placed RTO Challan into active surveillance sandbox (Trust: 35).
              </p>
            </div>
          )}

          {/* Step 3 Dynamic Panel: Mass SMS Burst Warning */}
          {currentStep === 3 && (
            <div className="rounded-lg border border-rose-600/80 bg-rose-950/40 p-4 space-y-2 animate-in fade-in-50 duration-300">
              <div className="flex items-center gap-2 text-rose-300">
                <ShieldAlert className="size-4 shrink-0 text-rose-400 animate-pulse" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider">
                  Mass SMS Harvest Anomaly Detected
                </h4>
              </div>
              <div className="text-xs font-mono text-zinc-200 leading-relaxed bg-black/50 p-3 rounded border border-rose-800/60 space-y-1.5">
                <p className="text-rose-300 font-bold">
                  App read 212 SMS in 4 seconds (device baseline: 0 queries/min).
                </p>
                <p className="text-zinc-400 text-[11px]">
                  Target pattern: Searching for bank verification tokens, OTPs, and card expiry strings.
                </p>
              </div>
            </div>
          )}

          {/* Step 4 & 5: Big Red Bilingual Auto-Containment Banner */}
          {currentStep >= 4 && (
            <div className="rounded-lg border-2 border-rose-600 bg-rose-950/80 p-5 space-y-3 shadow-xl animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <ShieldAlert className="size-5" />
                </div>
                <div>
                  <Badge variant="destructive" className="font-mono text-[10px] tracking-wider font-extrabold uppercase">
                    AUTONOMOUS KILL-SWITCH FIRED (RISK &ge; 70)
                  </Badge>
                  <h3 className="text-xs font-mono text-zinc-200 font-semibold mt-0.5">
                    Zero-Trust Quarantine Enforced
                  </h3>
                </div>
              </div>

              {/* Plain English Threat Containment Alert Message */}
              <div className="bg-black/60 rounded p-4 border border-rose-500/40 space-y-1">
                <p className="text-sm font-bold text-rose-100 leading-snug">
                  This app attempted to access your SMS and authentication codes without permission.
                </p>
                <p className="text-xs font-medium text-rose-200/90 leading-relaxed">
                  E.D.I.T.H. stopped it before any one-time password could be stolen. Never share your OTP or PIN with anyone.
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-rose-300/80 px-1">
                <span>Process Isolated</span>
                <span>Permissions Revoked</span>
                <span>OTP Loss: 0</span>
              </div>

              {/* Trigger Complaint Kit from Red Banner */}
              <div className="pt-2 border-t border-rose-800/60 flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowComplaintKit(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs h-8 px-3 shadow-md flex items-center gap-1.5"
                >
                  <FileText className="size-3.5" />
                  <span>Generate Complaint Kit</span>
                </Button>
                <span className="text-[10px] text-rose-200/80">
                  Prepares Section 63 BSA draft
                </span>
              </div>
            </div>
          )}

          {/* Step 5: Complaint Evidence Packet Card */}
          {currentStep === 5 && (
            <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-4 space-y-3.5 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-mono font-bold text-zinc-200 uppercase">
                    Complaint Evidence Packet
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">ID: EDITH-INC-2026-8941</span>
              </div>

              <div className="space-y-1.5 text-xs font-mono text-zinc-300 bg-zinc-900/60 p-3 rounded border border-zinc-800">
                <p className="text-zinc-400">
                  <strong className="text-zinc-200">Incident Timeline:</strong>
                </p>
                <ul className="text-[11px] space-y-1 text-zinc-400 pl-2">
                  <li>&bull; 17:05:02 — Installed from WhatsApp file (+25 pts)</li>
                  <li>&bull; 17:05:06 — Unexplained SMS &amp; Accessibility requested (+80 pts)</li>
                  <li>&bull; 17:05:10 — 212 SMS read burst in 4s (baseline: 0) (+25 pts)</li>
                  <li>&bull; 17:05:14 — Auto-containment: permissions frozen before OTP stolen</li>
                </ul>
                <div className="pt-2 border-t border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block">SHA-256 Evidence Seal (Browser Computed):</span>
                  <p className="text-[10px] font-mono text-emerald-400 break-all select-all">
                    {evidenceHash}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Copy Summary, Open cybercrime, Call 1930 */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowComplaintKit(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-bold h-8 px-3 shadow-sm flex items-center gap-1.5"
                >
                  <FileText className="size-3.5" />
                  <span>Generate Complaint Kit</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopySummary}
                  className="bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-bold h-8 px-3"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="mr-1.5 size-3.5 text-emerald-600" />
                      Summary Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 size-3.5" />
                      Copy summary
                    </>
                  )}
                </Button>

                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-mono text-xs font-medium transition-colors"
                >
                  <Globe className="size-3.5 text-cyan-400" />
                  Open cybercrime.gov.in
                  <ExternalLink className="size-3 text-zinc-500" />
                </a>

                <a
                  href="tel:1930"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded border border-rose-800 bg-rose-950/60 hover:bg-rose-900 text-rose-200 font-mono text-xs font-medium transition-colors"
                >
                  <Phone className="size-3.5 text-rose-400" />
                  Call 1930
                </a>
              </div>

              <p className="text-[11px] font-mono text-zinc-500 italic">
                These are links only; nothing is sent automatically.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Live Event Feed (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                Live Event Feed
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              {events.length} events
            </span>
          </div>

          {events.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center text-xs font-mono text-zinc-500">
              Run the simulation to see activity
            </div>
          ) : (
            <div className="space-y-2 max-h-[640px] overflow-y-auto scrollbar-thin pr-1">
              {events.map((evt) => {
                const isCritical = evt.severity === "critical"
                const isWarning = evt.severity === "warning"
                const isSuccess = evt.severity === "success"
                return (
                  <div
                    key={evt.id}
                    className={cn(
                      "rounded border p-2.5 space-y-1 font-mono text-xs transition-all",
                      isCritical
                        ? "border-rose-800/80 bg-rose-950/20 text-rose-200"
                        : isWarning
                        ? "border-amber-800/60 bg-amber-950/20 text-amber-200"
                        : isSuccess
                        ? "border-emerald-800/60 bg-emerald-950/20 text-emerald-200"
                        : "border-zinc-800/80 bg-zinc-900/40 text-zinc-300"
                    )}
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="size-2.5 text-zinc-500" />
                        {evt.timestamp}
                      </span>
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded font-bold text-[9px] uppercase",
                          isCritical
                            ? "bg-rose-900/60 text-rose-300"
                            : isWarning
                            ? "bg-amber-900/60 text-amber-300"
                            : isSuccess
                            ? "bg-emerald-900/60 text-emerald-300"
                            : "bg-zinc-800 text-zinc-400"
                        )}
                      >
                        {evt.action}
                      </span>
                    </div>

                    <p className="font-semibold text-zinc-100 text-[11px] leading-tight">
                      {evt.app}
                    </p>

                    <p className="text-[11px] text-zinc-400 leading-snug break-words">
                      {evt.details}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Demo Guide Card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => setGuideOpen(!guideOpen)}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-zinc-900/50 hover:bg-zinc-900 transition-colors text-left"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <HelpCircle className="size-3.5 text-cyan-400" />
            <span>Demo guide: What to click</span>
          </div>
          {guideOpen ? (
            <ChevronUp className="size-4 text-zinc-400" />
          ) : (
            <ChevronDown className="size-4 text-zinc-400" />
          )}
        </button>

        {guideOpen && (
          <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-zinc-800/80 bg-zinc-950/40">
            <div className="flex items-start gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-950/80 border border-cyan-700/60 text-[11px] font-bold text-cyan-300 font-mono">
                1
              </span>
              <span className="text-xs text-zinc-300 leading-relaxed">
                Click &quot;Run Attack Simulation&quot; (or select a sample SMS from Virtual Phone on the left).
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-950/80 border border-cyan-700/60 text-[11px] font-bold text-cyan-300 font-mono">
                2
              </span>
              <span className="text-xs text-zinc-300 leading-relaxed">
                Watch the kill-chain advance until E.D.I.T.H. auto-freezes the rogue app before OTP theft.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-950/80 border border-cyan-700/60 text-[11px] font-bold text-cyan-300 font-mono">
                3
              </span>
              <span className="text-xs text-zinc-300 leading-relaxed">
                Click &quot;Generate Complaint Kit&quot; in the green prompt to view your ready-to-file 1930 cyber report.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Part F: Real-World Path Card ("How this works on a real phone") */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/90 p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
          <Smartphone className="size-4 text-emerald-400" />
          <h3 className="font-bold text-zinc-200 uppercase tracking-wide">
            How this works on a real phone
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-zinc-300">
          <div className="space-y-1.5 rounded border border-zinc-800/80 bg-zinc-900/40 p-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-600 bg-emerald-950/40 text-emerald-400 text-[10px]">
                Phase 1
              </Badge>
              <strong className="text-zinc-100">Works today (no special access needed)</strong>
            </div>
            <p className="text-zinc-400 text-[11px]">
              A normal Android companion app reads each installed APK&apos;s declared permissions, install source (Play Store vs sideloaded), and permission changes after updates, then runs this rule engine to flag intent mismatches and warn the user.
            </p>
          </div>

          <div className="space-y-1.5 rounded border border-zinc-800/80 bg-zinc-900/40 p-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-cyan-600 bg-cyan-950/40 text-cyan-400 text-[10px]">
                Phase 2
              </Badge>
              <strong className="text-zinc-100">Needs OS-level integration</strong>
            </div>
            <p className="text-zinc-400 text-[11px]">
              Integrated with Google Play Protect, OEM phone makers (Samsung Knox / Xiaomi MIUI), or MDM programs for real-time monitoring of actual access (e.g. bulk SMS read bursts) and automated kernel-level freezing.
            </p>
          </div>
        </div>

        <p className="text-[11px] text-zinc-500 italic pt-1 border-t border-zinc-800/60">
          This prototype simulates the device and shows what both phases would do.
        </p>
      </div>

      {/* Cyber Fraud Complaint Kit Modal */}
      <ComplaintKitModal
        isOpen={showComplaintKit}
        onClose={() => setShowComplaintKit(false)}
        initialSender={activeLure?.sender || "+91 98321 00000"}
        initialMessage={
          activeLure?.message ||
          "Pending e-challan Rs 500. Pay now to avoid legal action: http://parivahan-echallan.top/RTO_Challan.apk install the app"
        }
        initialFindings={[
          { title: "Installed from WhatsApp / Sideload", points: 25 },
          { title: "Impersonates State / Institutional Brand", points: 10 },
          { title: "Unexpected SMS Access Scope", points: 30 },
          { title: "Unexpected Accessibility Service Hook", points: 30 },
          { title: "Bulk SMS Harvest Anomaly (212 read in 4s)", points: 25 },
        ]}
        initialScore={100}
        initialDefangedUrls={["hxxp://parivahan-echallan[.]top/RTO_Challan.apk"]}
        initialHasApk={true}
        initialApkName="com.rto.echallan.quickpay (RTO Challan QuickPay)"
        sourceContext="kill-chain"
      />
    </div>
  )
}
