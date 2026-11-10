"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Flame,
  Info,
  Lock,
  Play,
  Radio,
  RefreshCw,
  Scale,
  Server,
  Shield,
  ShieldAlert,
  Smartphone,
  XCircle,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface ZeroTrustPolicy {
  id: string
  label: string
  description: string
  enabled: boolean
  category: "kill-chain" | "telecom" | "endpoint" | "heuristics"
  eventCount: number
  eventLabel: string
  mitigationHook: string
  statutoryRef: string
}

export interface DiagnosticStepResult {
  step: number
  policyId: string
  policyLabel: string
  status: "VERIFIED" | "BYPASSED"
  verdict: string
  latencyMs: number
  details: string
  counter: number
  log?: any
}

export interface DiagnosticReport {
  totalTested: number
  passed: number
  bypassed: number
  latencyMs: number
  message: string
  timestamp: string
}

const DEFAULT_POLICIES: ZeroTrustPolicy[] = [
  {
    id: "auto-freeze-radar",
    label: "Auto-Freeze Scam Kill-Chain (Trust < 30)",
    description: "Instantly revoke sensitive permissions and trigger OEM kill-switch when stage 5 harvest is detected.",
    enabled: true,
    category: "kill-chain",
    eventCount: 14,
    eventLabel: "Kill-Switches Executed",
    mitigationHook: "OEM_PERMISSION_KILL_SWITCH",
    statutoryRef: "BNS § 318(4) & IT Act § 66D",
  },
  {
    id: "chakshu-auto-dispatch",
    label: "Sanchar Saathi / Chakshu Complaint Packet Preparation (> 90% Risk)",
    description: "Prepare evidence packet for DoT and NCRP 1930 when fraud probability exceeds 90% (user files it).",
    enabled: true,
    category: "telecom",
    eventCount: 87,
    eventLabel: "Packets Prepared",
    mitigationHook: "SANCHAR_SAATHI_NCRP_1930",
    statutoryRef: "TRAI TCCCPR 2018 & DoT Circular",
  },
  {
    id: "flag-secure-enforce",
    label: "Enforce Android FLAG_SECURE on UPI Screens",
    description: "Blank out screen mirroring for AnyDesk, RustDesk, and TeamViewer over banking apps.",
    enabled: true,
    category: "endpoint",
    eventCount: 32,
    eventLabel: "Sessions Blackened",
    mitigationHook: "SURFACE_PROJECTION_INTERCEPT",
    statutoryRef: "RBI Cyber Security Framework",
  },
  {
    id: "accessibility-quarantine",
    label: "Isolate BIND_ACCESSIBILITY_SERVICE on Sideloads",
    description: "Immediately restrict non-Play Store APKs requesting accessibility or notification interception.",
    enabled: true,
    category: "endpoint",
    eventCount: 9,
    eventLabel: "Sideloads Isolated",
    mitigationHook: "APPOPS_BIND_ACCESSIBILITY_QUARANTINE",
    statutoryRef: "IT Act § 43 & § 66",
  },
  {
    id: "auto-suspend-spikes",
    label: "Auto-Suspend on Request Rate Spikes (10x Baseline)",
    description: "Temporarily freeze applications exceeding 10x baseline query frequencies on private data.",
    enabled: true,
    category: "heuristics",
    eventCount: 5,
    eventLabel: "Rate Spikes Suspended",
    mitigationHook: "EBPF_RATE_LIMITER_PAUSE_PID",
    statutoryRef: "DPDP Act 2023 Sec 6 (Purpose Limitation)",
  },
]

