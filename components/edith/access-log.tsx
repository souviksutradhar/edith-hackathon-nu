"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, Flag, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AccessLogEntry, LogResult } from "@/lib/edith-data"
import { cn } from "@/lib/utils"

type Filter = "all" | LogResult

const resultStyles: Record<LogResult, { text: string; bg: string; icon: typeof Flag }> = {
  Allowed: { text: "text-success", bg: "bg-success/10", icon: CheckCircle2 },
  Flagged: { text: "text-danger", bg: "bg-danger/10", icon: Flag },
  Blocked: { text: "text-warning", bg: "bg-warning/10", icon: XCircle },
}

interface AccessLogProps {
  logs: AccessLogEntry[]
  query: string
  heightClass?: string
  title?: string
}

export function AccessLog({ logs, query, heightClass = "h-80", title = "Live Access History" }: AccessLogProps) {
  const [filter, setFilter] = useState<Filter>("all")

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return logs
      .filter((l) => filter === "all" || l.result === filter)
      .filter(
        (l) =>
          !q || l.app.toLowerCase().includes(q) || l.resource.toLowerCase().includes(q),
      )
      .slice()
      .reverse()
  }, [logs, filter, query])

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            {title}
          </CardTitle>
          <CardDescription>Most recent data accesses, newest first.</CardDescription>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Allowed">Allowed</TabsTrigger>
            <TabsTrigger value="Flagged">Flagged</TabsTrigger>
            <TabsTrigger value="Blocked">Blocked</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <ul
          aria-label="Access history"
          aria-live="off"
          className={cn("space-y-1.5 overflow-y-auto pr-1 font-mono text-[13px]", heightClass)}
          tabIndex={0}
        >
          {visible.length === 0 && (
            <li className="py-10 text-center font-sans text-sm text-muted-foreground">
              No log entries match your filters.
            </li>
          )}
          {visible.map((log) => {
            const style = resultStyles[log.result]
            const Icon = style.icon
            return (
              <li
                key={log.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-transparent px-3 py-2 transition-colors hover:border-border hover:bg-accent/50"
              >
                <span className="text-muted-foreground">[{log.time}]</span>
                <span className="font-semibold text-foreground">{log.app}</span>
                <span className="text-muted-foreground">
                  requested <span className="text-foreground/90">{log.resource}</span>
                </span>
                <span aria-hidden="true" className="text-muted-foreground">
                  {"->"}
                </span>
                <span
                  className={cn(
                    "ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-sans text-xs font-medium",
                    style.text,
                    style.bg,
                  )}
                >
                  <Icon className="size-3" aria-hidden="true" />
                  {log.result}
                </span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
