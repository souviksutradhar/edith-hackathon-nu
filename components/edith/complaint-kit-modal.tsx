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
    const portalSnippet = `INCIDENT SUMMARY:
${legalMapping.summaryTemplate(complaintData)}

EVIDENCE:
- Sender / Header: ${complaintData.sender}
- Received Timestamp: ${complaintData.timestamp}
- Full Message Content: "${complaintData.message}"
- Defanged Links / Malicious Payloads: ${complaintData.defangedUrls.join(", ") || "None"}
- Target APK: ${complaintData.apkName || "None"}
- Browser SHA-256 Seal: ${complaintData.evidenceHash}

INDICATIVE LEGAL SECTIONS FOR INVESTIGATION:
BNS 2023: ${legalMapping.bnsSections.join("; ")}
IT Act: ${legalMapping.itActSections.join("; ")}

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-6 overflow-y-auto no-print">
        <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl border border-zinc-700 bg-zinc-950 text-zinc-100 font-mono shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-5 py-3.5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-400">
                <FileCheck className="size-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                    Cyber Fraud Complaint Kit
                  </h3>
                  <Badge variant="outline" className="border-emerald-600/40 text-emerald-400 text-[10px]">
                    Ready in {(generationTimeMs / 1000).toFixed(2)}s
                  </Badge>
                </div>
                <span className="text-[11px] text-zinc-400">
                  Incident ID: {complaintData.incidentId} &middot; Fully in-browser draft
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="overflow-y-auto p-5 space-y-6 flex-1 text-xs">
            {/* Top Next-3-Steps Guidance Box (English Only) */}
            <div className="rounded-lg border border-amber-600/60 bg-amber-950/20 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider text-xs">
                <ShieldAlert className="size-4 text-amber-400" />
                <span>Next 3 Steps</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed text-zinc-300 pt-1">
                <div className="p-2.5 rounded bg-black/40 border border-amber-900/40 space-y-1">
                  <span className="font-bold text-amber-200 block">
                    1. Save Screenshots &amp; Stop
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Save screenshots of the message and link before deleting anything. Never share your OTP or PIN.
                  </p>
                </div>

                <div className="p-2.5 rounded bg-black/40 border border-amber-900/40 space-y-1">
                  <span className="font-bold text-amber-200 block">
                    2. Report on {lostMoney ? "1930 / Portal" : "Chakshu"}
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    {lostMoney
                      ? "Call 1930 immediately within the golden hour to freeze unauthorized bank transfers."
                      : "Report the sender number on Chakshu (Sanchar Saathi) to request line disconnection."}
                  </p>
                </div>

                <div className="p-2.5 rounded bg-black/40 border border-amber-900/40 space-y-1">
                  <span className="font-bold text-amber-200 block">
                    3. Use this Draft
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Copy or print this draft for filing on cybercrime.gov.in or presenting at your nearest cyber cell.
                  </p>
                </div>
              </div>
            </div>

            {/* STEP 1: Two Quick Interactive Questions */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
              <span className="text-xs uppercase font-bold text-zinc-300 tracking-wide block">
                Quick Assessment (Prefilled for instant generation)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Question 1: Did you lose money? */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-semibold block">
                    Did you lose money?
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setLostMoney(false)}
                      className={cn(
                        "h-8 px-4 text-xs font-bold font-mono transition-all",
                        !lostMoney
                          ? "bg-emerald-600 text-zinc-950 hover:bg-emerald-500"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      )}
                    >
                      No
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setLostMoney(true)}
                      className={cn(
                        "h-8 px-4 text-xs font-bold font-mono transition-all",
                        lostMoney
                          ? "bg-rose-600 text-white hover:bg-rose-500"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      )}
                    >
                      Yes (Financial Loss)
                    </Button>
                  </div>
                </div>

                {/* Question 2: Did you install the app? */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-semibold block">
                    Did you install the app?
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setInstalledApp("No")}
                      className={cn(
                        "h-8 px-3 text-xs font-bold font-mono transition-all",
                        installedApp === "No"
                          ? "bg-emerald-600 text-zinc-950 hover:bg-emerald-500"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      )}
                    >
                      No
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setInstalledApp("Yes")}
                      className={cn(
                        "h-8 px-3 text-xs font-bold font-mono transition-all",
                        installedApp === "Yes"
                          ? "bg-rose-600 text-white hover:bg-rose-500"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      )}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setInstalledApp("Not applicable")}
                      className={cn(
                        "h-8 px-3 text-xs font-bold font-mono transition-all",
                        installedApp === "Not applicable"
                          ? "bg-cyan-600 text-zinc-950 hover:bg-cyan-500"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      )}
                    >
                      Not applicable
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3: Routing & Action Guidance Card */}
            <div className="rounded-lg border border-cyan-800/60 bg-cyan-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-cyan-300 tracking-wide">
                  Recommended Routing &amp; Immediate Safeguards
                </span>
                <Badge variant="outline" className="border-cyan-600/40 text-cyan-300 text-[10px]">
                  {lostMoney ? "Financial Cyber Fraud Priority" : "Preventative Carrier Takedown"}
                </Badge>
              </div>

              {/* Loss Routing Banner */}
              {lostMoney ? (
                <div className="rounded bg-rose-950/40 border border-rose-800/80 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 font-bold">
                    <AlertOctagon className="size-4 text-rose-400" />
                    <span>EMERGENCY FINANCIAL PROTOCOL: ACT WITHIN GOLDEN HOUR</span>
                  </div>
                  <ul className="text-xs text-rose-200/90 space-y-1 list-disc list-inside">
                    <li>
                      <strong>Dial 1930 immediately:</strong> National Cyber Crime Helpline coordinates with bank nodal officers to freeze recipient bank accounts.
                    </li>
                    <li>
                      <strong>Inform your bank:</strong> Call the number on the back of your card to freeze UPI IDs, netbanking, and compromised accounts.
                    </li>
                    <li>
                      <strong>Register complaint at cybercrime.gov.in:</strong> Obtains an acknowledgment number for formal FIR conversion.
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="rounded bg-emerald-950/40 border border-emerald-800/80 p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    <span>CARRIER &amp; SANCHAR SAATHI DISCONNECTION ROUTE</span>
                  </div>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    No financial debit occurred. Primary recommendation: <strong>Report on Chakshu (Sanchar Saathi)</strong> to trigger Department of Telecommunications (DoT) telecom cutoff. You may also file at <strong>cybercrime.gov.in</strong> for an official police log.
                  </p>
                </div>
              )}

              {/* Safety Steps if app was installed */}
              {installedApp === "Yes" && (
                <div className="rounded bg-amber-950/40 border border-amber-800/80 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <KeyRound className="size-4 text-amber-400" />
                    <span>MANDATORY DEVICE SANITIZATION (App was installed)</span>
                  </div>
                  <ol className="text-xs text-zinc-300 space-y-1 list-decimal list-inside leading-relaxed">
                    <li><strong>Do not open the app again:</strong> Keep it dormant.</li>
                    <li><strong>Uninstall immediately:</strong> Go to Android Settings &gt; Apps &gt; Uninstall.</li>
                    <li><strong>Revoke permissions:</strong> Check Settings &gt; Accessibility and disable any unverified service hooks.</li>
                    <li><strong>Protect bank accounts:</strong> Contact your bank to place a temporary watch on cards and UPI transactions.</li>
                    <li><strong>Reset credentials:</strong> Change banking passwords and UPI PINs from a different, clean device.</li>
                  </ol>
                </div>
              )}
            </div>

            {/* STEP 4: Rendered Printable Complaint Draft */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-zinc-300 tracking-wide">
                  Document Preview: Cyber Fraud Complaint Draft
                </span>
                <span className="text-[10px] text-zinc-500">
                  Format: Plaintext / Section 63 BSA Compatible
                </span>
              </div>

              {/* The Actual Draft Container (Printed on PDF) */}
              <div
                id="printable-complaint-draft"
                className="rounded-lg border border-zinc-800 bg-black/60 p-5 space-y-4 font-mono text-xs leading-relaxed text-zinc-200 max-h-[420px] overflow-y-auto select-text border-dashed"
              >
                {/* Header */}
                <div className="border-b border-zinc-800 pb-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-wider text-emerald-400">
                      CYBER FRAUD COMPLAINT DRAFT
                    </h2>
                    <span className="text-[10px] text-zinc-400">
                      {complaintData.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Prepared via E.D.I.T.H. Sovereign Mobile Defense Command Center &middot; Incident ID: <strong className="text-zinc-200">{complaintData.incidentId}</strong>
                  </p>
                  <p className="text-[10px] text-amber-400/90 italic pt-0.5">
                    Notice: This document is an auto-generated draft. It is NOT an FIR. Law enforcement authorities decide the applicable statutory sections.
                  </p>
                </div>

                {/* Section 1: Complainant Details */}
                <div className="space-y-1">
                  <strong className="text-zinc-100 uppercase tracking-wide block border-b border-zinc-800/80 pb-0.5">
                    1. Complainant Details
                  </strong>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300 text-[11px]">
                    <div>Name: _______________________________</div>
                    <div>Mobile: ______________________________</div>
                    <div>Address: ____________________________</div>
                    <div>Email: _______________________________</div>
                  </div>
                </div>

                {/* Section 2: Incident Summary */}
                <div className="space-y-1">
                  <strong className="text-zinc-100 uppercase tracking-wide block border-b border-zinc-800/80 pb-0.5">
                    2. Incident Summary ({legalMapping.categoryTitle})
                  </strong>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {legalMapping.summaryTemplate(complaintData)}
                  </p>
                </div>

                {/* Section 3: Digital Evidence */}
                <div className="space-y-1">
                  <strong className="text-zinc-100 uppercase tracking-wide block border-b border-zinc-800/80 pb-0.5">
                    3. Evidence &amp; Digital Artifacts
                  </strong>
                  <div className="space-y-1 text-zinc-300 text-[11px]">
                    <div>&bull; Sender ID / Number: <span className="text-emerald-300">{complaintData.sender}</span></div>
                    <div>&bull; Message Body: &ldquo;{complaintData.message}&rdquo;</div>
                    {complaintData.defangedUrls.length > 0 && (
                      <div>&bull; Defanged Link: <span className="text-amber-300">{complaintData.defangedUrls.join(", ")}</span></div>
                    )}
                    <div>&bull; Attachment / App: {complaintData.apkName || "None"}</div>
                    <div>&bull; Browser SHA-256 Hash Seal: <span className="text-emerald-400 select-all break-all">{complaintData.evidenceHash}</span></div>
                  </div>
                </div>

                {/* Section 4: What E.D.I.T.H. Detected */}
                <div className="space-y-1">
                  <strong className="text-zinc-100 uppercase tracking-wide block border-b border-zinc-800/80 pb-0.5">
                    4. What E.D.I.T.H. Rule Engine Detected
                  </strong>
                  <div className="space-y-1 text-zinc-300 text-[11px]">
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

                {/* Section 5: Sections Police May Consider */}
                <div className="space-y-1">
                  <strong className="text-zinc-100 uppercase tracking-wide block border-b border-zinc-800/80 pb-0.5">
                    5. Sections Police May Consider (Indicative, not legal advice)
                  </strong>
                  <div className="text-[11px] text-zinc-300 space-y-1">
                    <div>
                      <span className="text-zinc-400 font-semibold">Bharatiya Nyaya Sanhita (BNS) 2023:</span>
                      <ul className="list-disc list-inside pl-2">
                        {legalMapping.bnsSections.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-zinc-400 font-semibold">Information Technology Act 2000:</span>
                      <ul className="list-disc list-inside pl-2">
                        {legalMapping.itActSections.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Section 6: Loss Details (if Yes) */}
                {complaintData.lostMoney && (
                  <div className="space-y-1">
                    <strong className="text-rose-400 uppercase tracking-wide block border-b border-rose-900/80 pb-0.5">
                      6. Financial Loss Particulars
                    </strong>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300 text-[11px]">
                      <div>Loss Amount: ₹ ________________________</div>
                      <div>Date &amp; Time: ________________________</div>
                      <div>Transaction / UTR ID: _________________</div>
                      <div>Bank &amp; Account No: ___________________</div>
                    </div>
                  </div>
                )}

                {/* Section 7: Relief Requested */}
                <div className="space-y-1">
                  <strong className="text-zinc-100 uppercase tracking-wide block border-b border-zinc-800/80 pb-0.5">
                    7. Relief Requested
                  </strong>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    I request registration of my complaint and appropriate action, including blocking of the sender number/link/app and freezing of the beneficiary account where applicable.
                  </p>
                </div>

                {/* Section 8: Declaration */}
                <div className="space-y-1 pt-2 border-t border-zinc-800">
                  <div className="flex justify-between items-end text-[11px] text-zinc-400 pt-3">
                    <div>Date &amp; Place: ______________________</div>
                    <div>Signature: ___________________________</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-2 text-center text-[10px] text-zinc-500 border-t border-zinc-900">
                  Auto-generated draft from rule-based checks. Not legal advice. Police decide the applicable sections. Nothing leaves your browser.
                </div>
              </div>
            </div>
          </div>

          {/* Modal Sticky Bottom Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-900/90 px-5 py-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              {/* Button: Download PDF via window.print() */}
              <Button
                type="button"
                size="sm"
                onClick={handlePrintPdf}
                className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs h-8 px-3"
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
                className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs h-8 px-3"
              >
                <Download className="mr-1.5 size-3.5 text-cyan-400" />
                Download .txt
              </Button>

              {/* Button: Copy text for portal description box */}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopyForPortal}
                className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs h-8 px-3"
              >
                {copiedText ? (
                  <>
                    <Check className="mr-1.5 size-3.5 text-emerald-400" />
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

            <div className="flex items-center gap-2 ml-auto">
              {/* Button: Open Primary Portal */}
              <a
                href={primaryPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs transition-colors"
              >
                <span>Open {primaryPortalName}</span>
                <ExternalLink className="size-3 text-zinc-950" />
              </a>

              {/* Call 1930 button if money lost */}
              {lostMoney && (
                <a
                  href="tel:1930"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
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

