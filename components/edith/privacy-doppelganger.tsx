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
      <div className="rounded-[20px] border border-[#E6E1FA] bg-white p-6 space-y-4 shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Ghost className="size-5 text-[#5B35F5]" />
              <h2 className="text-base font-bold text-[#15122B]">
                Privacy Doppelganger Engine
              </h2>
              <span className="rounded-full bg-[#ECE8FF] text-[#5B35F5] border border-[#5B35F5]/20 text-[11px] font-semibold px-2.5 py-0.5">
                Concept demo
              </span>
            </div>
            <p className="text-xs text-[#5E5A7A]">
              When enabled, rogue read queries receive realistic synthetic data with embedded carrier tripwires.
            </p>
          </div>

          {/* Main Switch: Decoy Protection ON/OFF */}
          <div className="flex items-center gap-3 bg-[#F9F8FF] border border-[#E6E1FA] px-4 py-2.5 rounded-full shrink-0">
            <div className="text-right">
              <div className="text-xs font-bold text-[#15122B]">
                Decoy protection
              </div>
              <div
                className={cn(
                  "text-[10px] font-bold",
                  decoyEnabled ? "text-[#12704A]" : "text-[#B42318]"
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
                decoyEnabled ? "bg-[#5B35F5]" : "bg-[#CFC9EA]"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  decoyEnabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        {/* Read Counter & Simulator Buttons */}
        <div className="pt-4 border-t border-[#EEEAFB] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Read Counter Badge */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#5E5A7A]">Decoy reads served:</span>
            <span className="px-3 py-1 rounded-full bg-[#ECE8FF] text-[#5B35F5] font-bold font-mono">
              {decoyReadsCount}
            </span>
          </div>

          {/* Simulator Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="bg-white border border-[#E6E1FA] text-[#15122B] text-xs rounded-full px-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5B35F5]"
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
              className="bg-white border border-[#E6E1FA] text-[#15122B] text-xs rounded-full px-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5B35F5]"
            >
              <option value="Contacts">Contacts</option>
              <option value="Location">Location</option>
              <option value="Bank balance">Bank balance</option>
            </select>

            <Button
              type="button"
              size="sm"
              onClick={() => simulateAppReadsData(selectedAppId, selectedDataType)}
              className="rounded-full bg-[#5B35F5] hover:bg-[#4A27D9] text-white text-xs font-semibold h-9 px-4 shadow-[0_4px_14px_rgba(91,53,245,0.18)]"
            >
              <Play className="mr-1.5 size-3 fill-current" />
              Simulate: app tries to read my data
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => simulateDecoyTripwire(selectedAppId)}
              className="rounded-full border border-[#D64545]/30 bg-white hover:bg-[#FDE8E6] text-[#B42318] text-xs font-semibold h-9 px-4"
            >
              <PhoneCall className="mr-1.5 size-3 text-[#D64545]" />
              Simulate: scammer uses a decoy contact
            </Button>
          </div>
        </div>
      </div>

      {/* Tripwire Alert Banner */}
      {decoyTripwireAlert && (
        <div className="rounded-[16px] border border-[#D64545]/30 bg-[#FDE8E6]/50 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#B42318] font-bold text-sm">
              <PhoneCall className="size-4 text-[#D64545] animate-pulse" />
              <span>TRIPWIRE ALARM: Extortion Call Detected on Decoy Line</span>
            </div>
            <button
              type="button"
              onClick={dismissTripwireAlert}
              className="text-xs text-[#B42318] hover:underline font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <p className="text-xs text-[#15122B] leading-relaxed">
            Decoy contact <strong>&quot;{decoyTripwireAlert.decoyName}&quot;</strong> ({decoyTripwireAlert.decoyPhone}) just received an extortion call from {decoyTripwireAlert.scammerOrigin}. This independently confirms that <strong>{decoyTripwireAlert.appName}</strong> exfiltrated your address book to a scam syndicate.
          </p>

          <p className="text-[11px] text-[#5E5A7A] pt-2 border-t border-[#D64545]/20">
            Tripwire explained: We plant unique decoy numbers in your phone that only this app received; when scammers call that number, we have indisputable proof of who leaked it.
          </p>
        </div>
      )}

      {/* Two Columns: Real Data (Hidden) vs What the App Received */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        {/* Column 1: Your Real Data (Hidden) */}
        <div className="rounded-[20px] border border-[#E6E1FA] bg-white p-6 space-y-4 shadow-none">
          <div className="flex items-center justify-between border-b border-[#EEEAFB] pb-3">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-[#1E9E6A]" />
              <span className="text-xs font-bold text-[#15122B] uppercase tracking-wide">
                Your real data (hidden)
              </span>
            </div>
            <span className="rounded-full bg-[#E3F6EE] text-[#12704A] border border-[#1E9E6A]/20 text-[10px] font-semibold px-2.5 py-0.5">
              Masked with padlock
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[#EEEAFB]">
              <span className="text-[#5E5A7A] flex items-center gap-1.5">
                <Lock className="size-3 text-[#5E5A7A]" />
                Real Address Book
              </span>
              <span className="text-[#15122B] font-semibold">
                382 Contacts (Masked: Priya S., Vikram M., Rajesh K., ...)
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-[#EEEAFB]">
              <span className="text-[#5E5A7A] flex items-center gap-1.5">
                <Lock className="size-3 text-[#5E5A7A]" />
                Real Bank Balance
              </span>
              <span className="text-[#15122B] font-semibold">
                &#8377;48,250.00 (Protected)
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-[#EEEAFB]">
              <span className="text-[#5E5A7A] flex items-center gap-1.5">
                <Lock className="size-3 text-[#5E5A7A]" />
                Real Home Location
              </span>
              <span className="text-[#15122B] font-semibold">
                28.6139&deg; N, 77.2090&deg; E (Masked)
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-[#5E5A7A] flex items-center gap-1.5">
                <Lock className="size-3 text-[#5E5A7A]" />
                Hardware IMEI
              </span>
              <span className="text-[#5E5A7A] font-semibold font-mono">
                864921049281729 (BLOCKED)
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: What the App Received */}
        <div
          className={cn(
            "rounded-[20px] border p-6 space-y-4 transition-all shadow-none bg-white",
            decoyEnabled
              ? "border-[#5B35F5]/30 bg-[#ECE8FF]/20"
              : "border-[#D64545]/30 bg-[#FDE8E6]/20"
          )}
        >
          <div className="flex items-center justify-between border-b border-[#EEEAFB] pb-3">
            <div className="flex items-center gap-2">
              {decoyEnabled ? (
                <Ghost className="size-4 text-[#5B35F5]" />
              ) : (
                <AlertTriangle className="size-4 text-[#D64545]" />
              )}
              <span className="text-xs font-bold uppercase tracking-wide text-[#15122B]">
                What the app received
              </span>
            </div>

            <span
              className={cn(
                "text-[10px] rounded-full px-2.5 py-0.5 font-bold",
                decoyEnabled
                  ? "bg-[#ECE8FF] text-[#5B35F5] border border-[#5B35F5]/20"
                  : "bg-[#FDE8E6] text-[#B42318] border border-[#D64545]/20"
              )}
            >
              {decoyEnabled ? "Synthetic decoy data" : "Real data exposed"}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[#EEEAFB]">
              <span className="text-[#5E5A7A]">Contacts Data</span>
              <span
                className={cn(
                  "font-bold text-right",
                  decoyEnabled ? "text-[#12704A]" : "text-[#B42318]"
                )}
              >
                {decoyEnabled
                  ? "154 Decoy Contacts (Aarav Sharma +91 99990 12841, Pooja Verma +91 99990 77192)"
                  : "382 Real Contacts EXPOSED"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-[#EEEAFB]">
              <span className="text-[#5E5A7A]">Wallet Balance</span>
              <span
                className={cn(
                  "font-bold text-right",
                  decoyEnabled ? "text-[#12704A]" : "text-[#B42318]"
                )}
              >
                {decoyEnabled ? "\u20b9140.00 (Synthetic dummy)" : "\u20b948,250.00 EXPOSED"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-[#EEEAFB]">
              <span className="text-[#5E5A7A]">Location GPS</span>
              <span
                className={cn(
                  "font-bold text-right",
                  decoyEnabled ? "text-[#12704A]" : "text-[#B42318]"
                )}
              >
                {decoyEnabled
                  ? "28.6129\u00b0 N, 77.2295\u00b0 E (City landmark)"
                  : "Exact Home Coordinates EXPOSED"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-[#5E5A7A]">Tripwire Status</span>
              <span
                className={cn(
                  "font-bold",
                  decoyEnabled ? "text-[#5B35F5]" : "text-[#5E5A7A]"
                )}
              >
                {decoyEnabled ? "ARMED (Carrier Listening)" : "DISABLED"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Synthetic Canary Records Table */}
      <div className="rounded-[20px] border border-[#E6E1FA] bg-white p-6 space-y-4 shadow-none text-xs">
        <div className="flex items-center justify-between border-b border-[#EEEAFB] pb-3">
          <h4 className="text-xs font-bold text-[#15122B] uppercase tracking-wide">
            Sample Synthetic Decoy Contacts Seeded in Sandbox
          </h4>
          <span className="text-[11px] text-[#5E5A7A]">Showing 3 of 154 decoy records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-[#EEEAFB] text-[#5E5A7A] uppercase text-[10px] bg-[#F9F8FF]">
              <tr>
                <th className="py-2.5 px-3">Synthetic Name</th>
                <th className="py-2.5 px-3">Decoy Phone</th>
                <th className="py-2.5 px-3">Decoy Token ID</th>
                <th className="py-2.5 px-3 text-right">Carrier Tripwire Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEAFB]">
              <tr className="h-[48px]">
                <td className="py-2.5 px-3 text-[#15122B] font-medium">Aarav Sharma (Personal)</td>
                <td className="py-2.5 px-3 text-[#5E5A7A] font-mono">+91 99990 12841</td>
                <td className="py-2.5 px-3 text-[#5B35F5] font-bold font-mono">DECOY-TRIP-084</td>
                <td className="py-2.5 px-3 text-right text-[#12704A] font-semibold">ACTIVE LISTENER</td>
              </tr>
              <tr className="h-[48px]">
                <td className="py-2.5 px-3 text-[#15122B] font-medium">Pooja Verma (Work)</td>
                <td className="py-2.5 px-3 text-[#5E5A7A] font-mono">+91 99990 77192</td>
                <td className="py-2.5 px-3 text-[#5B35F5] font-bold font-mono">DECOY-TRIP-085</td>
                <td className="py-2.5 px-3 text-right text-[#12704A] font-semibold">ACTIVE LISTENER</td>
              </tr>
              <tr className="h-[48px]">
                <td className="py-2.5 px-3 text-[#15122B] font-medium">Electricity Office Desk</td>
                <td className="py-2.5 px-3 text-[#5E5A7A] font-mono">+91 99990 99403</td>
                <td className="py-2.5 px-3 text-[#5B35F5] font-bold font-mono">DECOY-TRIP-086</td>
                <td className="py-2.5 px-3 text-right text-[#12704A] font-semibold">ACTIVE LISTENER</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-[#5E5A7A] pt-2 border-t border-[#EEEAFB]">
          Tripwire explained: We plant unique decoy numbers in your phone that only this app received; when scammers call that number, we have indisputable proof of who leaked it.
        </p>
      </div>
    </div>
  )
}
