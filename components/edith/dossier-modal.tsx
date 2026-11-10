"use client";

import { useState } from "react"
import { Check, Copy, Download, ExternalLink, FileText, Phone, Scale, ShieldAlert, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ComplaintDossier } from "@/lib/edith-data"

interface DossierModalProps {
  dossier: ComplaintDossier | null
  isOpen: boolean
  onClose: () => void
}

export function DossierModal({ dossier, isOpen, onClose }: DossierModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !dossier) return null

  const handleCopyDraft = () => {
    const text = `
NATIONAL CYBER CRIME REPORTING PORTAL (1930) - COMPLAINT DOSSIER
Reference ID: ${dossier.dossierId}
Generated At: ${dossier.generatedAt}
Reporting Helpline: Dial 1930 | Portal: https://cybercrime.gov.in

1. SUSPECT APPLICATION TELEMETRY:
- App Name: ${dossier.targetApp.name}
- Package Name: ${dossier.targetApp.packageName}
- SHA-256 Hash: ${dossier.targetApp.sha256}
- Install Source: ${dossier.targetApp.installSource}
- Declared Purpose: ${dossier.targetApp.declaredPurpose}
- Malicious Vector: ${dossier.targetApp.actualAbusePattern}

2. ATTEMPTED DATA EXFILTRATION:
${dossier.exfiltratedTargetData.map((d) => `- ${d}`).join("\n")}

3. AUTOMATED ZERO-TRUST ACTIONS EXECUTED BY E.D.I.T.H.:
${dossier.killSwitchMitigationsApplied.map((m) => `- ${m}`).join("\n")}

4. APPLICABLE STATUTORY PENAL PROVISIONS:
${dossier.applicableLaws.map((l) => `- ${l.section} (${l.act}): ${l.offense} [Penalty: ${l.penalty}]`).join("\n")}

5. EMERGENCY VICTIM ADVISORY:
${dossier.victimGuidance}
`.trim()

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dossier, null, 2))
    const downloadAnchor = document.createElement("a")
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `${dossier.dossierId}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dossier-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#15122B]/40 p-3 md:p-6 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[20px] border border-[#E6E1FA] bg-white p-5 md:p-7 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        {/* Official Header */}
        <div className="flex items-start gap-3.5 border-b border-border/80 pb-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
            <Scale className="size-6" />
          </div>
          <div className="min-w-0 pr-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-primary-foreground font-mono text-[10px] uppercase font-bold">
                Government of India &middot; NCRP 1930
              </Badge>
              <Badge variant="outline" className="border-border font-mono text-xs">
                Ref: {dossier.dossierId}
              </Badge>
            </div>
            <h2 id="dossier-modal-title" className="mt-1.5 text-lg md:text-xl font-bold tracking-tight text-foreground">
              National Cyber Crime Reporting Portal (1930) Complaint Dossier
            </h2>
            <p className="text-xs text-muted-foreground font-mono">
              Generated automatically by E.D.I.T.H. Heuristic Forensics &middot; {dossier.generatedAt}
            </p>
          </div>
        </div>

        {/* 1930 Helpline Banner */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger/10 p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger text-white">
              <Phone className="size-4 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-danger">
                National Cyber Crime Helpline: Dial 1930
              </p>
              <p className="text-xs text-foreground/85">
                Report financial fraud within the Golden Hour to freeze fraudulent recipient accounts.
              </p>
            </div>
          </div>
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-danger/40 bg-danger/15 px-2.5 py-1 text-xs font-bold text-danger hover:bg-danger/25 transition-colors"
          >
            cybercrime.gov.in <ExternalLink className="size-3" />
          </a>
        </div>

        {/* Suspect APK Forensics */}
        <div className="mt-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Suspect Application &amp; Abuse Vector
            </h3>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                <span className="text-muted-foreground block text-[11px]">App &amp; Package Name</span>
                <span className="font-semibold text-foreground">{dossier.targetApp.name}</span>
                <span className="block font-mono text-[11px] text-muted-foreground truncate">
                  {dossier.targetApp.packageName}
                </span>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Install Source</span>
                <span className="font-semibold text-danger">{dossier.targetApp.installSource}</span>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Declared Purpose</span>
                <span className="font-semibold text-foreground">{dossier.targetApp.declaredPurpose}</span>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                <span className="text-muted-foreground block text-[11px]">SHA-256 Checksum</span>
                <span className="font-mono text-[10px] text-foreground/80 break-all">
                  {dossier.targetApp.sha256}
                </span>
              </div>
            </div>
          </div>

          {/* Exfiltrated Data Targets */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              2. Attempted Exfiltration Targets (Intent Mismatch)
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {dossier.exfiltratedTargetData.map((item) => (
                <Badge key={item} variant="outline" className="border-danger/40 bg-danger/5 text-danger text-xs font-mono">
                  <ShieldAlert className="size-3 mr-1" />
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          {/* Statutory Legal Violations (BNS 2023 & IT Act 2000) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              3. Statutory Criminal Law Violations (India)
            </h3>
            <div className="mt-2 space-y-2">
              {dossier.applicableLaws.map((law) => (
                <div key={law.section} className="rounded-lg border border-border/80 bg-muted/20 p-2.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-bold text-foreground font-mono">{law.section}</span>
                    <span className="text-[11px] text-muted-foreground">{law.act}</span>
                  </div>
                  <p className="mt-0.5 text-foreground/85 font-medium">{law.offense}</p>
                  <p className="mt-0.5 text-[11px] text-danger font-semibold">Statutory Penalty: {law.penalty}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mitigations Executed */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              4. E.D.I.T.H. Containment Actions Executed
            </h3>
            <ul className="mt-1.5 space-y-1 font-mono text-[11px] text-success">
              {dossier.killSwitchMitigationsApplied.map((mitigation) => (
                <li key={mitigation} className="flex items-center gap-1.5">
                  <span className="text-success">&check;</span> {mitigation}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-border text-foreground text-xs"
          >
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadJson}
              className="border-border text-xs"
            >
              <Download className="size-3.5 mr-1.5" />
              Download JSON
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCopyDraft}
              className="bg-primary text-primary-foreground text-xs font-bold shadow"
            >
              {copied ? <Check className="size-3.5 mr-1.5" /> : <Copy className="size-3.5 mr-1.5" />}
              {copied ? "Copied to Clipboard" : "Copy Complaint Draft (1930)"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

