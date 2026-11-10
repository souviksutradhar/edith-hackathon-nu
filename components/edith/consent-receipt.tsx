"use client"

import { useState } from "react"
import {
  FileCheck2,
  History,
  Lock,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/edith/page-header"
import { useSimulation } from "@/lib/simulation-context"
import { cn } from "@/lib/utils"

// Permission definitions with declared relevance per app
interface AppPermissionDef {
  key: string
  name: string
  isExpected: boolean
  removalReason?: string
}

const APP_PERMISSIONS_CONFIG: Record<string, AppPermissionDef[]> = {
  "app-bhim": [
    { key: "UPI Engine", name: "UPI Engine", isExpected: true },
    { key: "Network", name: "Network Access", isExpected: true },
    { key: "SMS", name: "Read SMS (Bank Verification)", isExpected: true },
    {
      key: "Location",
      name: "Precise Location",
      isExpected: false,
      removalReason: "UPI payments do not require precise GPS coordinates to send or receive funds.",
    },
    {
      key: "Contacts",
      name: "Read Contacts",
      isExpected: false,
      removalReason: "Direct VPA and QR code transactions do not require reading your entire address book.",
    },
  ],
  "app-weather": [
    { key: "Coarse Location", name: "Coarse Location", isExpected: true },
    { key: "Network", name: "Network Access", isExpected: true },
    {
      key: "SMS",
      name: "Read SMS",
      isExpected: false,
      removalReason: "Weather apps do not need SMS to show rain forecasts or temperature alerts.",
    },
    {
      key: "Accessibility",
      name: "Accessibility Service",
      isExpected: false,
      removalReason: "Weather apps do not need screen-reading or remote input hooks.",
    },
    {
      key: "Contacts",
      name: "Read Contacts",
      isExpected: false,
      removalReason: "Weather forecasts have no use for your personal contact list.",
    },
  ],
  "app-digilocker": [
    { key: "Storage", name: "Storage & Documents", isExpected: true },
    { key: "Network", name: "Network Access", isExpected: true },
    { key: "Camera", name: "Camera (QR Scanner)", isExpected: true },
    {
      key: "SMS",
      name: "Read SMS",
      isExpected: false,
      removalReason: "Document wallets do not need continuous background SMS access.",
    },
    {
      key: "Accessibility",
      name: "Accessibility Service",
      isExpected: false,
      removalReason: "Official document viewers do not require screen monitoring capabilities.",
    },
  ],
  "app-rto": [
    { key: "Network", name: "Network Access", isExpected: true },
    {
      key: "SMS",
      name: "Read SMS",
      isExpected: false,
      removalReason: "Challan viewers do not need to read private OTPs or bank messages.",
    },
    {
      key: "Accessibility",
      name: "Accessibility Service",
      isExpected: false,
      removalReason: "Challan lookups do not need screen-scraping or keylogging capabilities.",
    },
    {
      key: "Install Packages",
      name: "Install Packages",
      isExpected: false,
      removalReason: "Utility apps must not be permitted to install secondary APKs silently.",
    },
  ],
}

export function ConsentReceiptLedger() {
  const {
    apps,
    evaluations,
    consentHistory,
    toggleAppPermission,
    applyAllRecommendations,
    triggerPermissionCreep,
    activeCreepAlert,
    respondToPermissionCreep,
  } = useSimulation()

  // Calculate total unnecessary permissions currently granted across apps
  const totalRecommendations = apps.reduce((count, app) => {
    const config = APP_PERMISSIONS_CONFIG[app.id] || []
    const unnecessary = config.filter(
      (p) => !p.isExpected && app.grantedPermissions.some((gp) => gp.toLowerCase().includes(p.key.toLowerCase()))
    )
    return count + unnecessary.length
  }, 0)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Consent Ledger"
        subtitle="See and control what every app can access"
        description="Review declared app purposes, toggle specific permissions on or off, and strip unnecessary scopes."
        demoSteps={[
          'Review apps with yellow "Recommended to remove" badges and toggle unnecessary permissions off.',
          'Click "Apply all recommendations" to strip all non-essential permissions across all apps in one click.',
          'Click "Simulate: app asks for more access later" to test how E.D.I.T.H. intercepts permission creep.',
        ]}
      />

      {/* Global Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[20px] border border-[#E6E1FA] bg-white p-5 shadow-none">
        <div className="flex items-center gap-2.5">
          <FileCheck2 className="size-5 text-[#5B35F5]" />
          <span className="text-sm font-bold text-[#15122B]">
            Active App Consent Posture:
          </span>
          <span className="text-xs text-[#5E5A7A]">
            {totalRecommendations > 0
              ? `${totalRecommendations} recommended removal(s)`
              : "All active apps hardened"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="sm"
            onClick={applyAllRecommendations}
            className="rounded-full bg-[#5B35F5] hover:bg-[#4A27D9] text-white text-xs font-semibold h-9 px-4 shadow-[0_4px_14px_rgba(91,53,245,0.18)]"
          >
            <Sparkles className="mr-1.5 size-3.5 fill-current" />
            Apply all recommendations
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => triggerPermissionCreep("app-weather")}
            className="rounded-full border border-[#E6E1FA] bg-white hover:bg-[#ECE8FF] text-[#5B35F5] text-xs font-semibold h-9 px-4"
          >
            <Zap className="mr-1.5 size-3 text-[#D99A1E]" />
            Simulate: app asks for more access later
          </Button>
        </div>
      </div>

      {/* Permission Creep Alert Banner */}
      {activeCreepAlert && (
        <div className="rounded-[16px] border border-[#D99A1E]/30 bg-[#FFF1D6]/40 p-5 space-y-3">
          <div className="flex items-center gap-2 text-[#8A5A00] font-bold text-sm">
            <TriangleAlert className="size-4 text-[#D99A1E]" />
            <span>Permission Creep Intercepted: {activeCreepAlert.appName}</span>
          </div>
          <p className="text-xs text-[#15122B] leading-relaxed">
            {activeCreepAlert.reason}
          </p>
          <div className="flex items-center gap-2.5 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={() => respondToPermissionCreep(false)}
              className="rounded-full bg-[#1E9E6A] hover:bg-[#12704A] text-white text-xs font-semibold h-8 px-4"
            >
              <ShieldCheck className="mr-1.5 size-3.5" />
              Deny (Recommended)
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => respondToPermissionCreep(true)}
              className="rounded-full border border-[#E6E1FA] bg-white hover:bg-[#ECE8FF] text-[#5E5A7A] text-xs font-semibold h-8 px-4"
            >
              Allow (Risky)
            </Button>
          </div>
        </div>
      )}

      {/* App Consent Cards */}
      <div className="space-y-4">
        {apps.map((app) => {
          const evalResult = evaluations[app.id] || {
            trustScore: 100,
            status: "Trusted",
            totalRisk: 0,
            appliedRules: [],
            isContained: false,
          }

          const isFrozen = evalResult.status === "Frozen"
          const config = APP_PERMISSIONS_CONFIG[app.id] || []

          let scoreStroke = "#1E9E6A"
          let scoreText = "text-[#12704A]"
          if (evalResult.trustScore < 40) {
            scoreStroke = "#D64545"
            scoreText = "text-[#B42318]"
          } else if (evalResult.trustScore <= 70) {
            scoreStroke = "#D99A1E"
            scoreText = "text-[#8A5A00]"
          }

          return (
            <div
              key={app.id}
              className={cn(
                "rounded-[20px] border p-6 space-y-4 transition-all shadow-none bg-white",
                isFrozen
                  ? "border-[#D64545] bg-[#FDE8E6]/20 ring-1 ring-[#D64545]/30"
                  : "border-[#E6E1FA]"
              )}
            >
              {/* App Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEEAFB] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-lg text-[#15122B]">{app.name}</span>
                    <span
                      className={cn(
                        "text-xs px-2.5 py-0.5 rounded-full font-bold",
                        isFrozen
                          ? "bg-[#FDE8E6] text-[#B42318] border border-[#D64545]/20 animate-pulse"
                          : evalResult.status === "Suspicious"
                          ? "bg-[#FFF1D6] text-[#8A5A00] border border-[#D99A1E]/20"
                          : "bg-[#E3F6EE] text-[#12704A] border border-[#1E9E6A]/20"
                      )}
                    >
                      {isFrozen ? "FROZEN BY E.D.I.T.H." : evalResult.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-[#5E5A7A]">
                    Declared Purpose:{" "}
                    <span className="text-[#15122B] font-medium">{app.declaredPurpose}</span>
                  </p>
                </div>

                {/* Trust Score Ring */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-[#5E5A7A]">Trust Score</div>
                    <div className={cn("text-lg font-bold font-mono", scoreText)}>
                      {evalResult.trustScore}/100
                    </div>
                  </div>

                  {/* Circular Ring Gauge */}
                  <div className="relative size-11 flex items-center justify-center">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-[#E9E5FB]"
                        strokeWidth="3.5"
                        stroke="#E9E5FB"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        stroke={scoreStroke}
                        strokeDasharray={`${evalResult.trustScore}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className={cn("absolute text-[11px] font-bold font-mono", scoreText)}>
                      {evalResult.trustScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Frozen Explanation Box */}
              {isFrozen ? (
                <div className="p-4 rounded-[14px] border border-[#D64545]/30 bg-[#FDE8E6]/40 text-xs text-[#B42318] flex items-start gap-3">
                  <Lock className="size-4 text-[#D64545] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-sm">
                      This app was caught attempting fraud. Permissions are locked to protect your accounts.
                    </p>
                    <p className="text-xs opacity-90">
                      Auto-containment revoked all runtime capabilities. To restore system trust, uninstall this package from device settings.
                    </p>
                  </div>
                </div>
              ) : (
                /* Permission Toggles List */
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-wider text-[#5E5A7A] font-semibold">
                    Configured Permission Scopes:
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {config.map((perm) => {
                      const isGranted = app.grantedPermissions.some((gp) =>
                        gp.toLowerCase().includes(perm.key.toLowerCase())
                      )
                      const isUnnecessary = !perm.isExpected

                      return (
                        <div
                          key={perm.key}
                          className={cn(
                            "rounded-[14px] border p-3.5 flex items-start justify-between gap-3 text-xs transition-colors",
                            isUnnecessary && isGranted
                              ? "border-[#D99A1E]/30 bg-[#FFF1D6]/30"
                              : "border-[#E6E1FA] bg-[#F9F8FF]"
                          )}
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-[#15122B] text-sm">{perm.name}</span>
                              {perm.isExpected ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E3F6EE] text-[#12704A] border border-[#1E9E6A]/20 font-semibold">
                                  Expected
                                </span>
                              ) : (
                                isGranted && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF1D6] border border-[#D99A1E]/30 text-[#8A5A00] font-bold">
                                    Recommended to remove
                                  </span>
                                )
                              )}
                            </div>

                            {perm.removalReason && isGranted && (
                              <p className="text-xs text-[#8A5A00] leading-snug pt-0.5">
                                {perm.removalReason}
                              </p>
                            )}
                          </div>

                          {/* Switch Toggle */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isGranted}
                            disabled={isFrozen}
                            onClick={() => toggleAppPermission(app.id, perm.key, !isGranted)}
                            className={cn(
                              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                              isGranted ? "bg-[#5B35F5]" : "bg-[#CFC9EA]"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                isGranted ? "translate-x-5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Change History Table */}
      <div className="rounded-[20px] border border-[#E6E1FA] bg-white overflow-hidden shadow-none space-y-0">
        <div className="flex items-center gap-2 p-4 border-b border-[#EEEAFB] bg-[#F9F8FF]">
          <History className="size-4 text-[#5B35F5]" />
          <h4 className="text-xs uppercase font-bold text-[#15122B]">
            Consent Mutation &amp; Risk History Log
          </h4>
        </div>

        {consentHistory.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#5E5A7A]">
            Run the demo to see activity here
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#F9F8FF] border-b border-[#EEEAFB] text-[#5E5A7A] text-[13px] font-semibold">
                <tr>
                  <th className="py-3 px-4 w-28">Time (IST)</th>
                  <th className="py-3 px-4">Application</th>
                  <th className="py-3 px-4">Permission Action</th>
                  <th className="py-3 px-4 text-right w-40">Trust Score Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEAFB]">
                {consentHistory.map((rec) => (
                  <tr key={rec.id} className="h-[52px] hover:bg-[#F9F8FF] transition-colors">
                    <td className="py-3 px-4 text-xs font-mono text-[#5E5A7A]">{rec.timestamp}</td>
                    <td className="py-3 px-4 font-semibold text-[#15122B]">{rec.appName}</td>
                    <td className="py-3 px-4 text-xs text-[#15122B]">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold mr-2",
                          rec.action === "FROZEN_BY_EDITH"
                            ? "border border-[#D64545]/20 bg-[#FDE8E6] text-[#B42318]"
                            : rec.action === "REVOKED"
                            ? "border border-[#D99A1E]/20 bg-[#FFF1D6] text-[#8A5A00]"
                            : "border border-[#1E9E6A]/20 bg-[#E3F6EE] text-[#12704A]"
                        )}
                      >
                        {rec.action}
                      </span>
                      <span className="text-[#5E5A7A]">{rec.permission}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-mono">
                      <span className="text-[#5E5A7A]">
                        {rec.previousScore} &rarr;{" "}
                        <strong
                          className={
                            rec.newScore < rec.previousScore
                              ? "text-[#B42318]"
                              : "text-[#12704A]"
                          }
                        >
                          {rec.newScore}
                        </strong>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
