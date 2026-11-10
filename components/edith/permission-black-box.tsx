"use client"

import { useState } from "react"
import {
  ArrowDownToLine,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileCode,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  TriangleAlert,
  Sliders,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSimulation } from "@/lib/simulation-context"
import { PageHeader } from "@/components/edith/page-header"
import { cn } from "@/lib/utils"

export function PermissionBlackBox() {
  const {
    blackBoxEvents,
    isRecordingBlackBox,
    blackBoxScenario,
    setBlackBoxScenario,
    recordBlackBoxScenario,
    replayStep,
    setReplayStep,
    tamperedIndex,
    tamperBlackBoxEvent,
    verificationResult,
    verifyBlackBoxEvidence,
    exportBlackBoxJson,
  } = useSimulation()

  const displayedEvents =
    replayStep !== null ? blackBoxEvents.slice(0, replayStep) : blackBoxEvents

  const scenarioLabels: Record<string, string> = {
    challan: "Fake challan app",
    remote_screen: "Remote screen app",
    loan_app: "Loan app",
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header with One-line description and 3-step Demo Guide */}
      <PageHeader
        title="Incident Black Box"
        subtitle="A tamper-proof recorder for security incidents"
        description="A cryptographic event recorder where every security action is bound to the previous one using SHA-256."
        demoSteps={[
          'Pick a scenario and click "Record a sample incident" to stream live events.',
          'Click "Verify evidence" to confirm the cryptographic chain is intact.',
          'Click "Tamper with one event", then verify again to see the tampering alert.',
        ]}
      />

      {/* Control Toolbar */}
      <div className="rounded-[20px] border border-[#E6E1FA] bg-white p-6 space-y-4 shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Scenario Selector & Record Button */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-[#5E5A7A] font-semibold">Scenario:</span>
            <select
              value={blackBoxScenario}
              onChange={(e) =>
                setBlackBoxScenario(
                  e.target.value as "challan" | "remote_screen" | "loan_app"
                )
              }
              disabled={isRecordingBlackBox}
              className="bg-white border border-[#E6E1FA] text-[#15122B] text-xs rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5B35F5]"
            >
              <option value="challan">Fake challan app (Traffic fine scam)</option>
              <option value="remote_screen">Remote screen app (Screen mirror Trojan)</option>
              <option value="loan_app">Loan app (Contact scraping extortion)</option>
            </select>

            <Button
              type="button"
              size="sm"
              onClick={() => recordBlackBoxScenario(blackBoxScenario)}
              disabled={isRecordingBlackBox}
              className="rounded-full bg-[#5B35F5] hover:bg-[#4A27D9] text-white text-xs font-semibold h-10 px-5 shadow-[0_4px_14px_rgba(91,53,245,0.18)] flex items-center gap-2"
            >
              <Play className="size-3.5 fill-current" />
              <span>{isRecordingBlackBox ? "Recording events..." : "Record a sample incident"}</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>

          {/* Verification & Tamper Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={tamperBlackBoxEvent}
              disabled={isRecordingBlackBox || blackBoxEvents.length < 3}
              className="rounded-full border border-[#D99A1E]/30 bg-white hover:bg-[#FFF1D6] text-[#8A5A00] text-xs font-semibold h-9 px-4"
            >
              <TriangleAlert className="mr-1.5 size-3.5 text-[#D99A1E]" />
              Tamper with one event
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={verifyBlackBoxEvidence}
              disabled={isRecordingBlackBox || blackBoxEvents.length === 0}
              className="rounded-full bg-[#5B35F5] hover:bg-[#4A27D9] text-white text-xs font-semibold h-9 px-4 shadow-sm"
            >
              <ShieldCheck className="mr-1.5 size-3.5" />
              Verify evidence
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={exportBlackBoxJson}
              disabled={blackBoxEvents.length === 0}
              className="rounded-full border border-[#E6E1FA] bg-white hover:bg-[#ECE8FF] text-[#5B35F5] text-xs font-semibold h-9 px-4"
            >
              <ArrowDownToLine className="mr-1.5 size-3.5" />
              Export evidence (JSON)
            </Button>
          </div>
        </div>

        {/* Verification Status Banner */}
        {verificationResult && (
          <div
            className={cn(
              "p-4 rounded-[16px] border flex items-center justify-between text-xs transition-all",
              verificationResult.isValid
                ? "border-[#1E9E6A]/30 bg-[#E3F6EE] text-[#12704A]"
                : "border-[#D64545]/30 bg-[#FDE8E6] text-[#B42318] animate-pulse"
            )}
          >
            <div className="flex items-center gap-2.5">
              {verificationResult.isValid ? (
                <CheckCircle2 className="size-5 text-[#1E9E6A] shrink-0" />
              ) : (
                <ShieldAlert className="size-5 text-[#D64545] shrink-0" />
              )}
              <span className="font-bold text-sm">
                {verificationResult.isValid
                  ? "Evidence intact - no tampering detected"
                  : `Evidence was changed at event #${verificationResult.failedIndex}`}
              </span>
            </div>
            <span className="text-xs opacity-90 hidden sm:inline">
              {verificationResult.isValid
                ? "Cryptographic SHA-256 chain recomputed successfully across all entries."
                : "Hash mismatch detected. Downstream forensic integrity invalidated."}
            </span>
          </div>
        )}

        {/* Replay Scrubbing Slider */}
        {blackBoxEvents.length > 0 && (
          <div className="pt-3 border-t border-[#EEEAFB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#15122B]">
              <Sliders className="size-4 text-[#5B35F5]" />
              <span className="font-semibold">Replay slider:</span>
              <span className="text-[#5B35F5] font-bold">
                {replayStep !== null ? `Event ${replayStep} of ${blackBoxEvents.length}` : `All ${blackBoxEvents.length} events`}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-1 max-w-md">
              <input
                type="range"
                min="1"
                max={blackBoxEvents.length}
                value={replayStep ?? blackBoxEvents.length}
                onChange={(e) => setReplayStep(Number(e.target.value))}
                className="w-full accent-[#5B35F5] h-1.5 bg-[#E6E1FA] rounded-full cursor-pointer"
              />
              {replayStep !== null && (
                <button
                  type="button"
                  onClick={() => setReplayStep(null)}
                  className="text-xs text-[#5B35F5] hover:underline whitespace-nowrap font-semibold cursor-pointer"
                >
                  Show All
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Table or Empty State */}
      <div className="rounded-[20px] border border-[#E6E1FA] bg-white overflow-hidden shadow-none">
        {blackBoxEvents.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Clock className="size-8 text-[#5E5A7A]/40 mx-auto" />
            <p className="text-sm text-[#15122B] font-semibold">
              Run the demo to see activity here
            </p>
            <p className="text-xs text-[#5E5A7A]">
              Pick a scenario above and click &quot;Record a sample incident&quot; to stream tamper-proof events.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#F9F8FF] border-b border-[#EEEAFB] text-[#5E5A7A] text-[13px] font-semibold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 w-28">Time (IST)</th>
                  <th className="py-3 px-4">Application &amp; Action</th>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4 w-32 text-right">SHA-256 Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEAFB]">
                {displayedEvents.map((evt) => {
                  const isTampered = tamperedIndex === evt.index
                  const isFailedVerification =
                    verificationResult &&
                    !verificationResult.isValid &&
                    verificationResult.failedIndex === evt.index

                  const isCritical = evt.severity === "critical"
                  const isWarning = evt.severity === "warning"
                  const isSuccess = evt.severity === "success"

                  const shortHash = evt.hash ? `${evt.hash.slice(0, 4)}...${evt.hash.slice(-4)}` : "calc..."

                  return (
                    <tr
                      key={evt.id}
                      className={cn(
                        "h-[52px] hover:bg-[#F9F8FF] transition-colors",
                        isFailedVerification
                          ? "bg-[#FDE8E6]/60 border-l-4 border-l-[#D64545]"
                          : isTampered
                          ? "bg-[#FFF1D6]/40"
                          : ""
                      )}
                    >
                      <td className="py-3 px-4 text-center text-[#5E5A7A] font-bold text-xs">
                        {evt.index}
                      </td>
                      <td className="py-3 px-4 text-[#5E5A7A] text-xs whitespace-nowrap font-mono">
                        {evt.timestamp}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#15122B]">
                        <div className="flex items-center gap-2">
                          <span>{evt.app}</span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold",
                              isCritical
                                ? "bg-[#FDE8E6] text-[#B42318] border border-[#D64545]/20"
                                : isWarning
                                ? "bg-[#FFF1D6] text-[#8A5A00] border border-[#D99A1E]/20"
                                : isSuccess
                                ? "bg-[#E3F6EE] text-[#12704A] border border-[#1E9E6A]/20"
                                : "bg-[#F9F8FF] text-[#5E5A7A] border border-[#E6E1FA]"
                            )}
                          >
                            {evt.action}
                          </span>
                        </div>
                        <div className="text-xs text-[#5E5A7A] font-normal">{evt.process}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#15122B]">
                        <div
                          className={cn(
                            "leading-relaxed",
                            isTampered ? "text-[#8A5A00] font-bold underline" : ""
                          )}
                        >
                          {evt.details}
                        </div>
                        {isTampered && (
                          <span className="text-[11px] text-[#B42318] block font-semibold mt-0.5">
                            &uarr; [Tampered text: hash no longer matches original signature]
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          title={evt.hash}
                          className="px-2.5 py-1 rounded-full bg-[#ECE8FF] text-[#5B35F5] border border-[#5B35F5]/20 text-[11px] font-mono font-semibold"
                        >
                          {shortHash}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statutory Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#5E5A7A] gap-2 pt-1">
        <span>Standard: Electronic Record Certificate aligned with BSA Sec. 63</span>
        <span>Every row includes previous row&apos;s SHA-256 hash</span>
      </div>
    </div>
  )
}
