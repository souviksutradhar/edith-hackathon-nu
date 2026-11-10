"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RISK_RULES } from "@/lib/riskEngine"
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Terminal,
  ExternalLink,
  Cpu,
  Layers,
  FileCheck,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Smartphone,
  Server,
  Zap,
} from "lucide-react"

export function AboutView() {
  const rulesList = Object.values(RISK_RULES)

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="rounded-[20px] border border-[#E6E1FA] bg-white p-6 space-y-4 shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-[#ECE8FF] text-[#5B35F5]">
              <Shield className="size-6 text-[#5B35F5]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#15122B] tracking-tight">
                About E.D.I.T.H.
              </h1>
              <p className="text-xs text-[#5E5A7A]">
                Early Detection, Isolation &amp; Threat Interceptor &middot; Sovereign Mobile Defense
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/souvikhaldar/edith-hackathon"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#15122B] bg-white hover:bg-[#F9F8FF] border border-[#E6E1FA] px-4 py-2 rounded-full transition-colors shadow-sm"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="size-3.5 text-[#5E5A7A]" />
            </a>
          </div>
        </div>

        {/* Mandatory Transparency & Privacy Statement */}
        <div className="rounded-[16px] border border-[#1E9E6A]/30 bg-[#E3F6EE] p-4">
          <div className="flex items-center gap-2 text-[#12704A] font-bold text-xs uppercase tracking-wider mb-1">
            <CheckCircle2 className="size-4" />
            Zero-Telemetry &middot; Sovereign In-Browser Sandbox
          </div>
          <p className="text-sm text-[#12704A] leading-relaxed">
            Open source and no login so anyone can inspect exactly what it does. It collects nothing. All simulations, risk evaluations, and SHA-256 cryptographic hashes execute entirely in your local browser sandbox.
          </p>
        </div>
      </div>

      {/* 1. Problem Statement */}
      <div className="rounded-[20px] border border-[#E6E1FA] bg-white p-6 space-y-4 shadow-none">
        <div className="flex items-center gap-2 text-[#B42318] text-xs font-bold uppercase tracking-wider">
          <AlertTriangle className="size-4" />
          The Threat Landscape: Weaponized Sideloading
        </div>
        <h2 className="text-lg font-bold text-[#15122B]">
          The WhatsApp APK Scam Epidemic in India
        </h2>
        <div className="space-y-3 text-sm text-[#5E5A7A] leading-relaxed">
          <p>
            Cybercriminal syndicates in India increasingly bypass Google Play Protect not by hacking operating systems, but by manipulating victims through urgent social engineering. Phishing lures arrive over WhatsApp or SMS masquerading as:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              <strong className="text-[#15122B]">Urgent Electricity Cutoff:</strong> Threatening night-time power disconnection unless a &quot;verification APK&quot; is installed.
            </li>
            <li>
              <strong className="text-[#15122B]">Pending Traffic Challan:</strong> Impersonating state RTO / Parivahan portals with fake court-date summons.
            </li>
            <li>
              <strong className="text-[#15122B]">Bank KYC Suspension:</strong> Posing as SBI, HDFC, or PNB requiring instant biometric re-validation.
            </li>
          </ul>
          <p>
            Once sideloaded, the rogue APK prompts for high-privilege Android permissions (SMS, Accessibility, Notification Listeners). Within seconds of grant, it initiates a <strong className="text-[#15122B]">kill-chain harvest</strong>: scraping incoming bank OTPs, concealing its own launcher icon so the victim cannot uninstall it, and beaconing out to offshore command-and-control (C2) servers.
          </p>
          <div className="text-[#8A5A00] font-medium bg-[#FFF1D6] p-3.5 rounded-[12px] border border-[#D99A1E]/30">
            Traditional antivirus software looks for known signatures and fails against freshly obfuscated APKs. E.D.I.T.H. enforces dynamic, deterministic behavioral guardrails that trigger BEFORE the OTP can be stolen.
          </div>
        </div>
      </div>

      {/* 2. Transparent Weighted Rules Table */}
      <div className="rounded-[20px] border border-[#E6E1FA] bg-white p-6 space-y-4 shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#5B35F5] text-xs font-bold uppercase tracking-wider">
            <Terminal className="size-4" />
            Transparent Arithmetic Engine
          </div>
          <Badge variant="outline" className="border-[#E6E1FA] bg-[#F9F8FF] text-[#5B35F5] text-xs rounded-full px-3 py-0.5">
            100% Deterministic &middot; Zero Hallucination
          </Badge>
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#15122B]">
            Weighted Risk Scoring Rules
          </h2>
          <p className="text-sm text-[#5E5A7A] mt-1">
            Every point added to an application is transparently traceable to an explicit behavioral violation. Trust and Status are mathematical functions of total risk:
          </p>
        </div>

        {/* Formulas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-[#F9F8FF] border border-[#E6E1FA] p-4 rounded-[16px]">
          <div>
            <span className="text-[#5E5A7A] block">Total Risk Formula:</span>
            <span className="text-[#15122B] font-mono font-bold text-sm">
              &Sigma; Triggered Rule Points
            </span>
          </div>
          <div>
            <span className="text-[#5E5A7A] block">Trust Score Formula:</span>
            <span className="text-[#15122B] font-mono font-bold text-sm">
              max(0, min(100, 100 - Risk))
            </span>
          </div>
          <div>
            <span className="text-[#5E5A7A] block">Status Thresholds:</span>
            <span className="text-[#15122B] font-mono font-bold text-sm">
              &lt;40 Trusted | 40-69 Watching | &ge;70 Frozen
            </span>
          </div>
        </div>

        {/* Rules Table */}
        <div className="overflow-x-auto rounded-[16px] border border-[#E6E1FA]">
          <table className="w-full text-left text-sm font-sans">
            <thead className="bg-[#F9F8FF] border-b border-[#EEEAFB] text-xs text-[#5E5A7A] uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Rule Identifier</th>
                <th className="py-3 px-4">Behavioral Violation</th>
                <th className="py-3 px-4 text-center">Risk Points</th>
                <th className="py-3 px-4">Detection Logic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEAFB] text-xs">
              {rulesList.map((rule) => (
                <tr key={rule.id} className="hover:bg-[#F9F8FF]/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#15122B]">
                    {rule.name}
                  </td>
                  <td className="py-3 px-4 text-[#5E5A7A]">
                    {rule.description}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FDE8E6] border border-[#D64545]/30 text-[#B42318] font-bold text-xs font-mono">
                      +{rule.points}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#5E5A7A]">
                    <span className="font-mono text-xs text-[#15122B]">
                      {rule.id === "UNTRUSTED_INSTALL_SOURCE" && "InstallerPackageName != com.android.vending"}
                      {rule.id === "IMPERSONATES_BRAND" && "Official brand claims without signed cert"}
                      {rule.id === "UNEXPECTED_SMS" && "READ_SMS beyond declared utility scope"}
                      {rule.id === "UNEXPECTED_ACCESSIBILITY" && "AccessibilityService binding requested"}
                      {rule.id === "UNEXPECTED_INSTALL_PACKAGES" && "Secondary package dropper requested"}
                      {rule.id === "UNEXPECTED_NOTIFICATION_LISTENER" && "Notification listener hook declared"}
                      {rule.id === "BULK_SMS_READ_SPIKE" && "SMS query volume >10x baseline in <10s"}
                      {rule.id === "HIDES_APP_ICON" && "Launcher activity disabled post-install"}
                      {rule.id === "CONTACTS_NEW_DOMAIN" && "Outbound connection to unindexed IP/domain"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Section F: How This Works on a Real Phone */}
      <div className="rounded-[20px] border border-[#E6E1FA] bg-white p-6 space-y-6 shadow-none">
        <div className="flex items-center gap-2 text-[#5B35F5] text-xs font-bold uppercase tracking-wider">
          <Layers className="size-4" />
          Section F &middot; Architectural Roadmap
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#15122B]">
            How This Works on a Real Phone
          </h2>
          <p className="text-sm text-[#5E5A7A] mt-1">
            Understanding the transition from user-space heuristic monitoring to sovereign OEM system-level containment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Phase 1 Card */}
          <div className="rounded-[16px] border border-[#E6E1FA] bg-[#F9F8FF] p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#EEEAFB] pb-2.5">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-[#5B35F5]" />
                <h3 className="text-sm font-bold text-[#15122B] uppercase">
                  Phase 1: Pure User-Space App
                </h3>
              </div>
              <Badge variant="outline" className="text-xs border-[#5B35F5]/30 bg-[#ECE8FF] text-[#5B35F5] rounded-full px-2.5">
                Deployable Today
              </Badge>
            </div>
            <p className="text-xs text-[#5E5A7A]">
              Operates within standard Android permissions on existing unmodified consumer devices (No root required):
            </p>
            <ul className="space-y-2 text-xs text-[#15122B]">
              <li className="flex items-start gap-2">
                <span className="text-[#5B35F5] mt-0.5">&bull;</span>
                <span>
                  <strong>Installer Monitoring:</strong> Detects new packages installed via WhatsApp, Telegram, or Chrome downloads using standard <code className="text-[#5B35F5] bg-[#ECE8FF] px-1 py-0.5 rounded font-mono">PackageInstaller</code> events.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#5B35F5] mt-0.5">&bull;</span>
                <span>
                  <strong>Bilingual Friction Modal:</strong> Displays high-contrast warnings in Hindi/English over risky permission consent screens before users tap &quot;Allow&quot;.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#5B35F5] mt-0.5">&bull;</span>
                <span>
                  <strong>Heuristic Abuse Detection:</strong> Monitors SMS query rate spikes via <code className="text-[#5B35F5] bg-[#ECE8FF] px-1 py-0.5 rounded font-mono">ContentObserver</code> to spot 10x baseline reads.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#5B35F5] mt-0.5">&bull;</span>
                <span>
                  <strong>BSA Sec. 63 Export:</strong> Compiles tamper-evident JSON incident bundles ready for victim submission to the National Cyber Crime Portal (1930).
                </span>
              </li>
            </ul>
          </div>

          {/* Phase 2 Card */}
          <div className="rounded-[16px] border border-[#5B35F5]/30 bg-[#ECE8FF]/30 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#5B35F5]/20 pb-2.5">
              <div className="flex items-center gap-2">
                <Cpu className="size-4 text-[#5B35F5]" />
                <h3 className="text-sm font-bold text-[#5B35F5] uppercase">
                  Phase 2: OEM / Telco / OS Integration
                </h3>
              </div>
              <Badge variant="outline" className="text-xs border-[#5B35F5] bg-[#5B35F5] text-white rounded-full px-2.5">
                Sovereign OS Partner
              </Badge>
            </div>
            <p className="text-xs text-[#5E5A7A]">
              Built directly into the Android framework (AOSP / BharOS / OEM ROM) with system-level privileges:
            </p>
            <ul className="space-y-2 text-xs text-[#15122B]">
              <li className="flex items-start gap-2">
                <span className="text-[#5B35F5] mt-0.5">&bull;</span>
                <span>
                  <strong>Instant Kernel Kill-Switch:</strong> Uses <code className="text-[#5B35F5] bg-white px-1 py-0.5 rounded font-mono border border-[#E6E1FA]">AppOpsManager.setMode</code> and <code className="text-[#5B35F5] bg-white px-1 py-0.5 rounded font-mono border border-[#E6E1FA]">ActivityManager.forceStopPackage</code> to instantly isolate rogue processes.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#5B35F5] mt-0.5">&bull;</span>
                <span>
                  <strong>Privacy Doppelganger IPC Interception:</strong> Injects synthetic decoy data (154 canary contacts) at the Binder IPC boundary instead of null returns, tracking C2 exfiltration.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#5B35F5] mt-0.5">&bull;</span>
                <span>
                  <strong>Telco DLT Carrier Attestation:</strong> Direct hardware SIM baseband cross-verification of TRAI commercial headers before rendering SMS in the user inbox.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Mandatory Concluding Line */}
        <div className="rounded-[14px] border border-[#E6E1FA] bg-[#F9F8FF] p-4 text-center">
          <p className="text-sm font-bold text-[#15122B]">
            This prototype simulates the device and shows what both phases would do.
          </p>
        </div>
      </div>

      {/* 4. Statutory & Open-Source Integrity */}
      <div className="rounded-[20px] border border-[#E6E1FA] bg-white p-6 space-y-4 shadow-none">
        <h3 className="text-sm font-bold text-[#15122B] uppercase tracking-wide">
          Statutory Standards &amp; Architecture References
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#5E5A7A]">
          <div className="p-4 bg-[#F9F8FF] rounded-[16px] border border-[#E6E1FA]">
            <span className="font-bold text-[#15122B] block mb-1">Official Sender Header Standard</span>
            Mandates registered 6-character sender headers (e.g. AD-SBIINB) over unregistered 10-digit mobile numbers for institutional alerts.
          </div>
          <div className="p-4 bg-[#F9F8FF] rounded-[16px] border border-[#E6E1FA]">
            <span className="font-bold text-[#15122B] block mb-1">BSA Sec. 63 (Bharatiya Sakshya Adhiniyam)</span>
            Governs the admissibility of electronic evidence via cryptographic hash fingerprints and immutable temporal logs.
          </div>
          <div className="p-4 bg-[#F9F8FF] rounded-[16px] border border-[#E6E1FA]">
            <span className="font-bold text-[#15122B] block mb-1">DPDP Act 2023 Principles</span>
            Enforces strict purpose limitation: utility tools cannot harvest address books or SMS records under lawful consent limits.
          </div>
        </div>
      </div>
    </div>
  )
}

