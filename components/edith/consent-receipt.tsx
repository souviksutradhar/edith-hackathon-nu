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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-center gap-2">
          <FileCheck2 className="size-4 text-emerald-400" />
          <span className="text-xs font-mono text-zinc-300 font-bold uppercase">
            Active App Consent Posture:
          </span>
          <span className="text-xs text-zinc-400 font-mono">
            {totalRecommendations > 0
              ? `${totalRecommendations} recommended removal(s)`
              : "All active apps hardened"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            size="sm"
            onClick={applyAllRecommendations}
            className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-mono text-xs font-bold h-8 px-3"
          >
            <Sparkles className="mr-1.5 size-3.5 fill-current" />
            Apply all recommendations
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => triggerPermissionCreep("app-weather")}
            className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-mono text-xs h-8 px-3"
          >
            <Zap className="mr-1.5 size-3 text-amber-400" />
            Simulate: app asks for more access later
          </Button>
        </div>
      </div>

      {/* Permission Creep Alert Banner */}
      {activeCreepAlert && (
        <div className="rounded-lg border border-amber-600/60 bg-amber-950/40 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm font-mono">
            <TriangleAlert className="size-4 text-amber-400" />
            <span>Permission Creep Intercepted: {activeCreepAlert.appName}</span>
          </div>
          <p className="text-xs text-zinc-200 leading-relaxed font-mono">
            {activeCreepAlert.reason}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={() => respondToPermissionCreep(false)}
              className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-mono text-xs font-bold h-7 px-3"
            >
              <ShieldCheck className="mr-1.5 size-3.5" />
              Deny (Recommended)
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => respondToPermissionCreep(true)}
              className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-mono text-xs h-7 px-3"
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

          const scoreColor =
            evalResult.trustScore >= 70
              ? "text-emerald-400 stroke-emerald-400"
              : evalResult.trustScore >= 40
              ? "text-amber-400 stroke-amber-400"
              : "text-rose-400 stroke-rose-400"

          return (
            <div
              key={app.id}
              className={cn(
                "rounded-lg border p-5 space-y-4 transition-all",
                isFrozen
                  ? "border-rose-800/80 bg-rose-950/20 ring-1 ring-rose-600/30"
                  : "border-zinc-800 bg-zinc-950"
              )}
            >
              {/* App Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-zinc-100">{app.name}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-2 py-0.5 font-bold font-mono",
                        isFrozen
                          ? "border-rose-600 bg-rose-950 text-rose-300 font-extrabold animate-pulse"
                          : evalResult.status === "Suspicious"
                          ? "border-amber-700 bg-amber-950/40 text-amber-300"
                          : "border-emerald-800 bg-emerald-950/40 text-emerald-400"
                      )}
                    >
                      {isFrozen ? "FROZEN BY E.D.I.T.H." : evalResult.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Declared Purpose:{" "}
                    <span className="text-zinc-200 font-medium">{app.declaredPurpose}</span>
                  </p>
                </div>

                {/* Trust Score Ring */}
                <div className="flex items-center gap-3">
                  <div className="text-right font-mono">
                    <div className="text-xs text-zinc-400">Trust Score</div>
                    <div className={cn("text-lg font-bold", scoreColor)}>
                      {evalResult.trustScore}/100
                    </div>
                  </div>

                  {/* Circular Ring Gauge */}
                  <div className="relative size-11 flex items-center justify-center">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-zinc-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={scoreColor}
                        strokeDasharray={`${evalResult.trustScore}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className={cn("absolute text-[10px] font-bold font-mono", scoreColor)}>
                      {evalResult.trustScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Frozen Explanation Box */}
              {isFrozen ? (
                <div className="p-3.5 rounded border border-rose-700/60 bg-rose-950/40 text-xs font-mono text-rose-200 flex items-start gap-2.5">
                  <Lock className="size-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">
                      This app was caught attempting fraud. Permissions are locked to protect your accounts.
                    </p>
                    <p className="text-[11px] text-rose-300/80">
                      Auto-containment revoked all runtime capabilities. To restore system trust, uninstall this package from device settings.
                    </p>
                  </div>
                </div>
              ) : (
                /* Permission Toggles List */
                <div className="space-y-2.5">
                  <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-mono font-semibold">
                    Configured Permission Scopes:
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {config.map((perm) => {
                      const isGranted = app.grantedPermissions.some((gp) =>
                        gp.toLowerCase().includes(perm.key.toLowerCase())
                      )
                      const isUnnecessary = !perm.isExpected

                      return (
                        <div
                          key={perm.key}
                          className={cn(
                            "rounded border p-2.5 flex items-start justify-between gap-2 text-xs font-mono transition-colors",
                            isUnnecessary && isGranted
                              ? "border-amber-700/60 bg-amber-950/20"
                              : "border-zinc-800/80 bg-zinc-900/40"
                          )}
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-zinc-200">{perm.name}</span>
                              {perm.isExpected ? (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                  Expected
                                </span>
                              ) : (
                                isGranted && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 border border-amber-700 text-amber-300 font-bold">
                                    Recommended to remove
                                  </span>
                                )
                              )}
                            </div>

                            {perm.removalReason && isGranted && (
                              <p className="text-[11px] text-amber-400/90 leading-tight">
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
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                              isGranted ? "bg-emerald-600" : "bg-zinc-700"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                isGranted ? "translate-x-4" : "translate-x-0"
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
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden font-mono text-xs space-y-2">
        <div className="flex items-center gap-2 p-3 border-b border-zinc-800 bg-zinc-900/50">
          <History className="size-4 text-cyan-400" />
          <h4 className="text-xs uppercase font-bold text-zinc-300">
            Consent Mutation &amp; Risk History Log
          </h4>
        </div>

        {consentHistory.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">
            Run the demo to see activity here
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-900/70 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold w-24">Time (IST)</th>
                  <th className="py-2.5 px-3 font-semibold">Application</th>
                  <th className="py-2.5 px-3 font-semibold">Permission Action</th>
                  <th className="py-2.5 px-3 font-semibold text-right w-36">Trust Score Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {consentHistory.map((rec) => (
                  <tr key={rec.id} className="hover:bg-zinc-900/40">
                    <td className="py-2 px-3 text-zinc-400">{rec.timestamp}</td>
                    <td className="py-2 px-3 font-semibold text-zinc-200">{rec.appName}</td>
                    <td className="py-2 px-3 text-zinc-300">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold border mr-2",
                          rec.action === "FROZEN_BY_EDITH"
                            ? "border-rose-800 bg-rose-950 text-rose-300"
                            : rec.action === "REVOKED"
                            ? "border-amber-800 bg-amber-950 text-amber-300"
                            : "border-emerald-800 bg-emerald-950 text-emerald-300"
                        )}
                      >
                        {rec.action}
                      </span>
                      <span className="text-zinc-400 text-[11px]">{rec.permission}</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="text-zinc-400">
                        {rec.previousScore} &rarr;{" "}
                        <strong
                          className={
                            rec.newScore < rec.previousScore
                              ? "text-rose-400"
                              : "text-emerald-400"
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
