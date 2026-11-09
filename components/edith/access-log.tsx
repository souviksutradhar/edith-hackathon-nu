"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Flag, ShieldCheck, XCircle } from "lucide-react";
import type { AccessLogEntry, LogResult } from "@/lib/edith-data";
import { cn } from "@/lib/utils";

type Filter = "all" | LogResult;

interface AccessLogProps {
  logs: AccessLogEntry[];
  query: string;
  heightClass?: string;
  title?: string;
}

export function AccessLog({
  logs,
  query,
  heightClass = "max-h-72",
  title = "Ingress Threat & Telemetry Audit Trail",
}: AccessLogProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs
      .filter((l) => filter === "all" || l.result === filter)
      .filter(
        (l) =>
          !q ||
          l.app.toLowerCase().includes(q) ||
          l.resource.toLowerCase().includes(q) ||
          (l.details && l.details.toLowerCase().includes(q))
      )
      .slice()
      .reverse();
  }, [logs, filter, query]);

  return (
    <div className="rounded-lg border border-zinc-800/90 bg-zinc-950 font-mono text-xs overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-zinc-800/80 px-4 py-3 bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <h3 className="text-xs uppercase font-bold tracking-wider text-zinc-300">
            {title}
          </h3>
          <span className="text-[10px] text-zinc-500 font-normal">
            ({visible.length} records)
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1">
          {(["all", "Allowed", "Flagged", "Blocked"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border",
                filter === f
                  ? "bg-zinc-800 text-zinc-100 border-zinc-700 font-semibold"
                  : "bg-transparent text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900/60"
              )}
            >
              {f === "all" ? "All Events" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Tabular Single-Line Event Rows */}
      <div className={cn("overflow-x-auto overflow-y-auto scrollbar-thin", heightClass)}>
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800 text-zinc-500 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-2 px-3 font-semibold w-24">Timestamp</th>
              <th className="py-2 px-3 font-semibold w-44">Entity / App</th>
              <th className="py-2 px-3 font-semibold w-36">Sensor / Vector</th>
              <th className="py-2 px-3 font-semibold">Incident Telemetry / Action Detail</th>
              <th className="py-2 px-3 font-semibold text-right w-24">Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-500 text-xs">
                  No audit log entries match current filter.
                </td>
              </tr>
            ) : (
              visible.map((log) => {
                const isFlagged = log.result === "Flagged";
                const isBlocked = log.result === "Blocked";
                return (
                  <tr
                    key={log.id}
                    className="hover:bg-zinc-900/50 transition-colors group"
                  >
                    <td className="py-2 px-3 text-zinc-500 whitespace-nowrap text-[11px]">
                      {log.time}
                    </td>
                    <td className="py-2 px-3 font-semibold text-zinc-200 whitespace-nowrap">
                      {log.app}
                    </td>
                    <td className="py-2 px-3 text-zinc-400 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px]">
                        {log.resource}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-zinc-300 max-w-md truncate text-[11px]">
                      {log.details || "Routine sensor hook verification"}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider",
                          isFlagged
                            ? "bg-rose-950/40 text-rose-400 border border-rose-900/50"
                            : isBlocked
                            ? "bg-amber-950/40 text-amber-400 border border-amber-900/50"
                            : "bg-emerald-950/30 text-emerald-400 border border-emerald-900/40"
                        )}
                      >
                        {isFlagged ? (
                          <Flag className="size-2.5" />
                        ) : isBlocked ? (
                          <XCircle className="size-2.5" />
                        ) : (
                          <ShieldCheck className="size-2.5" />
                        )}
                        {log.result}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
