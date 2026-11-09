"use client"

import { useMemo, useState } from "react"
import { TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ConnectedApp } from "@/lib/edith-data"
import { cn } from "@/lib/utils"

type Filter = "all" | "attention" | "healthy"

function scoreTone(score: number) {
  if (score >= 70) return { bar: "bg-success", text: "text-success", label: "Healthy" }
  if (score >= 50) return { bar: "bg-warning", text: "text-warning", label: "Moderate" }
  return { bar: "bg-danger", text: "text-danger", label: "At risk" }
}

function TrustBar({ score }: { score: number }) {
  const tone = scoreTone(score)
  return (
    <div className="flex min-w-36 items-center gap-3">
      <div
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Trust score ${score} out of 100, ${tone.label}`}
        className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div className={cn("h-full rounded-full transition-all", tone.bar)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("w-7 text-right text-sm font-semibold tabular-nums", tone.text)}>{score}</span>
    </div>
  )
}

interface AppsTableProps {
  apps: ConnectedApp[]
  query: string
  onManage: (app: ConnectedApp) => void
  onModify?: (app: ConnectedApp) => void
  title?: string
}

export function AppsTable({
  apps,
  query,
  onManage,
  onModify,
  title = "Connected Applications Monitoring",
}: AppsTableProps) {
  const [filter, setFilter] = useState<Filter>("all")

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return apps.filter((app) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "attention" ? app.trustScore < 70 : app.trustScore >= 70)
      const matchesQuery =
        !q ||
        app.name.toLowerCase().includes(q) ||
        app.permissions.some((p) => p.toLowerCase().includes(q))
      return matchesFilter && matchesQuery
    })
  }, [apps, filter, query])

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>Permissions, request volume and behavioral trust per app.</CardDescription>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="attention">Needs attention</TabsTrigger>
            <TabsTrigger value="healthy">Healthy</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>App Name</TableHead>
              <TableHead>Permissions Granted</TableHead>
              <TableHead>API Requests/Hr</TableHead>
              <TableHead>Trust Score</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No applications match your filters.
                </TableCell>
              </TableRow>
            )}
            {visible.map((app) => (
              <TableRow
                key={app.id}
                className={cn(
                  "transition-colors hover:bg-accent/50",
                  app.trustScore < 50 && "bg-danger/5 hover:bg-danger/10",
                )}
              >
                <TableCell>
                  <div className="flex items-center gap-2 font-medium">
                    {app.name}
                    {app.status === "suspended" && (
                      <Badge variant="outline" className="border-warning/40 text-warning">
                        Suspended
                      </Badge>
                    )}
                    {app.status === "revoked" && (
                      <Badge variant="outline" className="border-danger/40 text-danger">
                        Revoked
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {app.permissions.length === 0 ? (
                      <span className="text-xs text-muted-foreground">None</span>
                    ) : (
                      app.permissions.map((perm) => (
                        <Badge
                          key={perm}
                          variant="secondary"
                          className="border border-border bg-muted/60 font-normal text-foreground/80"
                        >
                          {perm}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 tabular-nums",
                      app.spike && "font-semibold text-danger",
                    )}
                  >
                    {app.requestsPerHour.toLocaleString("en-US")}/hr
                    {app.spike && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-danger/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                        <TrendingUp className="size-3" aria-hidden="true" />
                        Spike
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <TrustBar score={app.trustScore} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {onModify && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onModify(app)}
                        disabled={app.status === "revoked"}
                      >
                        Modify Access
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => onManage(app)}>
                      Manage
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
