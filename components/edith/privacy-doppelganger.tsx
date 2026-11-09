"use client"

import { useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  Database,
  Eye,
  EyeOff,
  Ghost,
  Lock,
  PhoneCall,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/edith/page-header"
import { useSimulation } from "@/lib/simulation-context"
import { cn } from "@/lib/utils"

export function PrivacyDoppelganger() {
  const {
    decoyEnabled,
    setDecoyEnabled,
    decoyReadsCount,
    lastDecoyRead,
    simulateAppReadsData,
    simulateDecoyTripwire,
    decoyTripwireAlert,
    dismissTripwireAlert,
    apps,
  } = useSimulation()

  const [selectedAppId, setSelectedAppId] = useState("app-rto")
  const [selectedDataType, setSelectedDataType] = useState<
    "Contacts" | "Location" | "Bank balance"
  >("Contacts")

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Privacy Doppelganger"
        subtitle="Give suspicious apps fake data instead of your real data"
        description="Feed synthetic decoy records to untrusted applications instead of exposing your real private identity."
        demoSteps={[
          'Toggle "Decoy protection" ON to protect real device data with synthetic decoy records.',
          'Click "Simulate: app tries to read my data" to watch E.D.I.T.H. feed decoy data and increment the read counter.',
          'Click "Simulate: scammer uses a decoy contact" to see the tripwire alarm activate when a scammer calls a decoy number.',
        ]}
      />

      {/* Main Control Panel */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Ghost className="size-5 text-purple-400" />
              <h2 className="text-base font-bold text-zinc-100 uppercase tracking-wide">
                Privacy Doppelganger Engine
              </h2>
              <Badge
                variant="outline"
                className="border-purple-500/40 bg-purple-950/40 text-purple-300 text-xs font-mono px-2 py-0.5"
              >
                Concept demo with sample data
              </Badge>
            </div>
            <p className="text-xs text-zinc-400">
              When enabled, rogue read queries receive realistic synthetic data with embedded carrier tripwires.
            </p>
          </div>

          {/* Main Switch: Decoy Protection ON/OFF */}
          <div className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 px-4 py-2.5 rounded-lg shrink-0">
            <div className="text-right">
              <div className="text-xs font-bold text-zinc-200 font-mono">
                Decoy protection
              </div>
              <div
                className={cn(
                  "text-[10px] font-mono font-bold",
                  decoyEnabled ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {decoyEnabled ? "ACTIVE (PROTECTED)" : "DISABLED (EXPOSED)"}
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={decoyEnabled}
              onClick={() => setDecoyEnabled(!decoyEnabled)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                decoyEnabled ? "bg-purple-600" : "bg-zinc-700"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  decoyEnabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        {/* Read Counter & Simulator Buttons */}
        <div className="pt-3 border-t border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Read Counter Badge */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-zinc-400">Decoy reads served:</span>
            <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-700/60 text-purple-300 font-bold">
              {decoyReadsCount}
            </span>
          </div>

          {/* Simulator Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded px-2.5 py-1.5 font-mono focus:outline-none"
            >
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <select
              value={selectedDataType}
              onChange={(e) =>
                setSelectedDataType(
                  e.target.value as "Contacts" | "Location" | "Bank balance"
                )
              }
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded px-2.5 py-1.5 font-mono focus:outline-none"
            >
              <option value="Contacts">Contacts</option>
              <option value="Location">Location</option>
              <option value="Bank balance">Bank balance</option>
            </select>

            <Button
              type="button"
              size="sm"
              onClick={() => simulateAppReadsData(selectedAppId, selectedDataType)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold h-8 px-3"
            >
              <Play className="mr-1.5 size-3 fill-current" />
              Simulate: app tries to read my data
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => simulateDecoyTripwire(selectedAppId)}
              className="border-rose-800/80 bg-rose-950/40 hover:bg-rose-950 text-rose-300 font-mono text-xs h-8 px-3"
            >
              <PhoneCall className="mr-1.5 size-3 text-rose-400" />
              Simulate: scammer uses a decoy contact
            </Button>
          </div>
        </div>
      </div>

      {/* Tripwire Alert Banner */}
      {decoyTripwireAlert && (
        <div className="rounded-lg border border-rose-600 bg-rose-950/40 p-4 space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <PhoneCall className="size-4 text-rose-400 animate-pulse" />
              <span>TRIPWIRE ALARM: Extortion Call Detected on Decoy Line</span>
            </div>
            <button
              type="button"
              onClick={dismissTripwireAlert}
              className="text-xs text-rose-400 hover:text-rose-200 underline"
            >
              Dismiss
            </button>
          </div>

          <p className="text-xs text-rose-200 leading-relaxed">
            Decoy contact <strong>&quot;{decoyTripwireAlert.decoyName}&quot;</strong> ({decoyTripwireAlert.decoyPhone}) just received an extortion call from {decoyTripwireAlert.scammerOrigin}. This independently confirms that <strong>{decoyTripwireAlert.appName}</strong> exfiltrated your address book to a scam syndicate.
          </p>

          <p className="text-[11px] text-zinc-400 pt-1 border-t border-rose-900/60">
            Tripwire explained: We plant unique decoy numbers in your phone that only this app received; when scammers call that number, we have indisputable proof of who leaked it.
          </p>
        </div>
      )}

      {/* Two Columns: Real Data (Hidden) vs What the App Received */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
        {/* Column 1: Your Real Data (Hidden) */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-emerald-400" />
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                Your real data (hidden)
              </span>
            </div>
            <Badge
              variant="outline"
              className="border-emerald-700 bg-emerald-950/60 text-emerald-300 text-[10px]"
            >
              Masked with padlock
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Lock className="size-3 text-zinc-500" />
                Real Address Book
              </span>
              <span className="text-zinc-400 font-semibold">
                382 Contacts (Masked: Priya S., Vikram M., Rajesh K., ...)
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Lock className="size-3 text-zinc-500" />
                Real Bank Balance
              </span>
              <span className="text-zinc-400 font-semibold">
                &#8377;48,250.00 (Protected)
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Lock className="size-3 text-zinc-500" />
                Real Home Location
              </span>
              <span className="text-zinc-400 font-semibold">
                28.6139&deg; N, 77.2090&deg; E (Masked)
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Lock className="size-3 text-zinc-500" />
                Hardware IMEI
              </span>
              <span className="text-zinc-500 font-semibold">
                864921049281729 (BLOCKED)
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: What the App Received */}
        <div
          className={cn(
            "rounded-lg border p-5 space-y-4 transition-all",
            decoyEnabled
              ? "border-purple-800/60 bg-purple-950/10"
              : "border-rose-800/60 bg-rose-950/20"
          )}
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              {decoyEnabled ? (
                <Ghost className="size-4 text-purple-400" />
              ) : (
                <AlertTriangle className="size-4 text-rose-400" />
              )}
              <span
                className={cn(
                  "text-xs font-bold uppercase tracking-wide",
                  decoyEnabled ? "text-purple-200" : "text-rose-200"
                )}
              >
                What the app received
              </span>
            </div>

            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                decoyEnabled
                  ? "border-purple-600 bg-purple-900/50 text-purple-300"
                  : "border-rose-600 bg-rose-900/50 text-rose-300 font-bold"
              )}
            >
              {decoyEnabled ? "Synthetic decoy data" : "Real data exposed"}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-zinc-900/60">
              <span className="text-zinc-400">Contacts Data</span>
              <span
                className={cn(
                  "font-bold text-right",
                  decoyEnabled ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {decoyEnabled
                  ? "154 Decoy Contacts (Aarav Sharma +91 99990 12841, Pooja Verma +91 99990 77192)"
                  : "382 Real Contacts EXPOSED"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-900/60">
              <span className="text-zinc-400">Wallet Balance</span>
              <span
                className={cn(
                  "font-bold text-right",
                  decoyEnabled ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {decoyEnabled ? "\u20b9140.00 (Synthetic dummy)" : "\u20b948,250.00 EXPOSED"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-900/60">
              <span className="text-zinc-400">Location GPS</span>
              <span
                className={cn(
                  "font-bold text-right",
                  decoyEnabled ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {decoyEnabled
                  ? "28.6129\u00b0 N, 77.2295\u00b0 E (City-center landmark)"
                  : "Exact Home Coordinates EXPOSED"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-zinc-400">Tripwire Status</span>
              <span
                className={cn(
                  "font-bold",
                  decoyEnabled ? "text-purple-300" : "text-zinc-500"
                )}
              >
                {decoyEnabled ? "ARMED (Carrier Listening)" : "DISABLED"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Synthetic Canary Records Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
            Sample Synthetic Decoy Contacts Seeded in Sandbox
          </h4>
          <span className="text-[11px] text-zinc-500">Showing 3 of 154 decoy records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-zinc-800 text-zinc-500 uppercase text-[10px]">
              <tr>
                <th className="py-2">Synthetic Name</th>
                <th className="py-2">Decoy Phone</th>
                <th className="py-2">Decoy Token ID</th>
                <th className="py-2 text-right">Carrier Tripwire Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              <tr>
                <td className="py-2.5 text-zinc-300">Aarav Sharma (Personal)</td>
                <td className="py-2.5 text-zinc-400">+91 99990 12841</td>
                <td className="py-2.5 text-purple-300 font-bold">DECOY-TRIP-084</td>
                <td className="py-2.5 text-right text-emerald-400">ACTIVE LISTENER</td>
              </tr>
              <tr>
                <td className="py-2.5 text-zinc-300">Pooja Verma (Work)</td>
                <td className="py-2.5 text-zinc-400">+91 99990 77192</td>
                <td className="py-2.5 text-purple-300 font-bold">DECOY-TRIP-085</td>
                <td className="py-2.5 text-right text-emerald-400">ACTIVE LISTENER</td>
              </tr>
              <tr>
                <td className="py-2.5 text-zinc-300">Electricity Office Desk</td>
                <td className="py-2.5 text-zinc-400">+91 99990 99403</td>
                <td className="py-2.5 text-purple-300 font-bold">DECOY-TRIP-086</td>
                <td className="py-2.5 text-right text-emerald-400">ACTIVE LISTENER</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-900">
          Tripwire explained: We plant unique decoy numbers in your phone that only this app received; when scammers call that number, we have indisputable proof of who leaked it.
        </p>
      </div>
    </div>
  )
}
