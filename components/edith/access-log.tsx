"use client"

import { useMemo, useState } from "react"
import {
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Flag,
  Search,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/edith/page-header"
import { useSimulation, type SimulationEvent } from "@/lib/simulation-context"
import { cn } from "@/lib/utils"

type Filter = "all" | "Allowed" | "Flagged" | "Blocked"

export function AccessLog() {
  const { events, addSampleDayOfActivity } = useSimulation()
  const [filter, setFilter] = useState<Filter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Map SimulationEvents to normalized display rows with deduplication
  const displayLogs = useMemo(() => {
    const seen = new Set<string>()
    return events.filter((e) => {
      if (seen.has(e.id)) return false
      seen.add(e.id)
      return true
    })
  }, [events])

  // Filter & Search logic
  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return displayLogs.filter((log) => {
      const verdict =
        log.severity === "critical"
          ? "Blocked"
          : log.severity === "warning"
          ? "Flagged"
          : "Allowed"

      if (filter !== "all" && verdict !== filter) return false

      if (!q) return true
      return (
        log.app.toLowerCase().includes(q) ||
        log.process.toLowerCase().includes(q) ||
        log.hook.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.explanation && log.explanation.toLowerCase().includes(q))
      )
    })
  }, [displayLogs, filter, searchQuery])

  // Download CSV export handler
  const handleDownloadCsv = () => {
    if (filteredLogs.length === 0) return

    const headers = [
      "Time (IST)",
      "Application",
      "Process Identifier",
      "Sensor / Hook",
      "Action",
      "Verdict",
      "Details",
      "Rule Triggered",
      "Explanation",
    ]

    const escapeCsv = (str?: string) => {
      if (!str) return '""'
      return `"${str.replace(/"/g, '""')}"`
    }

    const rows = filteredLogs.map((log) => {
      const verdict =
        log.severity === "critical"
          ? "Blocked"
          : log.severity === "warning"
          ? "Flagged"
          : "Allowed"

      return [
        escapeCsv(log.timestamp),
        escapeCsv(log.app),
        escapeCsv(log.process),
        escapeCsv(log.hook),
        escapeCsv(log.action),
        escapeCsv(verdict),
        escapeCsv(log.details),
        escapeCsv(log.ruleTriggered || "N/A"),
        escapeCsv(log.explanation || log.details),
      ].join(",")
    })

    const csvContent = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `EDITH-Activity-Logs-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Activity Logs"
        subtitle="Everything that happened, in one place"
        description="Unified audit trail of every allowed, flagged, and blocked app interaction on your device."
        demoSteps={[
          'Click "Add a sample day of activity" to populate realistic day-to-day events.',
          "Use the filter buttons (All / Allowed / Flagged / Blocked) or search bar to inspect specific entries.",
          "Click any row to expand a plain-English explanation of why the action was permitted or blocked.",
        ]}
      />

      {/* Control Bar: Search, Filters, Add Sample, Download CSV */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-3 font-mono text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 size-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by app, permission, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={addSampleDayOfActivity}
              className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-mono text-xs font-bold h-8 px-3"
            >
              <CalendarPlus className="mr-1.5 size-3.5" />
              Add a sample day of activity
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDownloadCsv}
              disabled={filteredLogs.length === 0}
              className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs h-8 px-3"
            >
              <Download className="mr-1.5 size-3 text-zinc-400" />
              Download CSV
            </Button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-zinc-800/80 gap-2">
          <div className="flex items-center gap-1.5">
            {(["all", "Allowed", "Flagged", "Blocked"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors border",
                  filter === f
                    ? "bg-zinc-800 text-zinc-100 border-zinc-700 font-semibold"
                    : "bg-transparent text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900/60"
                )}
              >
                {f === "all" ? "All Events" : f}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-zinc-500">
            Showing {filteredLogs.length} of {displayLogs.length} records
          </span>
        </div>
      </div>

      {/* Main Table or Empty State */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-xs text-zinc-400 font-semibold">
              Run the demo to see activity here
            </p>
            <p className="text-[11px] text-zinc-600">
              Click &quot;Add a sample day of activity&quot; or trigger a simulation from the Home Page to view telemetry.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 font-bold w-24">Time (IST)</th>
                  <th className="py-2.5 px-3 font-bold">Application</th>
                  <th className="py-2.5 px-3 font-bold">Sensor / Vector</th>
                  <th className="py-2.5 px-3 font-bold">Details</th>
                  <th className="py-2.5 px-3 font-bold text-right w-28">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredLogs.map((log) => {
                  const isBlocked = log.severity === "critical"
                  const isFlagged = log.severity === "warning"
                  const verdict = isBlocked ? "Blocked" : isFlagged ? "Flagged" : "Allowed"
                  const isExpanded = expandedId === log.id

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className={cn(
                        "hover:bg-zinc-900/50 cursor-pointer transition-colors",
                        isExpanded ? "bg-zinc-900/40" : ""
                      )}
                    >
                      <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-zinc-200 whitespace-nowrap">
                        <div>{log.app}</div>
                        <div className="text-[10px] text-zinc-500 font-normal">{log.process}</div>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] whitespace-nowrap inline-block">
                          {log.hook}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300">
                        <div className="leading-relaxed flex items-center justify-between gap-2">
                          <span className="line-clamp-1">{log.details}</span>
                          {isExpanded ? (
                            <ChevronUp className="size-3 text-zinc-500 shrink-0" />
                          ) : (
                            <ChevronDown className="size-3 text-zinc-500 shrink-0" />
                          )}
                        </div>

                        {/* Expandable Accordion Panel */}
                        {isExpanded && (
                          <div className="mt-2.5 p-3 rounded border border-zinc-800 bg-zinc-900/80 space-y-2 text-xs">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                                Full Action Description:
                              </span>
                              <p className="text-zinc-200 mt-0.5">{log.details}</p>
                            </div>

                            {log.ruleTriggered && (
                              <div>
                                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                                  Policy Rule Triggered:
                                </span>
                                <span className="text-cyan-400 font-mono text-[11px]">
                                  {log.ruleTriggered}
                                </span>
                              </div>
                            )}

                            <div>
                              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                                Why this was {verdict.toLowerCase()}:
                              </span>
                              <p className="text-zinc-300 mt-0.5 leading-relaxed">
                                {log.explanation ||
                                  (isBlocked
                                    ? "Blocked to protect sensitive credentials and prevent unauthorized data exfiltration."
                                    : isFlagged
                                    ? "Flagged for anomalous frequency or mismatch with declared utility purpose."
                                    : "Permitted because the application operated strictly within expected declared parameters.")}
                              </p>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border",
                            isBlocked
                              ? "bg-rose-950/60 text-rose-300 border-rose-800"
                              : isFlagged
                              ? "bg-amber-950/60 text-amber-300 border-amber-800"
                              : "bg-emerald-950/40 text-emerald-300 border-emerald-900/50"
                          )}
                        >
                          {isBlocked ? (
                            <XCircle className="size-2.5" />
                          ) : isFlagged ? (
                            <Flag className="size-2.5" />
                          ) : (
                            <ShieldCheck className="size-2.5" />
                          )}
                          {verdict}
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

      <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
        <span>Click any event row to expand plain-English reason and policy details</span>
        <span>24h IST clock</span>
      </div>
    </div>
  )
}
