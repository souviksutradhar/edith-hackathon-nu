"use client";

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Download, Loader2, Lock, ShieldAlert, ShieldCheck, ShieldOff, Sparkles, TrendingUp, Undo2 } from "lucide-react"
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
  apps?: ConnectedApp[]
  query?: string
  onManage?: (app: ConnectedApp) => void
  onModify?: (app: ConnectedApp) => void
  onQuarantine?: (app: ConnectedApp) => void
  onRestore?: (app: ConnectedApp) => void
  onSimulateAttack?: (appId?: string | number) => void
  onTriggerHack?: () => void
  isSimulating?: boolean
  title?: string
}

export function AppsTable({
  apps: propApps,
  query = "",
  onManage = () => {},
  onModify,
  onQuarantine,
  onRestore,
  onSimulateAttack,
  onTriggerHack,
  isSimulating = false,
  title = "Connected Applications & Permissions Audit",
}: AppsTableProps = {}) {
  const [apps, setApps] = useState<ConnectedApp[]>([])
  const [filter, setFilter] = useState<Filter>("all")
  const [selectedAppId, setSelectedAppId] = useState<string | number>(3)
  const [internalLoading, setInternalLoading] = useState(false)

  // Fetch initial data if not passed by parent
  useEffect(() => {
    fetch("http://localhost:5000/api/apps")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setApps(data)
      })
      .catch((err) => console.error("Error fetching apps:", err))
  }, [])

  // Sync if propApps changes
  useEffect(() => {
    if (propApps && Array.isArray(propApps)) {
      setApps(propApps)
    }
  }, [propApps])

  const effectiveApps = apps.length > 0 ? apps : (propApps || [])

  // Trigger attack simulation
  const handleTriggerAttack = async () => {
    if (onSimulateAttack) {
      onSimulateAttack(selectedAppId)
      return
    }
    if (onTriggerHack) {
      onTriggerHack()
      return
    }

    try {
      setInternalLoading(true)
      const response = await fetch("http://localhost:5000/api/simulate-attack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: selectedAppId }),
      })
      const result = await response.json()
      if (result.updated_apps) {
        setApps(result.updated_apps)
      }
    } catch (error) {
      console.error("Error triggering attack:", error)
    } finally {
      setInternalLoading(false)
    }
  }

  // Quarantine action
  const handleQuarantine = async (app: ConnectedApp) => {
    if (onQuarantine) {
      onQuarantine(app)
      return
    }
    try {
      const res = await fetch(`http://localhost:5000/api/apps/${app.id}/quarantine`, {
        method: "POST",
      })
      const data = await res.json()
      if (data.updated_apps) setApps(data.updated_apps)
    } catch (err) {
      console.error("Failed to quarantine app:", err)
    }
  }

  // Restore action
  const handleRestore = async (app: ConnectedApp) => {
    if (onRestore) {
      onRestore(app)
      return
    }
    try {
      const res = await fetch(`http://localhost:5000/api/apps/${app.id}/restore`, {
        method: "POST",
      })
      const data = await res.json()
      if (data.updated_apps) setApps(data.updated_apps)
    } catch (err) {
      console.error("Failed to restore app:", err)
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return effectiveApps.filter((app) => {
      const score = app.trustScore ?? 100
      const matchesFilter =
        filter === "all" ||
        (filter === "attention" ? score < 70 : score >= 70)
      const matchesQuery =
        !q ||
        app.name?.toLowerCase().includes(q) ||
        app.declaredPurpose?.toLowerCase().includes(q) ||
        (app.permissions && app.permissions.some((p) => p.toLowerCase().includes(q)))
      return matchesFilter && matchesQuery
    })
  }, [effectiveApps, filter, query])

  const isBusy = isSimulating || internalLoading

  return (
    <Card className="border border-border bg-card shadow-lg">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>
            Intent-Based Heuristic Evaluation: Declared Purpose vs Actual Permissions Granted &amp; Sideload Origins.
          </CardDescription>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All ({effectiveApps.length})</TabsTrigger>
            <TabsTrigger value="attention">Needs Attention</TabsTrigger>
            <TabsTrigger value="healthy">Healthy Baseline</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {/* Apps Table */}
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Application &amp; Source</TableHead>
              <TableHead>Declared Purpose</TableHead>
              <TableHead>Expected vs Granted Permissions</TableHead>
              <TableHead>Trust Score</TableHead>
              <TableHead className="text-right">
                <span>Zero-Trust Action</span>
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
            {visible.map((app) => {
              const isFrozen = app.status === "Frozen" || app.status?.toLowerCase() === "frozen"
              const isWarning = app.status === "Warning" || (app.trustScore < 70 && !isFrozen)
              const isSideloaded = app.installSource?.toLowerCase().includes("sideload")

              // Detect Intent Mismatch: Granted permissions not in Expected permissions
              const expectedSet = new Set(app.expectedPermissions || [])
              const actualPermissions = app.grantedPermissions || app.permissions || []

              return (
                <TableRow
                  key={app.id}
                  className={cn(
                    "transition-colors hover:bg-accent/50",
                    isFrozen && "bg-danger/10 hover:bg-danger/15",
                    isWarning && "bg-warning/10 hover:bg-warning/15",
                  )}
                >
                  {/* Application & Source */}
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        <span>{app.name}</span>
                        {isFrozen && (
                          <Badge className="border-danger text-danger bg-danger/15 font-mono text-[10px] uppercase font-bold">
                            <Lock className="size-2.5 mr-1" />
                            Frozen
                          </Badge>
                        )}
                        {isWarning && (
                          <Badge className="border-warning text-warning bg-warning/15 font-mono text-[10px] uppercase font-bold">
                            Warning
                          </Badge>
                        )}
                        {app.status === "Active" && (
                          <Badge className="border-success/40 text-success bg-success/10 font-mono text-[10px] uppercase">
                            Active
                          </Badge>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-xs">
                        {isSideloaded ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-danger">
                            <ShieldAlert className="size-3" />
                            {app.installSource || "WhatsApp Sideload"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <ShieldCheck className="size-3 text-success" />
                            {app.installSource || "Play Store"}
                          </span>
                        )}
                        {app.packageName && (
                          <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
                            &middot; {app.packageName}
                          </span>
                        )}
                      </div>

                      {app.alert && (
                        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-danger font-medium line-clamp-1">
                          <AlertTriangle className="size-3 shrink-0" />
                          {app.alert}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Declared Purpose */}
                  <TableCell>
                    <span className="text-xs font-medium text-foreground/90">
                      {app.declaredPurpose || "Standard Mobile Utility"}
                    </span>
                  </TableCell>

                  {/* Expected vs Granted (Intent Mismatch Inspection) */}
                  <TableCell>
                    <div className="space-y-1.5 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {actualPermissions.length === 0 ? (
                          <span className="text-xs text-danger font-mono font-medium">All Permissions Revoked</span>
                        ) : (
                          actualPermissions.map((perm) => {
                            const isMismatch = !expectedSet.has(perm) && isSideloaded
                            return (
                              <Badge
                                key={perm}
                                variant={isMismatch ? "destructive" : "secondary"}
                                className={cn(
                                  "text-[11px] font-normal",
                                  isMismatch
                                    ? "bg-danger text-white font-semibold ring-1 ring-danger animate-pulse"
                                    : "border border-border bg-muted/60 text-foreground/80"
                                )}
                              >
                                {isMismatch ? `⚠ Mismatch: ${perm}` : perm}
                              </Badge>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Trust Score */}
                  <TableCell>
                    <TrustBar score={app.trustScore ?? 0} />
                  </TableCell>

                  {/* Zero-Trust Action Buttons */}
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      {isFrozen ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(app)}
                          className="border-success/40 text-success hover:bg-success/15 font-semibold text-xs"
                        >
                          <Undo2 className="size-3.5 mr-1" />
                          Restore
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuarantine(app)}
                          className="border-danger/40 text-danger hover:bg-danger/15 font-semibold text-xs"
                        >
                          <ShieldOff className="size-3.5 mr-1" />
                          Revoke / Freeze
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => onManage(app)} className="text-xs">
                        Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
