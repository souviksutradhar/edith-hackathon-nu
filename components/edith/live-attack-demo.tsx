"use client"

import { useState } from "react"
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
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

  let progressColor = "#1E9E6A"
  let textColor = "text-[#12704A]"
  if (score < 40) {
    progressColor = "#D64545"
    textColor = "text-[#B42318]"
  } else if (score <= 70) {
    progressColor = "#D99A1E"
    textColor = "text-[#8A5A00]"
  }

  return (
    <div className="relative flex items-center justify-center size-14 shrink-0">
      <svg className="size-14 -rotate-90 transform" viewBox="0 0 60 60">
        <circle
          cx="30"
          cy="30"
          r={radius}
          className="fill-none stroke-[#E9E5FB] stroke-[5px]"
        />
        <circle
          cx="30"
          cy="30"
          r={radius}
          className="fill-none stroke-[5px] transition-all duration-700 ease-out"
          stroke={progressColor}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className={cn("absolute font-mono text-xs font-bold", textColor)}>
        {score}
      </span>
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  if (status === "Trusted") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E3F6EE] text-[#12704A] border border-[#1E9E6A]/20 px-2.5 py-0.5 text-xs font-semibold">
        <span className="size-1.5 rounded-full bg-[#1E9E6A]" />
        Trusted
      </span>
    )
  }
  if (status === "Watching") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1D6] text-[#8A5A00] border border-[#D99A1E]/20 px-2.5 py-0.5 text-xs font-semibold">
        <span className="size-1.5 rounded-full bg-[#D99A1E] animate-pulse" />
        Watching
      </span>
    )
  }
  if (status === "Suspicious") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDE8E6] text-[#B42318] border border-[#D64545]/20 px-2.5 py-0.5 text-xs font-bold">
        <span className="size-1.5 rounded-full bg-[#D64545] animate-ping" />
        Suspicious
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDE8E6] text-[#B42318] border border-[#D64545]/30 px-2.5 py-0.5 text-xs font-extrabold animate-pulse">
      <ShieldAlert className="size-3 text-[#D64545]" />
      Frozen
    </span>
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
        "rounded-[20px] border p-5 bg-white transition-all duration-300 space-y-3",
        isFrozen
          ? "border-[#D64545] bg-[#FDE8E6]/20 ring-1 ring-[#D64545]/30"
          : isSuspicious
          ? "border-[#D99A1E] bg-[#FFF1D6]/20"
          : isHighlighted
          ? "border-[#5B35F5] ring-1 ring-[#5B35F5]/30"
          : "border-[#E6E1FA] hover:border-[#5B35F5]/40"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <TrustRing score={evaluation.trustScore} />
          <div>
            <h4 className="text-base font-bold text-[#15122B] leading-tight">{app.name}</h4>
            <p className="text-xs font-mono text-[#5E5A7A]">{app.packageName}</p>
          </div>
        </div>
        <StatusChip status={evaluation.status} />
      </div>

      {/* Declared Purpose & Source */}
      <div className="text-xs text-[#5E5A7A] space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>Source:</span>
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full border text-[11px] font-semibold",
              app.installSource.includes("WhatsApp")
                ? "border-[#D99A1E]/30 bg-[#FFF1D6] text-[#8A5A00]"
                : "border-[#E6E1FA] bg-[#F9F8FF] text-[#5E5A7A]"
            )}
          >
            {app.installSource}
          </span>
        </div>
        <p className="text-[11px]">
          Declared Purpose: <span className="text-[#15122B] font-medium">{app.declaredPurpose}</span>
        </p>
      </div>

      {/* Permissions Chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-[#5E5A7A] uppercase tracking-wider block">
          Runtime Permissions:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {app.grantedPermissions.map((p, idx) => {
            const isRevoked = p.startsWith("Revoked:")
            const isRisky = p.includes("SMS") || p.includes("Accessibility") || p.includes("Install")
            return (
              <span
                key={idx}
                className={cn(
                  "text-[11px] px-2.5 py-0.5 rounded-full border transition-colors",
                  isRevoked
                    ? "border-[#D64545]/30 bg-[#FDE8E6] text-[#B42318] line-through font-bold"
                    : isRisky
                    ? "border-[#D99A1E]/30 bg-[#FFF1D6] text-[#8A5A00] font-semibold"
                    : "border-[#E6E1FA] bg-[#F9F8FF] text-[#5E5A7A]"
                )}
              >
                {p}
              </span>
            )
          })}
        </div>
      </div>

      {/* "Why this score" Expandable Breakdown */}
      <div className="border-t border-[#EEEAFB] pt-2.5">
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-between text-xs text-[#5E5A7A] hover:text-[#5B35F5] transition-colors py-0.5 cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-semibold text-[#5B35F5]">
            <Info className="size-3.5" />
            Why this score? ({evaluation.appliedRules.length} rule{evaluation.appliedRules.length === 1 ? "" : "s"} fired)
          </span>
          <span className="flex items-center gap-1 text-xs text-[#5E5A7A]">
            {showBreakdown ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </span>
        </button>

        {showBreakdown && (
          <div className="mt-2.5 space-y-2 text-xs bg-[#F9F8FF] p-3.5 rounded-[14px] border border-[#E6E1FA]">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#EEEAFB] text-[#5E5A7A]">
              <span>Risk Points Incurred:</span>
              <span className="font-bold text-[#B42318]">+{evaluation.totalRisk} pts</span>
            </div>
            {evaluation.appliedRules.length === 0 ? (
              <p className="text-[#12704A] pt-1 font-medium">
                Zero anomaly rules triggered. App is behaving strictly within its declared profile.
              </p>
            ) : (
              evaluation.appliedRules.map((r, i) => (
                <div key={i} className="flex items-start justify-between gap-2 py-0.5 text-[#15122B]">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-[#15122B] block">&bull; {r.name}</span>
                    <span className="text-[#5E5A7A] text-[11px] block pl-2">{r.reason}</span>
                  </div>
                  <span className="font-bold text-[#D99A1E] shrink-0">+{r.points}</span>
                </div>
              ))
            )}
            <div className="pt-2 border-t border-[#EEEAFB] text-xs text-[#5E5A7A] flex items-center justify-between">
              <span>Trust Formula:</span>
              <span className="text-[#15122B] font-bold">100 - {evaluation.totalRisk} = {evaluation.trustScore}</span>
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#E6E1FA] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-[32px] sm:text-[36px] font-extrabold tracking-[-0.02em] text-[#15122B] leading-tight">
              Live Attack Demo
            </h1>
            <span className="rounded-full bg-[#ECE8FF] text-[#5B35F5] border border-[#5B35F5]/20 text-xs px-3 py-1 font-semibold">
              Simulated device
            </span>
          </div>
          <p className="text-[15px] text-[#5E5A7A] font-medium leading-relaxed">
            Scam apps behave normally until they don&apos;t. E.D.I.T.H. watches what apps do after install.
          </p>
        </div>

        {/* Primary Simulation Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="button"
            onClick={() => setShowScenarioControls(!showScenarioControls)}
            variant="outline"
            className={cn(
              "rounded-full border border-[#E6E1FA] bg-white text-[#5B35F5] text-xs font-semibold h-10 px-4 transition-all",
              showScenarioControls ? "bg-[#ECE8FF] border-[#5B35F5]" : "hover:bg-[#ECE8FF]"
            )}
          >
            <Layers className="mr-1.5 size-3.5" />
            Scenario Controls
          </Button>

          <Button
            type="button"
            onClick={resetSimulation}
            variant="outline"
            className="rounded-full border border-[#E6E1FA] bg-white hover:bg-[#ECE8FF] text-[#5B35F5] text-xs font-semibold h-10 px-4"
          >
            <RotateCcw className="mr-1.5 size-3.5" />
            Reset
          </Button>

          <Button
            type="button"
            onClick={() => runSimulation()}
            disabled={isRunning}
            className="rounded-full h-[44px] px-6 bg-[#5B35F5] hover:bg-[#4A27D9] text-white text-sm font-semibold shadow-[0_4px_14px_rgba(91,53,245,0.18)] flex items-center gap-2 hover:-translate-y-px transition-all"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Simulating Attack (Step {currentStep}/5)...
              </>
            ) : (
              <>
                <Play className="size-4 fill-current" />
                <span>Run Attack Simulation</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Collapsible Demo Guide Card */}
      <div className="rounded-[20px] border border-[#E6E1FA] bg-white overflow-hidden text-sm shadow-none">
        <button
          type="button"
          onClick={() => setGuideOpen(!guideOpen)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-[#F9F8FF] hover:bg-[#ECE8FF]/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5 text-sm font-bold text-[#15122B]">
            <HelpCircle className="size-4 text-[#5B35F5]" />
            <span>Demo guide: What to click</span>
          </div>
          {guideOpen ? (
            <ChevronUp className="size-4 text-[#5E5A7A]" />
          ) : (
            <ChevronDown className="size-4 text-[#5E5A7A]" />
          )}
        </button>

        {guideOpen && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#EEEAFB] bg-white">
            <div className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#ECE8FF] text-xs font-bold text-[#5B35F5]">
                1
              </span>
              <span className="text-sm text-[#5E5A7A] leading-relaxed">
                Click &quot;Run Attack Simulation&quot; (or select a sample SMS from Virtual Phone on the left).
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#ECE8FF] text-xs font-bold text-[#5B35F5]">
                2
              </span>
              <span className="text-sm text-[#5E5A7A] leading-relaxed">
                Watch the kill-chain advance until E.D.I.T.H. auto-freezes the rogue app before OTP theft.
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#ECE8FF] text-xs font-bold text-[#5B35F5]">
                3
              </span>
              <span className="text-sm text-[#5E5A7A] leading-relaxed">
                Click &quot;Generate Complaint Kit&quot; in the prompt to view your ready-to-file 1930 cyber report.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Manual Scenario Controls Drawer (for interactive judge testing) */}
      {showScenarioControls && (
        <div className="rounded-[20px] border border-[#E6E1FA] bg-[#F9F8FF] p-5 space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-[#EEEAFB] pb-2.5">
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-[#5B35F5]" />
              <span className="text-xs font-bold text-[#15122B] uppercase tracking-wide">
                Judge Interactive Scenario Controls
              </span>
            </div>
            <span className="text-xs text-[#5E5A7A]">
              Fire single isolated events to observe dynamic rule derivation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => triggerManualEvent("app-rto", "INSTALL_WHATSAPP")}
              className="h-9 text-xs justify-start rounded-full border-[#E6E1FA] bg-white hover:bg-[#ECE8FF] text-[#15122B]"
            >
              + WhatsApp Install (+25 pts)
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => triggerManualEvent("app-rto", "GRANT_SMS")}
              className="h-9 text-xs justify-start rounded-full border-[#E6E1FA] bg-white hover:bg-[#FFF1D6] text-[#8A5A00]"
            >
              + Request SMS Read (+30 pts)
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => triggerManualEvent("app-rto", "GRANT_ACCESSIBILITY")}
              className="h-9 text-xs justify-start rounded-full border-[#E6E1FA] bg-white hover:bg-[#FFF1D6] text-[#8A5A00]"
            >
              + Accessibility Service (+30 pts)
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => triggerManualEvent("app-rto", "GRANT_INSTALL_PACKAGES")}
              className="h-9 text-xs justify-start rounded-full border-[#E6E1FA] bg-white hover:bg-[#FFF1D6] text-[#8A5A00]"
            >
              + Install Packages (+20 pts)
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => triggerManualEvent("app-rto", "BULK_SMS_READ")}
              className="h-9 text-xs justify-start rounded-full border-[#E6E1FA] bg-white hover:bg-[#FDE8E6] text-[#B42318]"
            >
              + Read 212 SMS in 4s (+25 pts)
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => triggerManualEvent("app-rto", "HIDE_ICON")}
              className="h-9 text-xs justify-start rounded-full border-[#E6E1FA] bg-white hover:bg-[#FDE8E6] text-[#B42318]"
            >
              + Hide Launcher Icon (+20 pts)
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => triggerManualEvent("app-rto", "CONTACT_NEW_DOMAIN")}
              className="h-9 text-xs justify-start rounded-full border-[#E6E1FA] bg-white hover:bg-[#ECE8FF] text-[#5B35F5]"
            >
              + Contact New Domain (+10 pts)
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => triggerManualEvent("app-rto", "RESTORE_APP")}
              className="h-9 text-xs justify-start rounded-full border-[#E6E1FA] bg-white hover:bg-[#ECE8FF] text-[#5E5A7A]"
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
            <span className="text-xs font-bold text-[#5E5A7A] uppercase tracking-wider">
              Monitored Apps (Device Sandbox)
            </span>
            <span className="text-xs text-[#5E5A7A]">
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
          <div className="rounded-[20px] border border-[#E6E1FA] bg-white p-5 space-y-3.5 shadow-none">
            <div className="flex items-center justify-between border-b border-[#EEEAFB] pb-2.5">
              <span className="text-xs font-bold text-[#15122B] uppercase tracking-wider">
                Kill-Chain Stage Tracker
              </span>
              <span className="text-xs font-semibold text-[#1E9E6A]">
                {currentStep === 0 && "Step 0: Baseline Normal"}
                {currentStep === 1 && "Stage 1: Lure Ingress"}
                {currentStep === 2 && "Stage 2: Permission Escalation"}
                {currentStep === 3 && "Stage 3: Data Exfiltration"}
                {currentStep >= 4 && "Stage 4: Autonomous Containment"}
              </span>
            </div>

            {/* 5 Stages Stepper */}
            <div className="grid grid-cols-5 gap-2">
              {KILL_CHAIN_STEPS.map((s) => {
                const isPassed = currentStep > s.step
                const isCurrent = currentStep === s.step
                const isContainedStep = s.step === 5 && currentStep >= 4

                return (
                  <div
                    key={s.step}
                    className={cn(
                      "rounded-[14px] p-2.5 text-center transition-all border flex flex-col items-center justify-center gap-1",
                      isContainedStep
                        ? "border-[#D64545] bg-[#FDE8E6] text-[#B42318] ring-2 ring-[#D64545]/20"
                        : isCurrent
                        ? "border-2 border-[#5B35F5] bg-[#ECE8FF] text-[#5B35F5] ring-4 ring-[#ECE8FF]"
                        : isPassed
                        ? "border-[#1E9E6A]/30 bg-[#E3F6EE] text-[#12704A]"
                        : "border-[#E6E1FA] bg-[#F9F8FF] text-[#5E5A7A]"
                    )}
                  >
                    <div className="size-6 rounded-full flex items-center justify-center text-xs font-bold">
                      {isPassed ? (
                        <Check className="size-3.5 text-[#1E9E6A] stroke-[3]" />
                      ) : (
                        <span>{s.step}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold leading-tight line-clamp-2">
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step 0 Idle State Prompt */}
          {currentStep === 0 && (
            <div className="rounded-[20px] border border-[#E6E1FA] bg-white p-6 text-center space-y-3">
              <div className="size-12 rounded-full bg-[#E3F6EE] text-[#12704A] flex items-center justify-center mx-auto">
                <ShieldCheck className="size-6 text-[#1E9E6A]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#15122B]">Device in Secure Baseline</h4>
                <p className="text-xs text-[#5E5A7A] mt-1 max-w-sm mx-auto leading-relaxed">
                  Click <strong className="text-[#5B35F5]">Run Attack Simulation</strong> to watch a simulated scam app arrive from WhatsApp, escalate silently, and get contained before stealing OTPs.
                </p>
              </div>
            </div>
          )}

          {/* Step 2 Dynamic Panel: Intent Mismatch */}
          {currentStep === 2 && (
            <div className="rounded-[20px] border border-[#D99A1E]/30 bg-[#FFF1D6]/40 p-5 space-y-2.5 animate-in fade-in-50 duration-300">
              <div className="flex items-center gap-2 text-[#8A5A00]">
                <AlertTriangle className="size-4 shrink-0 text-[#D99A1E]" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Intent Mismatch Flagged by Rule Engine
                </h4>
              </div>
              <div className="text-xs text-[#15122B] leading-relaxed bg-white/80 p-3.5 rounded-[12px] border border-[#D99A1E]/20 space-y-1">
                <p>
                  <strong className="text-[#5E5A7A]">Expected for a challan viewer:</strong>{" "}
                  <span className="text-[#12704A] font-bold">Internet only.</span>
                </p>
                <p>
                  <strong className="text-[#5E5A7A]">Requested:</strong>{" "}
                  <span className="text-[#B42318] font-bold">SMS Read (+30), Accessibility (+30), Install packages (+20).</span>
                </p>
              </div>
              <p className="text-xs text-[#8A5A00] font-medium">
                E.D.I.T.H. placed RTO Challan into active surveillance sandbox (Trust: 35).
              </p>
            </div>
          )}

          {/* Step 3 Dynamic Panel: Mass SMS Burst Warning */}
          {currentStep === 3 && (
            <div className="rounded-[20px] border border-[#D64545]/30 bg-[#FDE8E6]/40 p-5 space-y-2.5 animate-in fade-in-50 duration-300">
              <div className="flex items-center gap-2 text-[#B42318]">
                <ShieldAlert className="size-4 shrink-0 text-[#D64545] animate-pulse" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Mass SMS Harvest Anomaly Detected
                </h4>
              </div>
              <div className="text-xs text-[#15122B] leading-relaxed bg-white/80 p-3.5 rounded-[12px] border border-[#D64545]/20 space-y-1.5">
                <p className="text-[#B42318] font-bold">
                  App read 212 SMS in 4 seconds (device baseline: 0 queries/min).
                </p>
                <p className="text-[#5E5A7A] text-xs">
                  Target pattern: Searching for bank verification tokens, OTPs, and card expiry strings.
                </p>
              </div>
            </div>
          )}

          {/* Step 4 & 5: Main Risk Verdict Card (#1B1736 emphasis surface) */}
          {currentStep >= 4 && (
            <div className="rounded-[20px] border border-[#5B35F5]/30 bg-[#1B1736] text-white p-6 space-y-4 shadow-[0_4px_14px_rgba(91,53,245,0.18)] animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-[#D64545] text-white flex items-center justify-center shrink-0">
                  <ShieldAlert className="size-5" />
                </div>
                <div>
                  <Badge variant="destructive" className="bg-[#D64545] text-white font-mono text-[10px] tracking-wider font-extrabold uppercase">
                    AUTONOMOUS KILL-SWITCH FIRED (RISK ≥ 70)
                  </Badge>
                  <h3 className="text-base text-white font-bold mt-1">
                    Zero-Trust Quarantine Enforced
                  </h3>
                </div>
              </div>

              {/* Plain English Threat Containment Alert Message */}
              <div className="bg-white/10 rounded-[12px] p-4 border border-white/10 space-y-1">
                <p className="text-sm font-bold text-white leading-snug">
                  This app attempted to access your SMS and authentication codes without permission.
                </p>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  E.D.I.T.H. stopped it before any one-time password could be stolen. Never share your OTP or PIN with anyone.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-zinc-300 px-1">
                <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#1E9E6A]" /> Process Isolated</span>
                <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#1E9E6A]" /> Permissions Revoked</span>
                <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#1E9E6A]" /> OTP Loss: 0</span>
              </div>

              {/* Trigger Complaint Kit from Verdict Card */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowComplaintKit(true)}
                  className="rounded-full bg-[#5B35F5] hover:bg-[#4A27D9] text-white font-semibold text-xs h-9 px-4 shadow-[0_4px_14px_rgba(91,53,245,0.18)] flex items-center gap-2"
                >
                  <FileText className="size-3.5" />
                  <span>Generate Complaint Kit</span>
                  <ArrowRight className="size-3.5" />
                </Button>
                <span className="text-xs text-zinc-400">
                  Prepares Section 63 BSA draft
                </span>
              </div>
            </div>
          )}

          {/* Step 5: Complaint Evidence Packet Card */}
          {currentStep === 5 && (
            <div className="rounded-[20px] border border-[#E6E1FA] bg-white p-5 space-y-3.5 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between border-b border-[#EEEAFB] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-[#1E9E6A]" />
                  <span className="text-xs font-bold text-[#15122B] uppercase">
                    Complaint Evidence Packet
                  </span>
                </div>
                <span className="text-xs font-mono text-[#5E5A7A]">ID: EDITH-INC-2026-8941</span>
              </div>

              <div className="space-y-2 text-xs text-[#15122B] bg-[#F9F8FF] p-3.5 rounded-[14px] border border-[#E6E1FA]">
                <p className="text-[#5E5A7A] font-semibold">
                  Incident Timeline:
                </p>
                <ul className="text-xs space-y-1 text-[#5E5A7A] pl-2">
                  <li>&bull; 17:05:02 — Installed from WhatsApp file (+25 pts)</li>
                  <li>&bull; 17:05:06 — Unexplained SMS &amp; Accessibility requested (+80 pts)</li>
                  <li>&bull; 17:05:10 — 212 SMS read burst in 4s (baseline: 0) (+25 pts)</li>
                  <li>&bull; 17:05:14 — Auto-containment: permissions frozen before OTP stolen</li>
                </ul>
                <div className="pt-2 border-t border-[#EEEAFB]">
                  <span className="text-[11px] text-[#5E5A7A] block font-medium">SHA-256 Evidence Seal (Browser Computed):</span>
                  <p className="text-xs font-mono text-[#12704A] break-all select-all font-semibold mt-0.5">
                    {evidenceHash}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Copy Summary, Open cybercrime, Call 1930 */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowComplaintKit(true)}
                  className="rounded-full bg-[#5B35F5] hover:bg-[#4A27D9] text-white text-xs font-semibold h-9 px-4 shadow-[0_4px_14px_rgba(91,53,245,0.18)] flex items-center gap-1.5"
                >
                  <FileText className="size-3.5" />
                  <span>Generate Complaint Kit</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopySummary}
                  className="rounded-full border border-[#E6E1FA] bg-white hover:bg-[#ECE8FF] text-[#15122B] text-xs font-semibold h-9 px-4"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="mr-1.5 size-3.5 text-[#1E9E6A]" />
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
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[#E6E1FA] bg-white hover:bg-[#ECE8FF] text-[#5B35F5] text-xs font-semibold transition-colors"
                >
                  <Globe className="size-3.5 text-[#5B35F5]" />
                  Open cybercrime.gov.in
                  <ExternalLink className="size-3 text-[#5E5A7A]" />
                </a>

                <a
                  href="tel:1930"
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[#D64545]/30 bg-[#FDE8E6] hover:bg-[#FDE8E6]/80 text-[#B42318] text-xs font-bold transition-colors"
                >
                  <Phone className="size-3.5 text-[#D64545]" />
                  Call 1930
                </a>
              </div>

              <p className="text-[11px] text-[#5E5A7A] italic">
                These are links only; nothing is sent automatically.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Live Event Feed (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="rounded-[20px] border border-[#E6E1FA] bg-white p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#EEEAFB]">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#1E9E6A] animate-pulse" />
                <span className="text-xs font-bold text-[#15122B] uppercase tracking-wider">
                  Live Event Feed
                </span>
              </div>
              <span className="text-xs text-[#5E5A7A]">
                {events.length} events
              </span>
            </div>

            {events.length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-[#E6E1FA] p-6 text-center text-xs text-[#5E5A7A]">
                Run the simulation to see activity
              </div>
            ) : (
              <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                {events.map((evt) => {
                  const isCritical = evt.severity === "critical"
                  const isWarning = evt.severity === "warning"
                  const isSuccess = evt.severity === "success"
                  return (
                    <div
                      key={evt.id}
                      className={cn(
                        "rounded-[14px] border p-3 space-y-1 text-xs transition-all",
                        isCritical
                          ? "border-[#D64545]/20 bg-[#FDE8E6]/40 text-[#B42318]"
                          : isWarning
                          ? "border-[#D99A1E]/20 bg-[#FFF1D6]/40 text-[#8A5A00]"
                          : isSuccess
                          ? "border-[#1E9E6A]/20 bg-[#E3F6EE]/40 text-[#12704A]"
                          : "border-[#E6E1FA] bg-[#F9F8FF] text-[#15122B]"
                      )}
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#5E5A7A]">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3 text-[#5E5A7A]" />
                          {evt.timestamp}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full font-bold text-[10px] uppercase",
                            isCritical
                              ? "bg-[#FDE8E6] text-[#B42318]"
                              : isWarning
                              ? "bg-[#FFF1D6] text-[#8A5A00]"
                              : isSuccess
                              ? "bg-[#E3F6EE] text-[#12704A]"
                              : "bg-[#ECE8FF] text-[#5B35F5]"
                          )}
                        >
                          {evt.action}
                        </span>
                      </div>

                      <p className="font-semibold text-[#15122B] text-xs leading-tight">
                        {evt.app}
                      </p>

                      <p className="text-xs text-[#5E5A7A] leading-snug break-words">
                        {evt.details}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Part F: Real-World Path Card ("How this works on a real phone") */}
      <div className="rounded-[20px] border border-[#E6E1FA] bg-white p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-[#EEEAFB] pb-3">
          <Smartphone className="size-5 text-[#5B35F5]" />
          <h3 className="font-bold text-base text-[#15122B]">
            How this works on a real phone
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-[#15122B]">
          <div className="space-y-2 rounded-[16px] border border-[#E6E1FA] bg-[#F9F8FF] p-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#E3F6EE] text-[#12704A] border border-[#1E9E6A]/20 text-[11px] font-bold px-2.5 py-0.5">
                Phase 1
              </span>
              <strong className="text-sm font-semibold text-[#15122B]">Works today (no special access needed)</strong>
            </div>
            <p className="text-[#5E5A7A] text-xs leading-relaxed">
              A normal Android companion app reads each installed APK&apos;s declared permissions, install source (Play Store vs sideloaded), and permission changes after updates, then runs this rule engine to flag intent mismatches and warn the user.
            </p>
          </div>

          <div className="space-y-2 rounded-[16px] border border-[#E6E1FA] bg-[#F9F8FF] p-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#ECE8FF] text-[#5B35F5] border border-[#5B35F5]/20 text-[11px] font-bold px-2.5 py-0.5">
                Phase 2
              </span>
              <strong className="text-sm font-semibold text-[#15122B]">Needs OS-level integration</strong>
            </div>
            <p className="text-[#5E5A7A] text-xs leading-relaxed">
              Integrated with Google Play Protect, OEM phone makers (Samsung Knox / Xiaomi MIUI), or MDM programs for real-time monitoring of actual access (e.g. bulk SMS read bursts) and automated kernel-level freezing.
            </p>
          </div>
        </div>

        <p className="text-xs text-[#5E5A7A] italic pt-1 border-t border-[#EEEAFB]">
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