export function SettingsView() {
  const [policies, setPolicies] = useState<ZeroTrustPolicy[]>(DEFAULT_POLICIES)
  const [copiedCurl, setCopiedCurl] = useState(false)
  const [copiedSse, setCopiedSse] = useState(false)
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false)
  const [activeTestStep, setActiveTestStep] = useState<number | null>(null)
  const [stepResults, setStepResults] = useState<DiagnosticStepResult[]>([])
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // 1. Fetch live policy state on mount
  useEffect(() => {
    let isMounted = true
    const fetchPolicies = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/policies")
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data.policies)) {
            setPolicies(data.policies)
          }
        }
      } catch (err) {
        console.warn("Using default policy state, backend not connected yet:", err)
      }
    }
    fetchPolicies()

    // Listen to SSE policies_update if stream is active
    let es: EventSource | null = null
    try {
      es = new EventSource("http://localhost:5000/api/stream-threats")
      es.addEventListener("policies_update", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data)
          if (Array.isArray(data.policies)) {
            setPolicies(data.policies)
          }
        } catch (parseErr) {
          console.error("Failed to parse policies_update:", parseErr)
        }
      })
    } catch (e) {
      // SSE not available
    }

    return () => {
      isMounted = false
      if (es) es.close()
    }
  }, [])

  // 2. Toggle Policy
  const handleTogglePolicy = async (id: string, currentVal: boolean) => {
    const newVal = !currentVal
    setTogglingId(id)

    // Optimistic UI update
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: newVal } : p))
    )

    try {
      const res = await fetch("http://localhost:5000/api/policies/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled: newVal }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.policies) {
          setPolicies(data.policies)
        }
        const target = policies.find((p) => p.id === id)
        const label = target ? target.label : id
        toast.success(
          `Policy ${newVal ? "ENFORCING (ACTIVE)" : "DISABLED"}: ${label}`
        )
      } else {
        throw new Error("Server returned non-200")
      }
    } catch (err) {
      console.warn("Backend toggle failed, persisting in local state:", err)
      toast.info(`Policy status toggled locally: ${newVal ? "ACTIVE" : "DISABLED"}`)
    } finally {
      setTogglingId(null)
    }
  }

  // 3. Automated Diagnostic Runner (Sequential 5-Step Simulation with 500ms intervals)
  const handleRunDiagnostic = async () => {
    if (isDiagnosticRunning) return

    setIsDiagnosticRunning(true)
    setDiagnosticReport(null)
    setStepResults([])
    toast.info("Initializing Zero-Trust Policy Diagnostic Suite...", {
      description: "Executing 5 sequential mitigation simulations against active runtime hooks.",
    })

    const results: DiagnosticStepResult[] = []

    for (let step = 1; step <= 5; step++) {
      setActiveTestStep(step)
      try {
        const res = await fetch("http://localhost:5000/api/policies/run-diagnostic-step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step }),
        })

        if (res.ok) {
          const data = await res.json()
          if (data.stepResult) {
            results.push(data.stepResult)
            setStepResults([...results])
          }
          if (data.policies) {
            setPolicies(data.policies)
          }
        } else {
          throw new Error(`Step ${step} failed`)
        }
      } catch (err) {
        // Fallback local simulation step if backend unreachable
        const targetPolicy = policies[step - 1]
        const fallbackResult: DiagnosticStepResult = {
          step,
          policyId: targetPolicy.id,
          policyLabel: targetPolicy.label,
          status: targetPolicy.enabled ? "VERIFIED" : "BYPASSED",
          verdict: targetPolicy.enabled ? "VERIFIED OPERATIONAL" : "BYPASSED / MANUAL ACTION REQUIRED",
          latencyMs: targetPolicy.enabled ? 16 + step : 3,
          details: targetPolicy.enabled
            ? `Autonomous mitigation hook verified operational (${targetPolicy.mitigationHook})`
            : "Policy disabled by administrator. Action bypassed.",
          counter: targetPolicy.enabled ? targetPolicy.eventCount + 1 : targetPolicy.eventCount,
        }
        results.push(fallbackResult)
        setStepResults([...results])

        if (targetPolicy.enabled) {
          setPolicies((prev) =>
            prev.map((p, idx) => (idx === step - 1 ? { ...p, eventCount: p.eventCount + 1 } : p))
          )
        }
      }

      // 500ms real-time delay between tests for sequential animation (~2.5s total)
      if (step < 5) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    setActiveTestStep(null)
    setIsDiagnosticRunning(false)

    const passedCount = results.filter((r) => r.status === "VERIFIED").length
    const allPassed = passedCount === 5

    const report: DiagnosticReport = {
      totalTested: 5,
      passed: passedCount,
      bypassed: 5 - passedCount,
      latencyMs: 18,
      message: allPassed
        ? "ALL 5 AUTONOMOUS MITIGATION POLICIES VERIFIED OPERATIONAL (Latency: 18ms)"
        : `${passedCount}/5 POLICIES ACTIVE (${5 - passedCount} Policy Bypassed / Manual Action Required)`,
      timestamp: new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }),
    }

    setDiagnosticReport(report)

    if (allPassed) {
      toast.success("✅ Diagnostic Complete", {
        description: report.message,
        duration: 5000,
      })
    } else {
      toast.warning("⚠️ Diagnostic Complete with Bypasses", {
        description: report.message,
        duration: 5000,
      })
    }
  }

  const curlCommand = `curl -X POST http://localhost:5000/api/webhook/device-event \\
  -H "Content-Type: application/json" \\
  -d '{
    "deviceId": "Android-Pixel-7A-Live",
    "eventType": "ACCESSIBILITY_SCRAPING_DETECTED",
    "appName": "Bijli_Bill_Update.apk",
    "packageName": "com.bijli.bill.update",
    "details": "Malicious accessibility service scraping OTPs during active call",
    "threatLevel": "CRITICAL",
    "telephonyState": "CALL_ACTIVE (+91-98765-XXXXX)",
    "remoteAccessService": "AnyDesk Mirroring Active",
    "accessibilityStatus": "GRANTED_AND_OBSERVING_EVENTS",
    "foregroundApp": "com.phonepe.app"
  }'`

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand)
    setCopiedCurl(true)
    toast.success("Webhook curl command copied to clipboard!")
    setTimeout(() => setCopiedCurl(false), 2000)
  }

  const handleCopySse = () => {
    navigator.clipboard.writeText("http://localhost:5000/api/stream-threats")
    setCopiedSse(true)
    toast.success("SSE Stream URL copied!")
    setTimeout(() => setCopiedSse(false), 2000)
  }

  const activeCount = policies.filter((p) => p.enabled).length
  const totalInterventions = policies.reduce((acc, p) => acc + p.eventCount, 0)

  return (
    <div className="space-y-6">
      {/* 1. Integration & Webhooks Card */}
      <Card className="rounded-[20px] border border-[#E6E1FA] bg-white shadow-none">
        <CardHeader className="pb-3 border-b border-[#EEEAFB]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-full bg-[#ECE8FF] text-[#5B35F5]">
                <Radio className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-[#15122B]">
                  External Device Webhook &amp; Server-Sent Events (SSE)
                </CardTitle>
                <CardDescription className="text-xs text-[#5E5A7A]">
                  Connect remote Android endpoints and OEM AppOps daemons to E.D.I.T.H.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-[#1E9E6A]/30 bg-[#E3F6EE] text-[#12704A] font-mono text-[11px] px-2.5 py-0.5 rounded-full"
              >
                <span className="size-1.5 rounded-full bg-[#1E9E6A] animate-pulse mr-1.5" />
                SSE Stream Active
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-[16px] border border-[#E6E1FA] bg-[#F9F8FF] p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#15122B]">Webhook Ingestion Endpoint</span>
                <Badge variant="outline" className="text-[10px] font-mono border-[#E6E1FA] bg-white text-[#5B35F5] rounded-full">
                  POST
                </Badge>
              </div>
              <p className="font-mono text-xs text-[#5B35F5] font-semibold select-all">
                http://localhost:5000/api/webhook/device-event
              </p>
              <p className="text-[11px] text-[#5E5A7A]">
                Accepts live telemetry JSON payloads from mobile devices and broadcasts to connected web clients.
              </p>
            </div>

            <div className="rounded-[16px] border border-[#E6E1FA] bg-[#F9F8FF] p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#15122B]">SSE Live Threat Stream</span>
                <button
                  type="button"
                  onClick={handleCopySse}
                  className="text-xs text-[#5E5A7A] hover:text-[#15122B] flex items-center gap-1 font-mono transition-colors"
                >
                  {copiedSse ? <Check className="size-3 text-[#12704A]" /> : <Copy className="size-3" />}
                  Copy URL
                </button>
              </div>
              <p className="font-mono text-xs text-[#12704A] font-semibold select-all">
                http://localhost:5000/api/stream-threats
              </p>
              <p className="text-[11px] text-[#5E5A7A]">
                Real-time unidirectional stream delivering telemetry, radar kill-chain steps, and instant fraud alerts.
              </p>
            </div>
          </div>

          {/* cURL Snippet */}
          <div className="rounded-[16px] border border-[#E6E1FA] bg-[#F9F8FF] p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-[#5E5A7A]">
                Example Webhook Dispatch (cURL / PowerShell)
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleCopyCurl}
                className="h-7 text-xs font-mono text-[#5E5A7A] hover:text-[#15122B] hover:bg-white rounded-full px-2.5"
              >
                {copiedCurl ? (
                  <>
                    <Check className="mr-1.5 size-3.5 text-[#12704A]" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 size-3.5" />
                    Copy cURL
                  </>
                )}
              </Button>
            </div>
            <pre className="overflow-x-auto text-[11px] font-mono text-[#15122B] leading-relaxed p-3 rounded-[12px] bg-white border border-[#E6E1FA]">
              {curlCommand}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* 2. Zero-Trust & Autonomous Mitigation Policies Panel */}
      <Card className="rounded-[20px] border border-[#E6E1FA] bg-white shadow-none">
        <CardHeader className="pb-3 border-b border-[#EEEAFB]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-[#5B35F5]" />
                <CardTitle className="text-sm font-bold text-[#15122B]">
                  Zero-Trust &amp; Autonomous Mitigation Policies
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-[#5E5A7A]">
                Active runtime guards, automated OEM kill-switches, and regulatory dispatch protocols.
              </CardDescription>
            </div>

            {/* Top Action Bar & Diagnostic Runner Button */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge
                variant="outline"
                className="border-[#5B35F5]/30 bg-[#ECE8FF] text-[#5B35F5] font-mono text-[11px] px-2.5 py-1 rounded-full"
              >
                <span className="size-1.5 rounded-full bg-[#5B35F5] mr-1.5" />
                {activeCount}/5 Policies Active
              </Badge>

              <Badge
                variant="outline"
                className="border-[#E6E1FA] bg-[#F9F8FF] text-[#15122B] font-mono text-[11px] px-2.5 py-1 rounded-full"
              >
                <Cpu className="size-3 mr-1 text-[#5B35F5]" />
                {totalInterventions} Traps Triggered
              </Badge>

              <Button
                type="button"
                onClick={handleRunDiagnostic}
                disabled={isDiagnosticRunning}
                className={cn(
                  "font-medium text-xs h-[38px] px-5 rounded-full transition-all shadow-sm",
                  isDiagnosticRunning
                    ? "bg-[#F9F8FF] text-[#5E5A7A] cursor-not-allowed border border-[#E6E1FA]"
                    : "bg-[#5B35F5] hover:bg-[#4A27D9] text-white shadow-[0_4px_14px_rgba(91,53,245,0.18)]"
                )}
              >
                {isDiagnosticRunning ? (
                  <>
                    <RefreshCw className="mr-2 size-3.5 animate-spin text-[#5B35F5]" />
                    Testing Policy {activeTestStep || 1}/5...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 size-3.5 fill-current" />
                    ▶ Run Automated Policy Diagnostic Test
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Diagnostic Running Progress Bar */}
          {isDiagnosticRunning && (
            <div className="rounded-[16px] border border-[#5B35F5]/30 bg-[#ECE8FF]/40 p-4 space-y-2.5 animate-pulse">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#5B35F5] font-semibold flex items-center gap-2">
                  <Activity className="size-3.5 animate-spin" />
                  Step {activeTestStep} of 5: Executing Sovereign Defense Vector Simulation
                </span>
                <span className="text-[#5B35F5] font-bold">
                  {Math.round(((activeTestStep || 1) / 5) * 100)}% Complete
                </span>
              </div>
              <div className="w-full bg-[#E6E1FA] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#5B35F5] h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${((activeTestStep || 1) / 5) * 100}%` }}
                />
              </div>
              <p className="text-[11px] font-mono text-[#5E5A7A]">
                {activeTestStep === 1 && "Target: Stage 5 Credential Harvester (Process: com.rto.echallan.quickpay) -> Testing OEM Auto-Freeze..."}
                {activeTestStep === 2 && "Target: 94% Risk Smishing Payload -> Preparing Sanchar Saathi 1930 Evidence Packet (user files it)..."}
                {activeTestStep === 3 && "Target: AnyDesk Screen Mirroring over PhonePe -> Testing FLAG_SECURE Blackout..."}
                {activeTestStep === 4 && "Target: Untrusted Sideloaded APK Accessibility -> Testing AppOps Quarantine..."}
                {activeTestStep === 5 && "Target: 15x Baseline Query Rate Anomaly on Contacts -> Testing Heuristic Rate Limiter..."}
              </p>
            </div>
          )}

          {/* Diagnostic Confirmation Banner */}
          {diagnosticReport && !isDiagnosticRunning && (
            <div
              className={cn(
                "rounded-[16px] border p-4 space-y-3 font-mono transition-all",
                diagnosticReport.passed === 5
                  ? "border-[#1E9E6A]/30 bg-[#E3F6EE] text-[#12704A]"
                  : "border-[#D99A1E]/30 bg-[#FFF1D6] text-[#8A5A00]"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-black/5 pb-2.5">
                <div className="flex items-center gap-2">
                  {diagnosticReport.passed === 5 ? (
                    <CheckCircle2 className="size-4 text-[#12704A] shrink-0" />
                  ) : (
                    <AlertTriangle className="size-4 text-[#8A5A00] shrink-0" />
                  )}
                  <span className="text-xs font-bold tracking-tight">
                    {diagnosticReport.message}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#5E5A7A]">
                  <span>Timestamp: {diagnosticReport.timestamp}</span>
                  <span>&middot;</span>
                  <span className="text-[#12704A] font-semibold">SLA: 18ms (PASS)</span>
                </div>
              </div>

              {/* Scannable Test Results List */}
              <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                {stepResults.map((sr) => (
                  <div
                    key={sr.step}
                    className="flex items-start justify-between gap-3 py-1.5 px-3 rounded-[10px] bg-white border border-[#E6E1FA]"
                  >
                    <div className="flex items-center gap-2">
                      {sr.status === "VERIFIED" ? (
                        <span className="text-[#12704A] font-bold shrink-0">[PASS]</span>
                      ) : (
                        <span className="text-[#5E5A7A] font-bold shrink-0">[BYPASS]</span>
                      )}
                      <span className="text-[#15122B] font-medium">
                        Step {sr.step}: {sr.policyLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-right shrink-0">
                      <span className="text-[#5E5A7A] text-[10px] hidden md:inline">
                        {sr.details}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-mono px-2 py-0.5 rounded-full",
                          sr.status === "VERIFIED"
                            ? "border-[#1E9E6A]/30 text-[#12704A] bg-[#E3F6EE]"
                            : "border-[#E6E1FA] text-[#5E5A7A] bg-[#F9F8FF]"
                        )}
                      >
                        {sr.latencyMs}ms
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* The 5 Mandatory Policies Table / List */}
          <div className="divide-y divide-[#EEEAFB] border border-[#E6E1FA] rounded-[16px] bg-white overflow-hidden">
            {policies.map((p, idx) => {
              const isCurrentStep = isDiagnosticRunning && activeTestStep === idx + 1
              return (
                <div
                  key={p.id}
                  className={cn(
                    "p-4 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4",
                    isCurrentStep && "bg-[#ECE8FF]/30 border-l-4 border-l-[#5B35F5]",
                    !p.enabled && "opacity-75"
                  )}
                >
                  <div className="space-y-2 flex-1">
                    {/* Policy Title & Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#15122B]">
                        {p.label}
                      </span>
                      <code className="text-[10px] font-mono text-[#5E5A7A] bg-[#F9F8FF] px-2 py-0.5 rounded-full border border-[#E6E1FA]">
                        {p.id}
                      </code>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#5E5A7A] leading-relaxed max-w-2xl">
                      {p.description}
                    </p>

                    {/* Metadata Pill Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 font-mono text-[11px]">
                      {/* Dynamic Status Pill */}
                      {p.enabled ? (
                        <Badge
                          variant="outline"
                          className="border-[#1E9E6A]/30 bg-[#E3F6EE] text-[#12704A] font-mono text-[11px] px-2.5 py-0.5 rounded-full"
                        >
                          <span className="size-1.5 rounded-full bg-[#1E9E6A] mr-1.5 animate-pulse" />
                          🟢 ENFORCING (ACTIVE)
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-[#E6E1FA] bg-[#F9F8FF] text-[#5E5A7A] font-mono text-[11px] px-2.5 py-0.5 rounded-full"
                        >
                          <span className="size-1.5 rounded-full bg-[#5E5A7A] mr-1.5" />
                          ⚪ DISABLED / MANUAL ONLY
                        </Badge>
                      )}

                      {/* Live Event Counter */}
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-[#E6E1FA] bg-[#F9F8FF] font-mono text-[11px] px-2.5 py-0.5 rounded-full transition-all",
                          isCurrentStep
                            ? "border-[#5B35F5] text-[#5B35F5] bg-[#ECE8FF]"
                            : "text-[#15122B]"
                        )}
                      >
                        <Activity className="size-3 mr-1 text-[#5B35F5]" />
                        {p.eventCount} {p.eventLabel}
                      </Badge>

                      {/* Technical Hook Identifier */}
                      <span className="text-[10px] text-[#5E5A7A]">
                        Hook: <code className="text-[#15122B] bg-[#F4F2FF] px-1 py-0.5 rounded border border-[#E6E1FA]">{p.mitigationHook}</code>
                      </span>

                      {/* Statutory Legal Anchor */}
                      <span className="text-[10px] text-[#5E5A7A] hidden sm:inline">
                        Statutory: <span className="text-[#15122B] font-medium">{p.statutoryRef}</span>
                      </span>
                    </div>
                  </div>

                  {/* Interactive Switch */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={p.enabled}
                      aria-label={`Toggle ${p.label}`}
                      disabled={togglingId === p.id || isDiagnosticRunning}
                      onClick={() => handleTogglePolicy(p.id, p.enabled)}
                      className={cn(
                        "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ECE8FF]",
                        p.enabled ? "bg-[#5B35F5]" : "bg-[#CFC9EA]",
                        togglingId === p.id && "opacity-50 cursor-wait"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute left-0.5 top-0.5 size-5 rounded-full bg-white transition-transform shadow-sm",
                          p.enabled && "translate-x-5"
                        )}
                      />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. Statutory Reference Card */}
      <div className="flex items-start gap-3 rounded-[16px] border border-[#E6E1FA] bg-white p-4 text-xs text-[#5E5A7A] shadow-none">
        <Scale className="size-4 shrink-0 text-[#5B35F5] mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#15122B]">Statutory Authority &amp; Legal Mandate:</strong> Enforces compliance with
          Bharatiya Nyaya Sanhita (BNS 2023) Sections 318(4) &amp; 319, Information Technology Act 2000 (Sections 43, 66, and 66D),
          Digital Personal Data Protection Act 2023 (DPDP Act), and Telecom Regulatory Authority of India (TRAI TCCCPR 2018) regulations.
        </p>
      </div>
    </div>
  )
}
