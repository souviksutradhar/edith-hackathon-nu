"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  classifyCrime,
  computeClientSha256,
  generatePlainTextComplaint,
  LEGAL_SECTIONS_REGISTRY,
  ComplaintDataInput,
  redactOtpFromMessage,
  defangUrl,
  extractAndDefangUrls,
  getChakshuCategory,
  getChakshuShortDescription,
  getLegalElementsChecklist,
  formatElementsChecklistPlainText,
  SectionElementChecklist,
} from "@/lib/complaintEngine"
import { useSimulation } from "@/lib/simulation-context"
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  ExternalLink,
  Phone,
  ShieldAlert,
  AlertTriangle,
  X,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Building,
  AlertOctagon,
  KeyRound,
  FileCheck,
  Info,
  Radio,
} from "lucide-react"

export interface ComplaintKitProps {
  isOpen: boolean
  onClose: () => void
  initialSender?: string
  initialMessage?: string
  initialFindings?: Array<{ title: string; points: number; description?: string }>
  initialScore?: number
  initialDefangedUrls?: string[]
  initialHasApk?: boolean
  initialApkName?: string
  sourceContext?: "sms-shield" | "kill-chain"
}

export function ComplaintKitModal({
  isOpen,
  onClose,
  initialSender = "+91 98321 00000",
  initialMessage = "Pending e-challan Rs 500. Pay now to avoid legal action: http://parivahan-echallan.top/RTO_Challan.apk install the app",
  initialFindings = [],
  initialScore = 100,
  initialDefangedUrls = [],
  initialHasApk = true,
  initialApkName = "com.rto.echallan.quickpay (RTO Challan QuickPay)",
  sourceContext = "sms-shield",
}: ComplaintKitProps) {
  const { addEvent } = useSimulation()

  // Step 1: User state (in memory only, never stored)
  const [lostMoney, setLostMoney] = useState<boolean>(false)
  const [installedApp, setInstalledApp] = useState<"Yes" | "No" | "Not applicable">(
    initialHasApk || sourceContext === "kill-chain" ? "Yes" : "No"
  )

  // Timing measurement for "Ready in X s"
  const [generationTimeMs, setGenerationTimeMs] = useState<number>(42)
  const [evidenceHash, setEvidenceHash] = useState<string>(
    "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4"
  )
  const [copiedText, setCopiedText] = useState<boolean>(false)
  const loggedRef = useRef<boolean>(false)

  // Measure compilation speed on modal open & compute client hash
  useEffect(() => {
    if (isOpen) {
      const startTime = performance.now()
      loggedRef.current = false

      // Compute browser hash of incident details
      const payloadToHash = `${initialSender}|${initialMessage}|${new Date().toISOString()}`
      computeClientSha256(payloadToHash).then((h) => {
        setEvidenceHash(h)
        const elapsed = performance.now() - startTime
        setGenerationTimeMs(Math.max(12, Math.round(elapsed)))
      })

      // Add "Complaint kit generated" entry to Activity Logs once per open
      if (!loggedRef.current) {
        const now = new Date()
        const timeStr = now.toLocaleTimeString("en-GB", {
          timeZone: "Asia/Kolkata",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })

        addEvent({
          id: `evt-kit-${Date.now()}`,
          timestamp: `${timeStr} IST`,
          app: "Complaint Evidence Engine",
          process: "EDITH Incident Compiler",
          hook: "BSA Sec. 63 Certificate Generator",
          action: "KIT GENERATED",
          details: `Cyber Fraud Complaint Draft prepared for ${initialSender}. Rule-based legal sections mapped. Ready for victim filing.`,
          severity: "info",
        })
        loggedRef.current = true
      }
    }
  }, [isOpen, initialSender, initialMessage, addEvent])

  // Classification & legal mapping
  const crimeCategory = useMemo(() => {
    return classifyCrime({
      message: initialMessage,
      hasApk: initialHasApk,
      sender: initialSender,
      findings: initialFindings,
    })
  }, [initialMessage, initialHasApk, initialSender, initialFindings])

  const legalMapping = LEGAL_SECTIONS_REGISTRY[crimeCategory]

  // Prepared complaint data
  const complaintData: ComplaintDataInput = useMemo(() => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Kolkata",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    const dateStr = now.toISOString().split("T")[0]

    return {
      incidentId: `EDITH-INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: `${dateStr} ${timeStr} IST`,
      sender: initialSender,
      message: initialMessage,
      defangedUrls: initialDefangedUrls,
      findings: initialFindings,
      totalScore: initialScore,
      hasApk: initialHasApk,
      apkName: initialApkName,
      evidenceHash,
      lostMoney,
      installedApp,
      sourceChannel: initialSender.startsWith("+") || initialSender.includes("-") ? "SMS" : "WhatsApp",
    }
  }, [
    initialSender,
    initialMessage,
    initialDefangedUrls,
    initialFindings,
    initialScore,
    initialHasApk,
    initialApkName,
    evidenceHash,
    lostMoney,
    installedApp,
  ])

  // Derived Chakshu reporting values
  const chakshuCategory = useMemo(() => getChakshuCategory(crimeCategory), [crimeCategory])
  const chakshuDescription = useMemo(() => getChakshuShortDescription(crimeCategory), [crimeCategory])
  const redactedMessage = useMemo(() => redactOtpFromMessage(complaintData.message), [complaintData.message])
  const defangedLinks = useMemo(() => {
    if (complaintData.defangedUrls && complaintData.defangedUrls.length > 0) {
      return complaintData.defangedUrls.join(", ")
    }
    const extracted = extractAndDefangUrls(complaintData.message)
    return extracted.length > 0 ? extracted.join(", ") : "None detected"
  }, [complaintData.defangedUrls, complaintData.message])

  const detectedMedium = useMemo(() => {
    const s = (initialSender + " " + initialMessage).toLowerCase()
    if (s.includes("whatsapp")) return "WhatsApp"
    if (s.includes("call")) return "Call"
    return complaintData.sourceChannel || "SMS"
  }, [initialSender, initialMessage, complaintData.sourceChannel])

  // Elements checklist
  const legalElementsChecklist = useMemo(
    () => getLegalElementsChecklist(complaintData, crimeCategory),
    [complaintData, crimeCategory]
  )

  // Per-field copy button feedback
  const [copiedFieldKey, setCopiedFieldKey] = useState<string | null>(null)

  const handleCopyField = (key: string, value: string, label: string) => {
    navigator.clipboard.writeText(value)
    setCopiedFieldKey(key)
    toast.success(`${label} copied!`, {
      description: "Paste into the Chakshu form.",
    })
    setTimeout(() => {
      setCopiedFieldKey((curr) => (curr === key ? null : curr))
    }, 2000)
  }

  // Generate plain text version for copy and .txt download
  const plainTextDraft = useMemo(() => {
    return generatePlainTextComplaint(complaintData, legalMapping)
  }, [complaintData, legalMapping])

  if (!isOpen) return null

  // Handler: Download .txt via browser Blob
  const handleDownloadTxt = () => {
    const blob = new Blob([plainTextDraft], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Cyber-Fraud-Complaint-Draft-${complaintData.incidentId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Complaint draft downloaded (.TXT)", {
      description: "Ready to attach or upload to the cyber portal.",
    })
  }

  // Handler: Print / Download PDF via window.print()
  const handlePrintPdf = () => {
    window.print()
  }

  // Handler: Copy text for portal description box
  const handleCopyForPortal = () => {
    const elementsText = formatElementsChecklistPlainText(legalElementsChecklist)
    const portalSnippet = `INCIDENT SUMMARY:
${legalMapping.summaryTemplate(complaintData)}

EVIDENCE:
- Sender / Header: ${complaintData.sender}
- Received Timestamp: ${complaintData.timestamp}
- Full Message Content: "${complaintData.message}"
- Defanged Links / Malicious Payloads: ${defangedLinks}
- Target APK: ${complaintData.apkName || "None"}
- Browser SHA-256 Seal: ${complaintData.evidenceHash}

LAWS THAT MAY APPLY (Simplified and indicative. Police decide.):
${elementsText}

RELIEF SOUGHT:
I request registration of this complaint, blocking of the offender's mobile/link, and immediate freeze on beneficiary accounts if financial transfers occurred.`

    navigator.clipboard.writeText(portalSnippet)
    setCopiedText(true)
    toast.success("Portal snippet copied to clipboard!", {
      description: "Paste directly into cybercrime.gov.in / Chakshu description box.",
    })
    setTimeout(() => setCopiedText(false), 2500)
  }

  // Routing URLs based on user responses
  const primaryPortalName = lostMoney ? "cybercrime.gov.in" : "Chakshu (Sanchar Saathi)"
  const primaryPortalUrl = lostMoney
    ? "https://cybercrime.gov.in"
    : "https://sancharsaathi.gov.in/sfc/Home/sfc-complaint.jsp"

  return (
    <>
      {/* Dedicated Print Stylesheet: Shows ONLY the draft on pure white paper */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-complaint-draft,
          #printable-complaint-draft * {
            visibility: visible;
          }
          #printable-complaint-draft {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px !important;
            font-size: 11pt !important;
            line-height: 1.5 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Backdrop & Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#15122B]/60 backdrop-blur-sm p-3 md:p-6 overflow-y-auto no-print">
        <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-[20px] border border-[#E6E1FA] bg-white text-[#15122B] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-[#EEEAFB] bg-white px-6 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#ECE8FF] text-[#5B35F5]">
                <FileCheck className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-[#15122B]">
                    Cyber Fraud Complaint Kit
                  </h3>
                  <span className="rounded-full bg-[#E3F6EE] text-[#12704A] border border-[#1E9E6A]/20 text-[11px] font-semibold px-2.5 py-0.5">
                    Ready in {(generationTimeMs / 1000).toFixed(2)}s
                  </span>
                </div>
                <span className="text-xs text-[#5E5A7A]">
                  Incident ID: {complaintData.incidentId} &middot; Fully in-browser draft
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-[#5E5A7A] hover:bg-[#ECE8FF] hover:text-[#5B35F5] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="overflow-y-auto p-6 space-y-6 flex-1 text-sm">
            {/* Top Next-3-Steps Guidance Box */}
            <div className="rounded-[16px] border border-[#E6E1FA] bg-[#F9F8FF] p-5 space-y-3">
              <div className="flex items-center gap-2 text-[#5B35F5] font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="size-4 text-[#5B35F5]" />
                <span>Next 3 Steps</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed pt-1">
                <div className="p-3.5 rounded-[12px] bg-white border border-[#E6E1FA] space-y-1">
                  <span className="font-bold text-[#15122B] block">
                    1. Save Screenshots &amp; Stop
                  </span>
                  <p className="text-[11px] text-[#5E5A7A]">
                    Save screenshots of the message and link before deleting anything. Never share your OTP or PIN.
                  </p>
                </div>

                <div className="p-3.5 rounded-[12px] bg-white border border-[#E6E1FA] space-y-1">
                  <span className="font-bold text-[#15122B] block">
                    2. Report on {lostMoney ? "1930 / Portal" : "Chakshu"}
                  </span>
                  <p className="text-[11px] text-[#5E5A7A]">
                    {lostMoney
                      ? "Call 1930 immediately within the golden hour to freeze unauthorized bank transfers."
                      : "Report the sender number on Chakshu (Sanchar Saathi) to request line disconnection."}
                  </p>
                </div>

                <div className="p-3.5 rounded-[12px] bg-white border border-[#E6E1FA] space-y-1">
                  <span className="font-bold text-[#15122B] block">
                    3. Use this Draft
                  </span>
                  <p className="text-[11px] text-[#5E5A7A]">
                    Copy or print this draft for filing on cybercrime.gov.in or presenting at your nearest cyber cell.
                  </p>
                </div>
              </div>
            </div>

            {/* STEP 1: Two Quick Interactive Questions */}
            <div className="rounded-[16px] border border-[#E6E1FA] bg-[#F9F8FF] p-5 space-y-3">
              <span className="text-xs uppercase font-bold text-[#15122B] tracking-wide block">
                Quick Assessment (Prefilled for instant generation)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Question 1: Did you lose money? */}
                <div className="space-y-2">
                  <label className="text-xs text-[#15122B] font-semibold block">
                    Did you lose money?
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setLostMoney(false)}
                      className={cn(
                        "rounded-full h-8 px-4 text-xs font-semibold transition-all",
                        !lostMoney
                          ? "bg-[#5B35F5] text-white hover:bg-[#4A27D9]"
                          : "border border-[#E6E1FA] bg-white text-[#5E5A7A] hover:bg-[#ECE8FF]"
                      )}
                    >
                      No
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setLostMoney(true)}
                      className={cn(
                        "rounded-full h-8 px-4 text-xs font-semibold transition-all",
                        lostMoney
                          ? "bg-[#D64545] text-white hover:bg-[#B42318]"
                          : "border border-[#E6E1FA] bg-white text-[#5E5A7A] hover:bg-[#ECE8FF]"
                      )}
                    >
                      Yes (Financial Loss)
                    </Button>
                  </div>
                </div>

                {/* Question 2: Did you install the app? */}
                <div className="space-y-2">
                  <label className="text-xs text-[#15122B] font-semibold block">
                    Did you install the app?
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setInstalledApp("No")}
                      className={cn(
                        "rounded-full h-8 px-3.5 text-xs font-semibold transition-all",
                        installedApp === "No"
                          ? "bg-[#5B35F5] text-white hover:bg-[#4A27D9]"
                          : "border border-[#E6E1FA] bg-white text-[#5E5A7A] hover:bg-[#ECE8FF]"
                      )}
                    >
                      No
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setInstalledApp("Yes")}
                      className={cn(
                        "rounded-full h-8 px-3.5 text-xs font-semibold transition-all",
                        installedApp === "Yes"
                          ? "bg-[#D64545] text-white hover:bg-[#B42318]"
                          : "border border-[#E6E1FA] bg-white text-[#5E5A7A] hover:bg-[#ECE8FF]"
                      )}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setInstalledApp("Not applicable")}
                      className={cn(
                        "rounded-full h-8 px-3.5 text-xs font-semibold transition-all",
                        installedApp === "Not applicable"
                          ? "bg-[#5B35F5] text-white hover:bg-[#4A27D9]"
                          : "border border-[#E6E1FA] bg-white text-[#5E5A7A] hover:bg-[#ECE8FF]"
                      )}
                    >
                      Not applicable
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3: Routing & Action Guidance Card */}
            <div className="rounded-[16px] border border-[#E6E1FA] bg-[#F9F8FF] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#15122B] tracking-wide">
                  Recommended Routing &amp; Immediate Safeguards
                </span>
                <span className="rounded-full bg-[#ECE8FF] text-[#5B35F5] border border-[#5B35F5]/20 text-[11px] font-semibold px-2.5 py-0.5">
                  {lostMoney ? "Financial Cyber Fraud Priority" : "Preventative Carrier Takedown"}
                </span>
              </div>

              {/* Loss Routing Banner */}
              {lostMoney ? (
                <div className="rounded-[12px] bg-[#FDE8E6]/50 border border-[#D64545]/30 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[#B42318] font-bold">
                    <AlertOctagon className="size-4 text-[#D64545]" />
                    <span>EMERGENCY FINANCIAL PROTOCOL: ACT WITHIN GOLDEN HOUR</span>
                  </div>
                  <ul className="text-xs text-[#B42318] space-y-1 list-disc list-inside">
                    <li>
                      <strong>Dial 1930 immediately:</strong> National Cyber Crime Helpline coordinates with bank nodal officers to freeze recipient bank accounts.
                    </li>
                    <li>
                      <strong>Inform your bank:</strong> Call the number on the back of your card to freeze UPI IDs, netbanking, and compromised accounts.
                    </li>
                    <li>
                      <strong>Register complaint at cybercrime.gov.in:</strong> Obtains an acknowledgment number for formal police investigation.
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="rounded-[12px] bg-[#E3F6EE]/50 border border-[#1E9E6A]/30 p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#12704A] font-bold">
                    <CheckCircle2 className="size-4 text-[#1E9E6A]" />
                    <span>CARRIER &amp; SANCHAR SAATHI DISCONNECTION ROUTE</span>
                  </div>
                  <p className="text-xs text-[#12704A] leading-relaxed">
                    No financial debit occurred. Primary recommendation: <strong>Report on Chakshu (Sanchar Saathi)</strong> to trigger Department of Telecommunications (DoT) telecom cutoff. You may also file at <strong>cybercrime.gov.in</strong> for an official police log.
                  </p>
                </div>
              )}

              {/* Safety Steps if app was installed */}
              {installedApp === "Yes" && (
                <div className="rounded-[12px] bg-[#FFF1D6]/50 border border-[#D99A1E]/30 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[#8A5A00] font-bold">
                    <KeyRound className="size-4 text-[#D99A1E]" />
                    <span>MANDATORY DEVICE SANITIZATION (App was installed)</span>
                  </div>
                  <ol className="text-xs text-[#8A5A00] space-y-1 list-decimal list-inside leading-relaxed">
                    <li><strong>Do not open the app again:</strong> Keep it dormant.</li>
                    <li><strong>Uninstall immediately:</strong> Go to Android Settings &gt; Apps &gt; Uninstall.</li>
                    <li><strong>Revoke permissions:</strong> Check Settings &gt; Accessibility and disable any unverified service hooks.</li>
                    <li><strong>Protect bank accounts:</strong> Contact your bank to place a temporary watch on cards and UPI transactions.</li>
                    <li><strong>Reset credentials:</strong> Change banking passwords and UPI PINs from a different, clean device.</li>
                  </ol>
                </div>
              )}
            </div>

            {/* CHAKSHU CARD: Shown when money lost = No */}
            {!lostMoney && (
              <div className="rounded-[16px] border border-[#E6E1FA] bg-white p-5 space-y-4 shadow-none">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EEEAFB] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#ECE8FF] text-[#5B35F5]">
                      <Radio className="size-4 text-[#5B35F5]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#15122B]">
                        Report to Chakshu (Sanchar Saathi)
                      </h4>
                      <p className="text-xs text-[#5E5A7A]">
                        Department of Telecommunications (DoT) portal to request carrier disconnection of offending senders.
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-[#1E9E6A]/30 bg-[#E3F6EE] text-[#12704A] font-mono text-[11px] rounded-full px-2.5 py-0.5"
                  >
                    DoT Carrier Takedown
                  </Badge>
                </div>

                <p className="text-xs text-[#5E5A7A]">
                  Copy each field below and paste it directly into the official Chakshu submission form:
                </p>

                {/* Chakshu Form Fields with Dedicated Copy Buttons */}
                <div className="space-y-2.5">
                  {[
                    {
                      key: "medium",
                      label: "Medium (SMS / Call / WhatsApp)",
                      value: detectedMedium,
                    },
                    {
                      key: "category",
                      label: "Suspected category",
                      value: chakshuCategory,
                    },
                    {
                      key: "sender",
                      label: "Sender number or ID",
                      value: complaintData.sender,
                    },
                    {
                      key: "timestamp",
                      label: "Date and time received",
                      value: complaintData.timestamp,
                    },
                    {
                      key: "message",
                      label: "Message text (redacted of OTPs)",
                      value: redactedMessage,
                    },
                    {
                      key: "link",
                      label: "Suspicious link (shown defanged)",
                      value: defangedLinks,
                    },
                    {
                      key: "description",
                      label: "Short description (2 factual sentences from templates)",
                      value: chakshuDescription,
                    },
                  ].map((field) => (
                    <div
                      key={field.key}
                      className="p-3 rounded-[12px] bg-[#F9F8FF] border border-[#E6E1FA] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors hover:bg-white"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="text-[11px] font-bold text-[#5E5A7A] uppercase tracking-wider block">
                          {field.label}
                        </span>
                        <p className="text-xs font-mono text-[#15122B] break-words select-all leading-relaxed">
                          {field.value}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyField(field.key, field.value, field.label)}
                        className="h-8 text-xs rounded-full border-[#E6E1FA] bg-white hover:bg-[#ECE8FF] text-[#5B35F5] font-semibold px-3.5 shrink-0 self-end sm:self-center shadow-sm"
                      >
                        {copiedFieldKey === field.key ? (
                          <>
                            <Check className="size-3.5 mr-1 text-[#12704A]" />
                            <span className="text-[#12704A]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5 mr-1" />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>

                {/* WhatsApp Note */}
                <div className="rounded-[12px] bg-[#ECE8FF]/70 border border-[#5B35F5]/20 p-3 text-xs text-[#5B35F5] font-medium flex items-center gap-2">
                  <Info className="size-4 shrink-0 text-[#5B35F5]" />
                  <span>WhatsApp messages should also be reported inside WhatsApp.</span>
                </div>

                {/* Chakshu Action Button & Subtext */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <a
                    href="https://sancharsaathi.gov.in/sfc/Home/sfc-complaint.jsp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-[#5B35F5] hover:bg-[#4A27D9] text-white font-semibold text-xs transition-colors shadow-[0_4px_14px_rgba(91,53,245,0.18)]"
                  >
                    <span>Open Chakshu form</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                  <span className="text-[11px] text-[#5E5A7A] italic">
                    Nothing is sent automatically; the user pastes and submits.
                  </span>
                </div>
              </div>
            )}

            {/* LAWS THAT MAY APPLY & ELEMENTS CHECKLIST CARD */}
            <div className="rounded-[16px] border border-[#E6E1FA] bg-white p-5 space-y-4 shadow-none">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EEEAFB] pb-3">
                <div>
                  <h4 className="text-sm font-bold text-[#15122B]">
                    Laws that may apply
                  </h4>
                  <p className="text-xs text-[#5E5A7A]">
                    Automated checklist comparing evidence against statutory elements.
                  </p>
                </div>
                <span className="rounded-full bg-[#ECE8FF] text-[#5B35F5] border border-[#5B35F5]/30 text-[11px] font-semibold px-3 py-1">
                  Simplified and indicative. Police decide.
                </span>
              </div>

              {/* Elements Checklist Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {legalElementsChecklist.map((sec) => (
                  <div
                    key={sec.sectionId}
                    className="rounded-[12px] border border-[#E6E1FA] bg-[#F9F8FF] p-4 space-y-2.5"
                  >
                    <span className="text-xs font-bold text-[#15122B] block border-b border-[#EEEAFB] pb-1.5">
                      {sec.sectionName}
                    </span>
                    <ul className="space-y-2 text-xs">
                      {sec.elements.map((el) => (
                        <li key={el.id} className="flex items-start justify-between gap-2 text-[11px]">
                          <div className="flex items-start gap-1.5 min-w-0 flex-1">
                            {el.status === "shown" ? (
                              <CheckCircle2 className="size-3.5 text-[#1E9E6A] shrink-0 mt-0.5" />
                            ) : el.status === "needs_facts" ? (
                              <span className="size-2 rounded-full bg-[#D99A1E] shrink-0 mt-1" />
                            ) : (
                              <span className="size-2 rounded-full bg-[#CFC9EA] shrink-0 mt-1" />
                            )}
                            <div className="min-w-0">
                              <span
                                className={cn(
                                  "leading-tight block font-semibold",
                                  el.status === "shown"
                                    ? "text-[#15122B]"
                                    : el.status === "needs_facts"
                                    ? "text-[#8A5A00]"
                                    : "text-[#5E5A7A]"
                                )}
                              >
                                {el.label}
                              </span>
                              <span className="text-[10px] text-[#5E5A7A] block">
                                [{el.sourceNote}]
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-semibold shrink-0 px-2 py-0.5 rounded-full",
                              el.status === "shown"
                                ? "border-[#1E9E6A]/30 bg-[#E3F6EE] text-[#12704A]"
                                : el.status === "needs_facts"
                                ? "border-[#D99A1E]/30 bg-[#FFF1D6] text-[#8A5A00]"
                                : "border-[#E6E1FA] bg-white text-[#5E5A7A]"
                            )}
                          >
                            {el.statusLabel}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 4: Rendered Printable Complaint Draft */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#15122B] tracking-wide">
                  Document Preview: Cyber Fraud Complaint Draft
                </span>
                <span className="text-xs text-[#5E5A7A]">
                  Format: Plaintext / Section 63 BSA Compatible
                </span>
              </div>

              {/* The Actual Draft Container (Printed on PDF) */}
              <div
                id="printable-complaint-draft"
                className="rounded-[16px] border border-[#E6E1FA] bg-[#F9F8FF] p-5 space-y-4 font-mono text-xs leading-relaxed text-[#15122B] max-h-[420px] overflow-y-auto select-text border-dashed"
              >
                {/* Header */}
                <div className="border-b border-[#EEEAFB] pb-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-wider text-[#5B35F5]">
                      CYBER FRAUD COMPLAINT DRAFT
                    </h2>
                    <span className="text-xs text-[#5E5A7A]">
                      {complaintData.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-[#5E5A7A]">
                    Prepared via E.D.I.T.H. Sovereign Mobile Defense Command Center &middot; Incident ID: <strong className="text-[#15122B]">{complaintData.incidentId}</strong>
                  </p>
                  <p className="text-[11px] text-[#8A5A00] italic pt-0.5">
                    Notice: This document is an auto-generated Complaint draft. Law enforcement authorities decide the applicable statutory sections.
                  </p>
                </div>

                {/* Section 1: Complainant Details */}
                <div className="space-y-1">
                  <strong className="text-[#15122B] uppercase tracking-wide block border-b border-[#EEEAFB] pb-0.5">
                    1. Complainant Details
                  </strong>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#15122B] text-[11px]">
                    <div>Name: _______________________________</div>
                    <div>Mobile: ______________________________</div>
                    <div>Address: ____________________________</div>
                    <div>Email: _______________________________</div>
                  </div>
                </div>

                {/* Section 2: Incident Summary */}
                <div className="space-y-1">
                  <strong className="text-[#15122B] uppercase tracking-wide block border-b border-[#EEEAFB] pb-0.5">
                    2. Incident Summary ({legalMapping.categoryTitle})
                  </strong>
                  <p className="text-[#15122B] text-[11px] leading-relaxed">
                    {legalMapping.summaryTemplate(complaintData)}
                  </p>
                </div>

                {/* Section 3: Digital Evidence */}
                <div className="space-y-1">
                  <strong className="text-[#15122B] uppercase tracking-wide block border-b border-[#EEEAFB] pb-0.5">
                    3. Evidence &amp; Digital Artifacts
                  </strong>
                  <div className="space-y-1 text-[#15122B] text-[11px]">
                    <div>&bull; Sender ID / Number: <span className="text-[#12704A] font-semibold">{complaintData.sender}</span></div>
                    <div>&bull; Message Body: &ldquo;{complaintData.message}&rdquo;</div>
                    {complaintData.defangedUrls.length > 0 && (
                      <div>&bull; Defanged Link: <span className="text-[#8A5A00] font-semibold">{complaintData.defangedUrls.join(", ")}</span></div>
                    )}
                    <div>&bull; Attachment / App: {complaintData.apkName || "None"}</div>
                    <div>&bull; Browser SHA-256 Hash Seal: <span className="text-[#5B35F5] select-all break-all font-semibold">{complaintData.evidenceHash}</span></div>
                  </div>
                </div>

                {/* Section 4: What E.D.I.T.H. Detected */}
                <div className="space-y-1">
                  <strong className="text-[#15122B] uppercase tracking-wide block border-b border-[#EEEAFB] pb-0.5">
                    4. What E.D.I.T.H. Rule Engine Detected
                  </strong>
                  <div className="space-y-1 text-[#15122B] text-[11px]">
                    {complaintData.findings.length > 0 ? (
                      complaintData.findings.map((f, i) => (
                        <div key={i}>
                          &bull; [{f.points > 0 ? `+${f.points}` : "0"} pts] {f.title}: {f.description || ""}
                        </div>
                      ))
                    ) : (
                      <div>&bull; Heuristic indicators flagged risk score {complaintData.totalScore}/100.</div>
                    )}
                  </div>
                </div>

                {/* Section 5: Laws that may apply */}
                <div className="space-y-2">
                  <div className="border-b border-[#EEEAFB] pb-1 flex flex-wrap items-center justify-between gap-1">
                    <strong className="text-[#15122B] uppercase tracking-wide">
                      5. Laws that may apply
                    </strong>
                    <span className="text-[10px] text-[#5E5A7A] italic">
                      Simplified and indicative. Police decide.
                    </span>
                  </div>
                  <div className="text-[11px] text-[#15122B] space-y-2">
                    {legalElementsChecklist.map((sec) => (
                      <div key={sec.sectionId} className="space-y-1">
                        <span className="font-semibold text-[#5B35F5] block">• {sec.sectionName}:</span>
                        <div className="pl-3 space-y-0.5">
                          {sec.elements.map((el) => (
                            <div key={el.id} className="flex flex-wrap items-center gap-1.5">
                              {el.status === "shown" ? (
                                <span className="text-[#12704A] font-semibold">[✓ Shown by this message]</span>
                              ) : el.status === "needs_facts" ? (
                                <span className="text-[#8A5A00] font-semibold">[• Needs your facts]</span>
                              ) : (
                                <span className="text-[#5E5A7A]">[- Not indicated]</span>
                              )}
                              <span>{el.label}</span>
                              <span className="text-[10px] text-[#5E5A7A]">[{el.sourceNote}]</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 6: Loss Details (if Yes) */}
                {complaintData.lostMoney && (
                  <div className="space-y-1">
                    <strong className="text-[#B42318] uppercase tracking-wide block border-b border-[#D64545]/30 pb-0.5">
                      6. Financial Loss Particulars
                    </strong>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#15122B] text-[11px]">
                      <div>Loss Amount: ₹ ________________________</div>
                      <div>Date &amp; Time: ________________________</div>
                      <div>Transaction / UTR ID: _________________</div>
                      <div>Bank &amp; Account No: ___________________</div>
                    </div>
                  </div>
                )}

                {/* Section 7: Relief Requested */}
                <div className="space-y-1">
                  <strong className="text-[#15122B] uppercase tracking-wide block border-b border-[#EEEAFB] pb-0.5">
                    7. Relief Requested
                  </strong>
                  <p className="text-[11px] text-[#15122B] leading-relaxed">
                    I request registration of my complaint and appropriate action, including blocking of the sender number/link/app and freezing of the beneficiary account where applicable.
                  </p>
                </div>

                {/* Section 8: Declaration */}
                <div className="space-y-1 pt-2 border-t border-[#EEEAFB]">
                  <div className="flex justify-between items-end text-[11px] text-[#5E5A7A] pt-3">
                    <div>Date &amp; Place: ______________________</div>
                    <div>Signature: ___________________________</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-2 text-center text-[10px] text-[#5E5A7A] border-t border-[#EEEAFB]">
                  Auto-generated Complaint draft from rule-based checks. Not legal advice. Police decide the applicable sections. Nothing leaves your browser.
                </div>
              </div>
            </div>
          </div>

          {/* Modal Sticky Bottom Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EEEAFB] bg-white px-6 py-4 shrink-0">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Button: Download PDF via window.print() */}
              <Button
                type="button"
                size="sm"
                onClick={handlePrintPdf}
                className="rounded-full bg-[#5B35F5] hover:bg-[#4A27D9] text-white font-semibold text-xs h-9 px-4 shadow-[0_4px_14px_rgba(91,53,245,0.18)]"
              >
                <Printer className="mr-1.5 size-3.5" />
                Download PDF
              </Button>

              {/* Button: Download .txt */}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleDownloadTxt}
                className="rounded-full border border-[#E6E1FA] bg-white hover:bg-[#ECE8FF] text-[#5B35F5] text-xs font-semibold h-9 px-4"
              >
                <Download className="mr-1.5 size-3.5" />
                Download .txt
              </Button>

              {/* Button: Copy text for portal description box */}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopyForPortal}
                className="rounded-full border border-[#E6E1FA] bg-white hover:bg-[#ECE8FF] text-[#5B35F5] text-xs font-semibold h-9 px-4"
              >
                {copiedText ? (
                  <>
                    <Check className="mr-1.5 size-3.5 text-[#1E9E6A]" />
                    Copied to Clipboard
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 size-3.5" />
                    Copy text for portal
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              {/* Button: Open Primary Portal */}
              <a
                href={primaryPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[#E6E1FA] bg-[#F9F8FF] hover:bg-[#ECE8FF] text-[#5B35F5] font-semibold text-xs transition-colors"
              >
                <span>Open {primaryPortalName}</span>
                <ExternalLink className="size-3 text-[#5B35F5]" />
              </a>

              {/* Call 1930 button if money lost */}
              {lostMoney && (
                <a
                  href="tel:1930"
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#D64545] hover:bg-[#B42318] text-white font-bold text-xs transition-colors shadow-sm"
                >
                  <Phone className="size-3" />
                  <span>Call 1930</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

