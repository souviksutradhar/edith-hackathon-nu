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

    // Step 5: Verdict compilation (2400ms -> 3000ms)
    const t5 = setTimeout(() => {
      setIsScanning(false)
      setAnalysisResult(evaluated)

      if (evaluated.verdictColor === "red") {
        toast.error(`Threat Detected: ${evaluated.verdict}`, {
          description: `Score: ${evaluated.score}/100. High-risk coercion or lookalike link.`,
        })
      } else if (evaluated.verdictColor === "amber") {
        toast.warning(`Suspicious SMS: ${evaluated.verdict}`, {
          description: `Score: ${evaluated.score}/100. Proceed with extreme caution.`,
        })
      } else {
        toast.success(`Verified Sender: ${evaluated.verdict}`, {
          description: `Score: ${evaluated.score}/100. Header matches approved registry.`,
        })
      }
    }, 3000)
    scanTimersRef.current.push(t5)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearScanTimers()
    }
  }, [])

  // Auto-run first sample scan on initial mount so judges see immediate data
  useEffect(() => {
    const timer = setTimeout(() => {
      handleReceiveAndScan(SAMPLE_SMS_LIST[0].sender, SAMPLE_SMS_LIST[0].message)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  // Handler: "User installs the app anyway" -> runs full kill-chain attack simulation
  const handleUserInstallsAnyway = () => {
    toast.info("Simulating user installing APK from WhatsApp lure...", {
      description: "Transferring to Kill-Chain Stage 1 Ingress.",
    })
    runSimulation()

    // Smooth scroll down to kill-chain section
    const elem = document.getElementById("kill-chain-tracker")
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" })
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
    <div className="space-y-4">
      {/* Outer Card with Header */}
      <div className="rounded-[20px] border border-[#E6E1FA] bg-white p-6 space-y-5 shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EEEAFB] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ECE8FF] text-[#5B35F5]">
              <Smartphone className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-[#15122B]">
                  Virtual Phone: SMS Shield
                </h2>
                <span className="rounded-full bg-[#E3F6EE] text-[#12704A] border border-[#1E9E6A]/20 text-[11px] font-semibold px-2.5 py-0.5">
                  Client-side ingress
                </span>
              </div>
              <p className="text-xs text-[#5E5A7A] mt-0.5">
                Inspect incoming SMS lures in a simulated device environment before permission escalation occurs.
              </p>
            </div>
          </div>

          {/* Quick Preset Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs text-[#5E5A7A] font-medium">Sample SMS:</span>
            <select
              value={isCustomMode ? "custom" : selectedSampleId}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setIsCustomMode(true)
                } else {
                  handleSelectSample(e.target.value)
                }
              }}
              className="bg-white border border-[#E6E1FA] text-[#15122B] text-xs rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5B35F5]"
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
              className="rounded-full h-9 px-4 text-xs bg-[#5B35F5] hover:bg-[#4A27D9] text-white font-semibold shadow-sm"
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
          <div className="rounded-[16px] border border-[#E6E1FA] bg-[#F9F8FF] p-4 space-y-3 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#15122B] uppercase">
                Custom Ingress Simulator
              </span>
              <span className="text-xs text-[#5E5A7A]">
                Type any sender ID and message text to test deterministic rules
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[#5E5A7A] block mb-1 font-medium">Sender Number / Header</label>
                <Input
                  value={senderInput}
                  onChange={(e) => setSenderInput(e.target.value)}
                  placeholder="e.g., +91 98321 00000 or AD-SBIINB"
                  className="h-9 text-xs"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#5E5A7A] block mb-1 font-medium">Incoming Message Body</label>
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Paste SMS content or malicious link here..."
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Two-Column Display: Left = Phone-Shaped Inbox; Right = Pipeline Stepper & Result Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Phone-Shaped Inbox Mockup (5 cols) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[340px] rounded-[32px] border-4 border-[#E6E1FA] bg-white shadow-md p-3.5 flex flex-col space-y-3 relative overflow-hidden">
              {/* Phone Top Notch & Status Bar */}
              <div className="flex items-center justify-between px-3 pt-1 text-xs text-[#5E5A7A] border-b border-[#EEEAFB] pb-2">
                <span className="font-bold text-[#15122B]">17:05</span>
                <div className="w-16 h-3 rounded-full bg-[#E6E1FA] mx-auto" />
                <div className="flex items-center gap-1.5">
                  <Wifi className="size-3 text-[#5E5A7A]" />
                  <Radio className="size-3 text-[#5E5A7A]" />
                  <Battery className="size-3.5 text-[#5E5A7A]" />
                </div>
              </div>

              {/* Messaging App Bar */}
              <div className="flex items-center justify-between px-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-[#ECE8FF] text-[#5B35F5] flex items-center justify-center font-bold text-xs">
                    {activeMessage ? activeMessage.sender.slice(0, 2).toUpperCase() : "ED"}
                  </div>
                  <div>
                    <p className="font-bold text-[#15122B] text-xs truncate max-w-[170px]">
                      {activeMessage ? activeMessage.sender : senderInput}
                    </p>
                    <span className="text-[11px] text-[#5E5A7A]">SIM 1 &middot; SMS</span>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold",
                    isScanning
                      ? "border border-[#D99A1E]/30 text-[#8A5A00] bg-[#FFF1D6] animate-pulse"
                      : analysisResult?.verdictColor === "red"
                      ? "border border-[#D64545]/30 text-[#B42318] bg-[#FDE8E6]"
                      : analysisResult?.verdictColor === "amber"
                      ? "border border-[#D99A1E]/30 text-[#8A5A00] bg-[#FFF1D6]"
                      : "border border-[#1E9E6A]/30 text-[#12704A] bg-[#E3F6EE]"
                  )}
                >
                  {isScanning
                    ? "SCANNING..."
                    : analysisResult
                    ? analysisResult.verdict.toUpperCase()
                    : "STANDBY"}
                </span>
              </div>

              {/* Phone Message Body Area */}
              <div className="min-h-[220px] rounded-[18px] bg-[#F9F8FF] p-3.5 flex flex-col justify-end space-y-2 border border-[#E6E1FA]">
                <div className="text-center text-[11px] text-[#5E5A7A] py-1">
                  Today &middot; 24h IST
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    "rounded-[16px] rounded-tl-xs p-3.5 text-xs leading-relaxed space-y-1.5 transition-all shadow-sm relative",
                    analysisResult?.verdictColor === "red"
                      ? "bg-[#FDE8E6] border border-[#D64545]/30 text-[#B42318]"
                      : analysisResult?.verdictColor === "amber"
                      ? "bg-[#FFF1D6] border border-[#D99A1E]/30 text-[#8A5A00]"
                      : analysisResult?.verdictColor === "green"
                      ? "bg-white border border-[#E6E1FA] text-[#15122B]"
                      : "bg-white border border-[#E6E1FA] text-[#15122B]"
                  )}
                >
                  {isScanning && (
                    <div className="absolute inset-0 bg-white/80 rounded-[16px] flex items-center justify-center gap-2 backdrop-blur-xs">
                      <Loader2 className="size-4 animate-spin text-[#5B35F5]" />
                      <span className="text-xs font-bold text-[#5B35F5]">
                        Scanning Step {scanStep}/5...
                      </span>
                    </div>
                  )}

                  <p className="text-xs break-words">
                    {activeMessage ? activeMessage.text : messageInput}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-[#5E5A7A] pt-1">
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
                <div className="w-24 h-1 rounded-full bg-[#E6E1FA] mx-auto" />
              </div>
            </div>
          </div>

          {/* Pipeline Stepper & Result Card (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Animated 5-Step Progress Stepper */}
            <div className="rounded-[20px] border border-[#E6E1FA] bg-white p-5 space-y-3 shadow-none">
              <div className="flex items-center justify-between border-b border-[#EEEAFB] pb-2.5">
                <span className="text-xs font-bold text-[#15122B] uppercase">
                  5-Step Heuristic Pipeline
                </span>
                <span className="text-xs font-semibold text-[#1E9E6A]">
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
              <div className="grid grid-cols-5 gap-2">
                {PIPELINE_STEPS.map((step) => {
                  const isCurrent = isScanning && scanStep === step.num
                  const isCompleted = (!isScanning && analysisResult !== null) || scanStep > step.num

                  return (
                    <div
                      key={step.num}
                      className={cn(
                        "rounded-[14px] p-2 text-center border transition-all flex flex-col items-center justify-center gap-1",
                        isCurrent
                          ? "border-2 border-[#5B35F5] bg-[#ECE8FF] text-[#5B35F5] ring-2 ring-[#ECE8FF]"
                          : isCompleted
                          ? "border-[#1E9E6A]/30 bg-[#E3F6EE] text-[#12704A]"
                          : "border-[#E6E1FA] bg-[#F9F8FF] text-[#5E5A7A]"
                      )}
                    >
                      <div className="size-5 rounded-full flex items-center justify-center text-xs font-bold">
                        {isCompleted && !isCurrent ? (
                          <CheckCircle2 className="size-3.5 text-[#1E9E6A]" />
                        ) : (
                          <span>{step.num}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold leading-tight">
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
                  "rounded-[20px] border p-5 space-y-4 animate-in fade-in-50 duration-300 bg-white",
                  analysisResult.verdictColor === "red"
                    ? "border-[#D64545]/40"
                    : analysisResult.verdictColor === "amber"
                    ? "border-[#D99A1E]/40"
                    : "border-[#1E9E6A]/40"
                )}
              >
                {/* Result Header & Verdict */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEEAFB] pb-3">
                  <div className="flex items-center gap-2.5">
                    {analysisResult.verdictColor === "red" ? (
                      <ShieldAlert className="size-6 text-[#D64545]" />
                    ) : analysisResult.verdictColor === "amber" ? (
                      <AlertTriangle className="size-6 text-[#D99A1E]" />
                    ) : (
                      <ShieldCheck className="size-6 text-[#1E9E6A]" />
                    )}
                    <div>
                      <span className="text-xs text-[#5E5A7A] uppercase font-semibold block">
                        Verdict
                      </span>
                      <p
                        className={cn(
                          "text-base font-extrabold uppercase tracking-wide",
                          analysisResult.verdictColor === "red"
                            ? "text-[#B42318]"
                            : analysisResult.verdictColor === "amber"
                            ? "text-[#8A5A00]"
                            : "text-[#12704A]"
                        )}
                      >
                        {analysisResult.verdict}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-semibold px-3 py-1 rounded-full",
                        analysisResult.verdictColor === "red"
                          ? "bg-[#FDE8E6] text-[#B42318] border border-[#D64545]/20"
                          : analysisResult.verdictColor === "amber"
                          ? "bg-[#FFF1D6] text-[#8A5A00] border border-[#D99A1E]/20"
                          : "bg-[#E3F6EE] text-[#12704A] border border-[#1E9E6A]/20"
                      )}
                    >
                      Risk Score: {analysisResult.score} / 100
                    </span>
                  </div>
                </div>

                {/* Warning Message */}
                <div className="rounded-[14px] bg-[#F9F8FF] p-4 border border-[#E6E1FA]">
                  <p className="text-xs font-semibold text-[#15122B] leading-relaxed">
                    {analysisResult.bilingualWarning.en}
                  </p>
                </div>

                {/* Defanged Links Section (if any links exist) */}
                {analysisResult.defangedUrls.length > 0 && (
                  <div className="space-y-1.5 bg-[#F9F8FF] p-3.5 rounded-[14px] border border-[#E6E1FA] text-xs">
                    <div className="flex items-center gap-1.5 text-[#5E5A7A] text-xs font-semibold">
                      <LinkIcon className="size-3.5 text-[#5B35F5]" />
                      <span>Extracted Link (Defanged for Safety):</span>
                    </div>
                    {analysisResult.defangedUrls.map((url, i) => (
                      <code
                        key={i}
                        className="block font-mono text-xs text-[#8A5A00] bg-white px-3 py-1.5 rounded-[8px] border border-[#E6E1FA] break-all select-all font-semibold"
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
                    className="flex items-center justify-between w-full text-xs font-bold text-[#15122B] hover:text-[#5B35F5] py-1 cursor-pointer"
                  >
                    <span>
                      Why this verdict ({analysisResult.findings.length} findings)
                    </span>
                    {showFindingsDetails ? (
                      <ChevronUp className="size-4 text-[#5E5A7A]" />
                    ) : (
                      <ChevronDown className="size-4 text-[#5E5A7A]" />
                    )}
                  </button>

                  {showFindingsDetails && (
                    <div className="space-y-2 pt-1">
                      {analysisResult.findings.map((f, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-3 p-3 rounded-[12px] bg-[#F9F8FF] border border-[#E6E1FA] text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-semibold text-[#15122B] block">
                              {f.title}
                            </span>
                            <p className="text-xs text-[#5E5A7A] leading-relaxed">
                              {f.description}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 font-bold px-2 py-0.5 rounded-full text-xs",
                              f.points > 0
                                ? "bg-[#FDE8E6] text-[#B42318] border border-[#D64545]/20"
                                : "bg-[#E3F6EE] text-[#12704A] border border-[#1E9E6A]/20"
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
                  <div className="pt-3 border-t border-[#EEEAFB]">
                    <Button
                      type="button"
                      onClick={handleUserInstallsAnyway}
                      disabled={isRunning}
                      className="w-full h-10 rounded-full bg-[#D64545] hover:bg-[#B42318] text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2"
                    >
                      <Flame className="size-4 fill-current" />
                      <span>User installs the app anyway</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                    <p className="text-[11px] text-[#5E5A7A] text-center mt-1.5">
                      Simulates victim proceeding with sideloading. Hands off to RTO Challan Kill-Chain (Stage 1 Lure).
                    </p>
                  </div>
                )}

                {/* External Safety Reporting Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-[#EEEAFB]">
                  {(analysisResult.verdictColor === "red" || analysisResult.verdictColor === "amber") && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowComplaintKit(true)}
                      className="h-9 px-4 rounded-full bg-[#5B35F5] hover:bg-[#4A27D9] text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-[0_4px_14px_rgba(91,53,245,0.18)]"
                    >
                      <FileText className="size-3.5" />
                      <span>Generate Complaint Kit</span>
                    </Button>
                  )}

                  <a
                    href="https://cybercrime.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[#E6E1FA] bg-white hover:bg-[#ECE8FF] text-[#5B35F5] text-xs font-semibold transition-colors"
                  >
                    <Globe className="size-3.5 text-[#5B35F5]" />
                    <span>Report on cybercrime.gov.in</span>
                    <ExternalLink className="size-3 text-[#5E5A7A]" />
                  </a>

                  <a
                    href="tel:1930"
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[#D64545]/30 bg-[#FDE8E6] text-[#B42318] text-xs font-bold transition-colors"
                  >
                    <Phone className="size-3.5 text-[#D64545]" />
                    <span>Call 1930</span>
                  </a>

                  <span className="text-[11px] text-[#5E5A7A] ml-auto italic">
                    Links only; nothing is sent.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mandatory Transparency Note Under Panel */}
        <div className="pt-3 border-t border-[#EEEAFB] text-center">
          <p className="text-xs text-[#5E5A7A]">
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
