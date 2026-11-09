"use client"

import React, { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  analyzeSms,
  defangUrl,
  SAMPLE_SMS_LIST,
  SampleSms,
  SmsAnalysisResult,
  SmsFinding,
} from "@/lib/smsEngine"
import { useSimulation } from "@/lib/simulation-context"
import {
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Play,
  RotateCcw,
  ExternalLink,
  Phone,
  Globe,
  Radio,
  Wifi,
  Battery,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Flame,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
  Send,
  Loader2,
  MessageSquare,
  Lock,
  FileText,
} from "lucide-react"
import { ComplaintKitModal } from "@/components/edith/complaint-kit-modal"

export function SmsShieldPanel() {
  const { runSimulation, isRunning } = useSimulation()

  // Input states
  const [selectedSampleId, setSelectedSampleId] = useState<string>("sample-a")
  const [senderInput, setSenderInput] = useState<string>(SAMPLE_SMS_LIST[0].sender)
  const [messageInput, setMessageInput] = useState<string>(SAMPLE_SMS_LIST[0].message)
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false)
  const [showComplaintKit, setShowComplaintKit] = useState<boolean>(false)

  // Simulation & scanning states
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [scanStep, setScanStep] = useState<number>(0) // 0: idle, 1..5: pipeline steps
  const [analysisResult, setAnalysisResult] = useState<SmsAnalysisResult | null>(null)
  const [activeMessage, setActiveMessage] = useState<{ sender: string; text: string } | null>(null)
  const [showFindingsDetails, setShowFindingsDetails] = useState<boolean>(true)

  const scanTimersRef = useRef<NodeJS.Timeout[]>([])

  const clearScanTimers = () => {
    scanTimersRef.current.forEach((t) => clearTimeout(t))
    scanTimersRef.current = []
  }

  // Handle selecting a sample SMS
  const handleSelectSample = (sampleId: string) => {
    setSelectedSampleId(sampleId)
    setIsCustomMode(false)
    const found = SAMPLE_SMS_LIST.find((s) => s.id === sampleId)
    if (found) {
      setSenderInput(found.sender)
      setMessageInput(found.message)
    }
  }

  // Execute the 5-step analysis pipeline (~600ms each)
  const handleReceiveAndScan = (senderToScan = senderInput, messageToScan = messageInput) => {
    if (!senderToScan.trim() || !messageToScan.trim()) {
      toast.error("Please provide both sender number/ID and message text.")
      return
    }

    clearScanTimers()
    setIsScanning(true)
    setScanStep(1)
    setActiveMessage({ sender: senderToScan.trim(), text: messageToScan.trim() })
    setAnalysisResult(null)

    // Precalculate deterministic result
    const evaluated = analyzeSms(senderToScan.trim(), messageToScan.trim())

    // Step 1: Sender Header Check (0ms -> 600ms)
    const t1 = setTimeout(() => {
      setScanStep(2)
    }, 600)
    scanTimersRef.current.push(t1)

    // Step 2: URL & Domain Analysis (600ms -> 1200ms)
    const t2 = setTimeout(() => {
      setScanStep(3)
    }, 1200)
    scanTimersRef.current.push(t2)

    // Step 3: Urgency & Content Check (1200ms -> 1800ms)
    const t3 = setTimeout(() => {
      setScanStep(4)
    }, 1800)
    scanTimersRef.current.push(t3)

    // Step 4: Attachment & APK Dropper Scan (1800ms -> 2400ms)
    const t4 = setTimeout(() => {
      setScanStep(5)
    }, 2400)
    scanTimersRef.current.push(t4)

    // Step 5: Final Synthesized Verdict (2400ms -> 3000ms)
    const t5 = setTimeout(() => {
      setIsScanning(false)
      setAnalysisResult(evaluated)
      if (evaluated.verdictColor === "red") {
        toast.error(`SMS Threat Flagged: ${evaluated.verdict}`, {
          description: `Score: ${evaluated.score}/100. High-risk smishing indicators identified.`,
        })
      } else if (evaluated.verdictColor === "amber") {
        toast.warning(`SMS Caution: ${evaluated.verdict}`, {
          description: `Score: ${evaluated.score}/100. Unverified or suspicious payload.`,
        })
      } else {
        toast.success(`SMS Verified: ${evaluated.verdict}`, {
          description: "Matches legitimate DLT communications registry.",
        })
      }
    }, 3000)
    scanTimersRef.current.push(t5)
  }

  // Auto-scan the default sample on mount
  useEffect(() => {
    handleReceiveAndScan(SAMPLE_SMS_LIST[0].sender, SAMPLE_SMS_LIST[0].message)
    return () => clearScanTimers()
  }, [])

  // Handler for "User installs the app anyway"
  const handleUserInstallsAnyway = () => {
    if (!analysisResult) return
    toast.warning("User ignored SMS warnings and sideloaded APK", {
      description: "Launching autonomous endpoint containment simulation...",
    })

    runSimulation({
      sender: activeMessage?.sender || senderInput,
      message: activeMessage?.text || messageInput,
      apkUrl: analysisResult.apkUrl,
    })

    // Smooth scroll down to the kill-chain tracker
    const el = document.getElementById("kill-chain-tracker")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  const PIPELINE_STEPS = [
    { num: 1, label: "Sender Check", desc: "Official header validation & 10-digit mobile detection" },
    { num: 2, label: "URL & Lookalikes", desc: "Domain suffix, sovereign allowlist (.gov.in), and shorteners" },
    { num: 3, label: "Urgency Check", desc: "Panic terms, arrest threats, and OTP solicitation" },
    { num: 4, label: "Payload & APK", desc: "Executable dropper binaries and .apk file extensions" },
    { num: 5, label: "Verdict Summary", desc: "Rule arithmetic, warning & defanged links" },
  ]

  return (
    <div className="space-y-4 font-mono">
      {/* Outer Card with Header */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400">
              <Smartphone className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100 uppercase tracking-wide">
                  Virtual Phone: SMS Shield
                </h2>
                <Badge
                  variant="outline"
                  className="border-emerald-600/40 bg-emerald-950/40 text-emerald-400 text-[10px] font-mono"
                >
                  Client-Side Ingress
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Inspect incoming SMS lures in a simulated device environment before permission escalation occurs.
              </p>
            </div>
          </div>

          {/* Quick Preset Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500 font-semibold">Receive a sample SMS:</span>
            <select
              value={isCustomMode ? "custom" : selectedSampleId}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setIsCustomMode(true)
                } else {
                  handleSelectSample(e.target.value)
                }
              }}
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {SAMPLE_SMS_LIST.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
              <option value="custom">-- Custom Message Form --</option>
            </select>

            <Button
              type="button"
              size="sm"
              onClick={() => handleReceiveAndScan()}
              disabled={isScanning}
              className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Send className="mr-1.5 size-3.5" />
                  Receive
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Custom Input Drawer if selected */}
        {isCustomMode && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-3 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase">
                Custom Ingress Simulator
              </span>
              <span className="text-[11px] text-zinc-500">
                Type any sender ID and message text to test deterministic rules
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Sender Number / DLT Header</label>
                <Input
                  value={senderInput}
                  onChange={(e) => setSenderInput(e.target.value)}
                  placeholder="e.g., +91 98321 00000 or AD-SBIINB"
                  className="h-8 text-xs font-mono bg-zinc-950 border-zinc-800"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] text-zinc-400 block mb-1">Incoming Message Body</label>
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Paste SMS content or malicious link here..."
                  className="h-8 text-xs font-mono bg-zinc-950 border-zinc-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* Two-Column Display: Left = Phone-Shaped Inbox; Right = Pipeline Stepper & Result Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Phone-Shaped Inbox Mockup (5 cols) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[340px] rounded-[2.2rem] border-4 border-zinc-800 bg-zinc-950 shadow-2xl p-3 flex flex-col space-y-3 relative overflow-hidden">
              {/* Phone Top Notch & Status Bar */}
              <div className="flex items-center justify-between px-3 pt-1 text-[11px] text-zinc-400 border-b border-zinc-900 pb-2">
                <span className="font-bold text-zinc-200">17:05</span>
                <div className="w-16 h-3 rounded-full bg-zinc-900 mx-auto" />
                <div className="flex items-center gap-1.5">
                  <Wifi className="size-3 text-zinc-400" />
                  <Radio className="size-3 text-zinc-400" />
                  <Battery className="size-3.5 text-zinc-400" />
                </div>
              </div>

              {/* Messaging App Bar */}
              <div className="flex items-center justify-between px-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-xs">
                    {activeMessage ? activeMessage.sender.slice(0, 2).toUpperCase() : "ED"}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-100 text-xs truncate max-w-[170px]">
                      {activeMessage ? activeMessage.sender : senderInput}
                    </p>
                    <span className="text-[10px] text-zinc-500">SIM 1 &middot; SMS</span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] px-1.5 py-0.2",
                    isScanning
                      ? "border-amber-600/40 text-amber-400 bg-amber-950/40 animate-pulse"
                      : analysisResult?.verdictColor === "red"
                      ? "border-rose-600/40 text-rose-400 bg-rose-950/40"
                      : analysisResult?.verdictColor === "amber"
                      ? "border-amber-600/40 text-amber-400 bg-amber-950/40"
                      : "border-emerald-600/40 text-emerald-400 bg-emerald-950/40"
                  )}
                >
                  {isScanning
                    ? "SCANNING..."
                    : analysisResult
                    ? analysisResult.verdict.toUpperCase()
                    : "STANDBY"}
                </Badge>
              </div>

              {/* Phone Message Body Area */}
              <div className="min-h-[220px] rounded-xl bg-zinc-900/60 p-3 flex flex-col justify-end space-y-2 border border-zinc-900">
                <div className="text-center text-[10px] text-zinc-600 py-1">
                  Today &middot; 24h IST
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    "rounded-2xl rounded-tl-sm p-3 text-xs leading-relaxed space-y-1.5 transition-all shadow-md relative",
                    analysisResult?.verdictColor === "red"
                      ? "bg-rose-950/50 border border-rose-800/80 text-rose-100"
                      : analysisResult?.verdictColor === "amber"
                      ? "bg-amber-950/50 border border-amber-800/80 text-amber-100"
                      : analysisResult?.verdictColor === "green"
                      ? "bg-zinc-800 border border-zinc-700 text-zinc-100"
                      : "bg-zinc-800/80 border border-zinc-700/80 text-zinc-200"
                  )}
                >
                  {isScanning && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center gap-2 backdrop-blur-xs">
                      <Loader2 className="size-4 animate-spin text-emerald-400" />
                      <span className="text-[11px] font-bold text-emerald-300">
                        Scanning Step {scanStep}/5...
                      </span>
                    </div>
                  )}

                  <p className="text-xs break-words">
                    {activeMessage ? activeMessage.text : messageInput}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                    <span>
                      {analysisResult?.hasApk
                        ? "⚠️ Attachment: .apk package"
                        : "Text message"}
                    </span>
                    <span>17:05</span>
                  </div>
                </div>
              </div>

              {/* Virtual Phone Bottom Indicator */}
              <div className="pt-1 pb-0.5 text-center">
                <div className="w-24 h-1 rounded-full bg-zinc-800 mx-auto" />
              </div>
            </div>
          </div>

          {/* Pipeline Stepper & Result Card (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Animated 5-Step Progress Stepper */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-zinc-300 uppercase">
                  5-Step Heuristic Pipeline
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {isScanning ? (
                    <span className="animate-pulse">Inspecting (Step {scanStep}/5)...</span>
                  ) : analysisResult ? (
                    `Completed &middot; Score ${analysisResult.score}/100`
                  ) : (
                    "Ready"
                  )}
                </span>
              </div>

              {/* Steps Progress Grid */}
              <div className="grid grid-cols-5 gap-1.5">
                {PIPELINE_STEPS.map((step) => {
                  const isCurrent = isScanning && scanStep === step.num
                  const isCompleted = (!isScanning && analysisResult !== null) || scanStep > step.num

                  return (
                    <div
                      key={step.num}
                      className={cn(
                        "rounded p-2 text-center border transition-all flex flex-col items-center justify-center gap-1",
                        isCurrent
                          ? "border-amber-500 bg-amber-950/40 text-amber-200 ring-1 ring-amber-500/50 animate-pulse"
                          : isCompleted
                          ? "border-emerald-800/80 bg-emerald-950/30 text-emerald-300"
                          : "border-zinc-800 bg-zinc-900/40 text-zinc-500"
                      )}
                    >
                      <div className="size-4 rounded-full flex items-center justify-center text-[10px] font-bold">
                        {isCompleted && !isCurrent ? (
                          <CheckCircle2 className="size-3 text-emerald-400" />
                        ) : (
                          <span>{step.num}</span>
                        )}
                      </div>
                      <span className="text-[9px] font-bold leading-tight">
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Analysis Result Card */}
            {analysisResult && (
              <div
                className={cn(
                  "rounded-lg border p-4 space-y-4 animate-in fade-in-50 duration-300",
                  analysisResult.verdictColor === "red"
                    ? "border-rose-700/80 bg-rose-950/20"
                    : analysisResult.verdictColor === "amber"
                    ? "border-amber-700/80 bg-amber-950/20"
                    : "border-emerald-700/80 bg-emerald-950/20"
                )}
              >
                {/* Result Header & Verdict */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    {analysisResult.verdictColor === "red" ? (
                      <ShieldAlert className="size-5 text-rose-400" />
                    ) : analysisResult.verdictColor === "amber" ? (
                      <AlertTriangle className="size-5 text-amber-400" />
                    ) : (
                      <ShieldCheck className="size-5 text-emerald-400" />
                    )}
                    <div>
                      <span className="text-xs text-zinc-400 uppercase font-bold block">
                        Verdict
                      </span>
                      <p
                        className={cn(
                          "text-base font-extrabold uppercase tracking-wide",
                          analysisResult.verdictColor === "red"
                            ? "text-rose-400"
                            : analysisResult.verdictColor === "amber"
                            ? "text-amber-400"
                            : "text-emerald-400"
                        )}
                      >
                        {analysisResult.verdict}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-xs font-mono font-bold px-2.5 py-1",
                        analysisResult.verdictColor === "red"
                          ? "bg-rose-900/60 border border-rose-600 text-rose-200"
                          : analysisResult.verdictColor === "amber"
                          ? "bg-amber-900/60 border border-amber-600 text-amber-200"
                          : "bg-emerald-900/60 border border-emerald-600 text-emerald-200"
                      )}
                    >
                      Risk Score: {analysisResult.score} / 100
                    </Badge>
                  </div>
                </div>

                {/* Warning Message */}
                <div className="rounded bg-black/50 p-3.5 border border-zinc-800">
                  <p className="text-xs font-bold text-zinc-200 leading-snug">
                    {analysisResult.bilingualWarning.en}
                  </p>
                </div>

                {/* Defanged Links Section (if any links exist) */}
                {analysisResult.defangedUrls.length > 0 && (
                  <div className="space-y-1 bg-zinc-900/80 p-3 rounded border border-zinc-800 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-bold">
                      <LinkIcon className="size-3 text-cyan-400" />
                      <span>Extracted Link (Defanged for Safety):</span>
                    </div>
                    {analysisResult.defangedUrls.map((url, i) => (
                      <code
                        key={i}
                        className="block font-mono text-[11px] text-amber-300 bg-black/60 px-2 py-1 rounded break-all select-all"
                      >
                        {url}
                      </code>
                    ))}
                  </div>
                )}

                {/* Findings Accordion ("Why this verdict") */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowFindingsDetails(!showFindingsDetails)}
                    className="flex items-center justify-between w-full text-xs font-bold text-zinc-300 hover:text-zinc-100 py-1"
                  >
                    <span>
                      Why this verdict ({analysisResult.findings.length} findings)
                    </span>
                    {showFindingsDetails ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </button>

                  {showFindingsDetails && (
                    <div className="space-y-1.5 pt-1">
                      {analysisResult.findings.map((f, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-2 p-2 rounded bg-zinc-900/60 border border-zinc-800 text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-zinc-200 block">
                              {f.title}
                            </span>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">
                              {f.description}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 font-bold px-1.5 py-0.5 rounded text-[10px]",
                              f.points > 0
                                ? "bg-rose-950 border border-rose-800 text-rose-300"
                                : "bg-emerald-950 border border-emerald-800 text-emerald-300"
                            )}
                          >
                            {f.points > 0 ? `+${f.points}` : "0"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Integration Action: "User installs the app anyway" */}
                {analysisResult.hasApk && (
                  <div className="pt-2 border-t border-zinc-800/80">
                    <Button
                      type="button"
                      onClick={handleUserInstallsAnyway}
                      disabled={isRunning}
                      className="w-full h-9 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                    >
                      <Flame className="size-4 fill-current" />
                      <span>User installs the app anyway</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                    <p className="text-[10px] text-zinc-500 text-center mt-1">
                      Simulates victim proceeding with sideloading. Hands off to RTO Challan Kill-Chain (Stage 1 Lure).
                    </p>
                  </div>
                )}

                {/* External Safety Reporting Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/60">
                  {(analysisResult.verdictColor === "red" || analysisResult.verdictColor === "amber") && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowComplaintKit(true)}
                      className="h-8 px-3 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <FileText className="size-3.5" />
                      <span>Generate Complaint Kit</span>
                    </Button>
                  )}

                  <a
                    href="https://cybercrime.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition-colors"
                  >
                    <Globe className="size-3.5 text-cyan-400" />
                    <span>Report on cybercrime.gov.in</span>
                    <ExternalLink className="size-3 text-zinc-500" />
                  </a>

                  <a
                    href="tel:1930"
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded border border-rose-800 bg-rose-950/60 hover:bg-rose-900 text-rose-200 text-xs font-medium transition-colors"
                  >
                    <Phone className="size-3.5 text-rose-400" />
                    <span>Call 1930</span>
                  </a>

                  <span className="text-[10px] text-zinc-500 ml-auto italic">
                    Links only; nothing is sent.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mandatory Transparency Note Under Panel */}
        <div className="pt-3 border-t border-zinc-900 text-center">
          <p className="text-xs text-zinc-500 font-mono">
            Rule-based checks, running on your device. No message leaves the browser.
          </p>
        </div>
      </div>

      {/* Cyber Fraud Complaint Kit Modal */}
      <ComplaintKitModal
        isOpen={showComplaintKit}
        onClose={() => setShowComplaintKit(false)}
        initialSender={activeMessage?.sender || senderInput}
        initialMessage={activeMessage?.text || messageInput}
        initialFindings={analysisResult?.findings || []}
        initialScore={analysisResult?.score || 0}
        initialDefangedUrls={analysisResult?.defangedUrls || []}
        initialHasApk={analysisResult?.hasApk || false}
        initialApkName={analysisResult?.apkUrl || "Sideload APK"}
        sourceContext="sms-shield"
      />
    </div>
  )
}

