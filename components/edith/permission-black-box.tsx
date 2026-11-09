"use client"

import { useState } from "react"
import {
  ArrowDownToLine,
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
          'Click "Tamper with one event", then verify again to see the red tampering alert.',
        ]}
      />

      {/* Control Toolbar */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Scenario Selector & Record Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs text-zinc-400 font-mono">Scenario:</span>
            <select
              value={blackBoxScenario}
              onChange={(e) =>
                setBlackBoxScenario(
                  e.target.value as "challan" | "remote_screen" | "loan_app"
                )
              }
              disabled={isRecordingBlackBox}
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded px-2.5 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
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
              className="bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-mono text-xs font-bold h-8 px-3"
            >
              <Play className="mr-1.5 size-3 fill-current" />
              {isRecordingBlackBox ? "Recording events..." : "Record a sample incident"}
            </Button>
          </div>

          {/* Verification & Tamper Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={tamperBlackBoxEvent}
              disabled={isRecordingBlackBox || blackBoxEvents.length < 3}
              className="border-amber-700/60 bg-amber-950/30 hover:bg-amber-950/60 text-amber-300 font-mono text-xs h-8 px-3"
            >
              <TriangleAlert className="mr-1.5 size-3 text-amber-400" />
              Tamper with one event (Demo)
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={verifyBlackBoxEvidence}
              disabled={isRecordingBlackBox || blackBoxEvents.length === 0}
              className="bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-bold h-8 px-3"
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
              className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs h-8 px-3"
            >
              <ArrowDownToLine className="mr-1.5 size-3 text-zinc-400" />
              Export evidence (JSON)
            </Button>
          </div>
        </div>

        {/* Verification Status Banner */}
        {verificationResult && (
          <div
            className={cn(
              "p-3 rounded-lg border flex items-center justify-between text-xs font-mono transition-all",
              verificationResult.isValid
                ? "border-emerald-700/80 bg-emerald-950/40 text-emerald-300"
                : "border-rose-700/80 bg-rose-950/50 text-rose-300 animate-pulse"
            )}
          >
            <div className="flex items-center gap-2">
              {verificationResult.isValid ? (
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="size-4 text-rose-400 shrink-0" />
              )}
              <span className="font-bold">
                {verificationResult.isValid
                  ? "Evidence intact - no tampering detected"
                  : `Evidence was changed at event #${verificationResult.failedIndex}`}
              </span>
            </div>
            <span className="text-[11px] opacity-80">
              {verificationResult.isValid
                ? "Cryptographic SHA-256 chain recomputed successfully across all entries."
                : "Hash mismatch detected. Downstream forensic integrity invalidated."}
            </span>
          </div>
        )}

        {/* Replay Scrubbing Slider */}
        {blackBoxEvents.length > 0 && (
          <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-zinc-300">
              <Sliders className="size-3.5 text-cyan-400" />
              <span>Replay slider:</span>
              <span className="text-cyan-400 font-bold">
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
                className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              {replayStep !== null && (
                <button
                  type="button"
                  onClick={() => setReplayStep(null)}
                  className="text-[11px] text-zinc-400 hover:text-zinc-200 underline whitespace-nowrap"
                >
                  Show All
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Table or Empty State */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden font-mono text-xs">
        {blackBoxEvents.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Clock className="size-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400 font-semibold">
              Run the demo to see activity here
            </p>
            <p className="text-[11px] text-zinc-600">
              Pick a scenario above and click &quot;Record a sample incident&quot; to stream tamper-proof events.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 font-bold w-12 text-center">#</th>
                  <th className="py-2.5 px-3 font-bold w-24">Time (IST)</th>
                  <th className="py-2.5 px-3 font-bold">Application &amp; Action</th>
                  <th className="py-2.5 px-3 font-bold">Event Details</th>
                  <th className="py-2.5 px-3 font-bold w-28 text-right">SHA-256 Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
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
                        "hover:bg-zinc-900/40 transition-colors",
                        isFailedVerification
                          ? "bg-rose-950/40 border-l-2 border-l-rose-500"
                          : isTampered
                          ? "bg-amber-950/20"
                          : ""
                      )}
                    >
                      <td className="py-2.5 px-3 text-center text-zinc-500 font-bold">
                        {evt.index}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">
                        {evt.timestamp}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-zinc-200">
                        <div className="flex items-center gap-1.5">
                          <span>{evt.app}</span>
                          <span
                            className={cn(
                              "px-1.5 py-0.2 rounded text-[9px] font-bold border",
                              isCritical
                                ? "border-rose-800 bg-rose-950/60 text-rose-300"
                                : isWarning
                                ? "border-amber-800 bg-amber-950/60 text-amber-300"
                                : isSuccess
                                ? "border-emerald-800 bg-emerald-950/60 text-emerald-300"
                                : "border-zinc-800 bg-zinc-900 text-zinc-400"
                            )}
                          >
                            {evt.action}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-normal">{evt.process}</div>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300">
                        <div
                          className={cn(
                            "leading-relaxed",
                            isTampered ? "text-amber-300 font-bold underline" : ""
                          )}
                        >
                          {evt.details}
                        </div>
                        {isTampered && (
                          <span className="text-[10px] text-amber-400 block font-semibold">
                            &uarr; [Tampered text: hash no longer matches original signature]
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span
                          title={evt.hash}
                          className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-mono"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-500 font-mono gap-2">
        <span>Standard: Electronic Record Certificate aligned with BSA Sec. 63</span>
        <span>Every row includes previous row&apos;s SHA-256 hash</span>
      </div>
    </div>
  )
}
