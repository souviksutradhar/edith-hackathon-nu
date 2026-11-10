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
      <div className="rounded-[20px] border border-[#E6E1FA] bg-white p-5 space-y-4 shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 size-4 text-[#5E5A7A]" />
            <input
              type="text"
              placeholder="Search by app, permission, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E6E1FA] rounded-[12px] pl-10 pr-3 py-1.5 text-xs text-[#15122B] placeholder:text-[#5E5A7A] focus:outline-none focus:ring-2 focus:ring-[#ECE8FF] focus:border-[#5B35F5]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={addSampleDayOfActivity}
              className="bg-[#5B35F5] hover:bg-[#4A27D9] text-white font-medium text-xs h-[38px] px-4 rounded-full shadow-[0_4px_14px_rgba(91,53,245,0.18)]"
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
              className="border-[#E6E1FA] bg-white hover:bg-[#F9F8FF] text-[#15122B] text-xs h-[38px] px-4 rounded-full"
            >
              <Download className="mr-1.5 size-3 text-[#5E5A7A]" />
              Download CSV
            </Button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-[#EEEAFB] gap-2">
          <div className="flex items-center gap-1.5">
            {(["all", "Allowed", "Flagged", "Blocked"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors border",
                  filter === f
                    ? "bg-[#ECE8FF] text-[#5B35F5] border-[#5B35F5]/30 font-semibold"
                    : "bg-[#F9F8FF] text-[#5E5A7A] border-[#E6E1FA] hover:text-[#15122B] hover:bg-white"
                )}
              >
                {f === "all" ? "All Events" : f}
              </button>
            ))}
          </div>

          <span className="text-xs text-[#5E5A7A]">
            Showing {filteredLogs.length} of {displayLogs.length} records
          </span>
        </div>
      </div>

      {/* Main Table or Empty State */}
      <div className="rounded-[20px] border border-[#E6E1FA] bg-white overflow-hidden shadow-none">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm text-[#15122B] font-semibold">
              Run the demo to see activity here
            </p>
            <p className="text-xs text-[#5E5A7A]">
              Click &quot;Add a sample day of activity&quot; or trigger a simulation from the Home Page to view telemetry.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F9F8FF] border-b border-[#EEEAFB] text-[#5E5A7A] uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold w-24">Time (IST)</th>
                  <th className="py-3 px-4 font-semibold">Application</th>
                  <th className="py-3 px-4 font-semibold">Sensor / Vector</th>
                  <th className="py-3 px-4 font-semibold">Details</th>
                  <th className="py-3 px-4 font-semibold text-right w-28">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEAFB]">
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
                        "hover:bg-[#F9F8FF]/80 cursor-pointer transition-colors",
                        isExpanded ? "bg-[#F9F8FF]" : ""
                      )}
                    >
                      <td className="py-3 px-4 text-[#5E5A7A] font-mono whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#15122B] whitespace-nowrap">
                        <div>{log.app}</div>
                        <div className="text-[11px] text-[#5E5A7A] font-mono font-normal">{log.process}</div>
                      </td>
                      <td className="py-3 px-4 text-[#5E5A7A]">
                        <span className="px-2 py-0.5 rounded-full bg-[#F4F2FF] border border-[#E6E1FA] text-[11px] font-mono text-[#5B35F5] whitespace-nowrap inline-block">
                          {log.hook}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#15122B]">
                        <div className="leading-relaxed flex items-center justify-between gap-2">
                          <span className="line-clamp-1">{log.details}</span>
                          {isExpanded ? (
                            <ChevronUp className="size-3.5 text-[#5E5A7A] shrink-0" />
                          ) : (
                            <ChevronDown className="size-3.5 text-[#5E5A7A] shrink-0" />
                          )}
                        </div>

                        {/* Expandable Accordion Panel */}
                        {isExpanded && (
                          <div className="mt-2.5 p-3.5 rounded-[12px] border border-[#E6E1FA] bg-[#F9F8FF] space-y-2 text-xs">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#5E5A7A] tracking-wider block">
                                Full Action Description:
                              </span>
                              <p className="text-[#15122B] mt-0.5">{log.details}</p>
                            </div>

                            {log.ruleTriggered && (
                              <div>
                                <span className="text-[10px] uppercase font-bold text-[#5E5A7A] tracking-wider block">
                                  Policy Rule Triggered:
                                </span>
                                <span className="text-[#5B35F5] font-mono text-[11px] font-semibold">
                                  {log.ruleTriggered}
                                </span>
                              </div>
                            )}

                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#5E5A7A] tracking-wider block">
                                Why this was {verdict.toLowerCase()}:
                              </span>
                              <p className="text-[#5E5A7A] mt-0.5 leading-relaxed">
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
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                            isBlocked
                              ? "bg-[#FDE8E6] text-[#B42318] border-[#D64545]/30"
                              : isFlagged
                              ? "bg-[#FFF1D6] text-[#8A5A00] border-[#D99A1E]/30"
                              : "bg-[#E3F6EE] text-[#12704A] border-[#1E9E6A]/30"
                          )}
                        >
                          {isBlocked ? (
                            <XCircle className="size-3" />
                          ) : isFlagged ? (
                            <Flag className="size-3" />
                          ) : (
                            <ShieldCheck className="size-3" />
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

      <div className="flex items-center justify-between text-xs text-[#5E5A7A]">
        <span>Click any event row to expand plain-English reason and policy details</span>
        <span className="font-mono">24h IST clock</span>
      </div>
    </div>
  )
}
