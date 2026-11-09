"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Area, AreaChart, CartesianGrid, ReferenceDot, XAxis, YAxis } from "recharts"
import {
  AlertTriangle,
  ArrowLeft,
  BadgeAlert,
  CheckCircle2,
  FileText,
  OctagonX,
  ShieldAlert,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  forensicLog,
  permissionList,
  requestHistory,
  resumeBuilderProfile,
  trustBaseline,
  trustDeductions,
  type ConnectedApp,
  type LogResult,
  type PermissionId,
} from "@/lib/edith-data"
import { cn } from "@/lib/utils"

const chartConfig = {
  requests: { label: "API requests", color: "var(--color-danger)" },
} satisfies ChartConfig

const resultStyles: Record<LogResult, { className: string; icon: typeof CheckCircle2; label: string }> = {
  Blocked: { className: "border-danger/40 bg-danger/15 text-danger", icon: OctagonX, label: "BLOCKED" },
  Flagged: { className: "border-warning/40 bg-warning/15 text-warning", icon: AlertTriangle, label: "FLAGGED" },
  Allowed: { className: "border-success/40 bg-success/15 text-success", icon: CheckCircle2, label: "ALLOWED" },
}

function initialPermissions(app: ConnectedApp): Record<PermissionId, boolean> {
  return {
    Contacts: app.permissions.includes("Contacts"),
    "Drive Files": app.permissions.includes("Files") || app.permissions.includes("Drive Files"),
    Camera: false,
    Microphone: false,
  }
}

interface AppInvestigationProps {
  app: ConnectedApp
  onBack: () => void
}

export function AppInvestigation({ app, onBack }: AppInvestigationProps) {
  const [granted, setGranted] = useState(() => initialPermissions(app))
  const revoked = app.status === "revoked"

  const togglePermission = (id: PermissionId, next: boolean) => {
    setGranted((prev) => ({ ...prev, [id]: next }))
    if (next) {
      toast.warning(`${id} access granted to ${app.name}`)
    } else {
      toast.success(`${id} access revoked`, { description: `${app.name} can no longer use ${id}.` })
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-danger/15 text-danger ring-1 ring-danger/40">
              <FileText className="size-7" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-balance">{app.name}</h1>
              <p className="text-sm text-muted-foreground">App investigation &middot; v{resumeBuilderProfile.version}</p>
            </div>
          </div>

          <div
            role="status"
            className="inline-flex items-center gap-2 self-start rounded-lg border border-danger/50 bg-danger px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_32px_-8px] shadow-danger/70 sm:self-auto sm:text-base"
          >
            <ShieldAlert className="size-5" aria-hidden="true" />
            {revoked ? "Access Revoked - High Risk" : "Suspended - High Risk"}
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-6">
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Publisher &amp; Installation</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Publisher</dt>
                <dd className="flex flex-wrap items-center gap-2 font-medium">
                  {resumeBuilderProfile.publisher}
                  {!resumeBuilderProfile.publisherVerified && (
                    <Badge variant="outline" className="border-warning/40 text-warning">
                      <BadgeAlert className="size-3" aria-hidden="true" />
                      Unverified
                    </Badge>
                  )}
                </dd>
                <dt className="text-muted-foreground">Installed</dt>
                <dd className="font-medium">
                  {resumeBuilderProfile.installed}{" "}
                  <span className="font-normal text-muted-foreground">({resumeBuilderProfile.installedAgo})</span>
                </dd>
                <dt className="text-muted-foreground">Source</dt>
                <dd className="font-medium">{resumeBuilderProfile.source}</dd>
                <dt className="text-muted-foreground">Domain</dt>
                <dd className="font-mono text-xs font-medium sm:text-sm">{resumeBuilderProfile.domain}</dd>
              </dl>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Trust Score Breakdown</CardTitle>
              <CardDescription>How this app&apos;s score fell from {trustBaseline} to {app.trustScore}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-bold tabular-nums text-danger">{app.trustScore}</span>
                  <span className="text-lg text-muted-foreground">/ 100</span>
                  <span className="ml-auto rounded-full bg-danger/15 px-2 py-0.5 text-xs font-semibold uppercase text-danger">
                    At risk
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={app.trustScore}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Trust score ${app.trustScore} out of 100`}
                  className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted"
                >
                  <div className="h-full rounded-full bg-danger" style={{ width: `${app.trustScore}%` }} />
                </div>
              </div>

              <ul className="divide-y divide-border rounded-lg border border-border">
                <li className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <span className="text-muted-foreground">Baseline score</span>
                  <span className="font-semibold tabular-nums">{trustBaseline}</span>
                </li>
                {trustDeductions.map((d) => (
                  <li key={d.id} className="flex items-start justify-between gap-4 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{d.reason}</p>
                      <p className="text-xs text-muted-foreground">{d.detail}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-danger/15 px-2 py-0.5 text-sm font-semibold tabular-nums text-danger">
                      -{d.points} pts
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Permission Controls</CardTitle>
              <CardDescription>Revoke individual permissions without removing the app.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {permissionList.map((perm) => {
                  const on = granted[perm.id]
                  const labelId = `perm-${perm.id.replace(/\s/g, "-").toLowerCase()}`
                  return (
                    <li
                      key={perm.id}
                      className={cn(
                        "flex items-center justify-between gap-4 rounded-lg border px-3 py-3 transition-colors",
                        on ? "border-danger/50 bg-danger/10" : "border-border bg-background/40",
                      )}
                    >
                      <div className="min-w-0">
                        <p id={labelId} className={cn("text-sm font-medium", on && "text-danger")}>
                          {perm.id}
                        </p>
                        <p className="text-xs text-muted-foreground">{perm.description}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className={cn(
                            "text-xs font-semibold uppercase",
                            on ? "text-danger" : "text-muted-foreground",
                          )}
                        >
                          {on ? "On" : "Off"}
                        </span>
                        <Switch
                          checked={on}
                          onCheckedChange={(next) => togglePermission(perm.id, next)}
                          aria-labelledby={labelId}
                          className="data-[state=checked]:bg-danger"
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">API Requests over the last 24 hours</CardTitle>
              <CardDescription>
                Steady at about 4 requests/hr until a sudden jump to{" "}
                <span className="font-semibold text-danger">3,050/hr</span> in the final minutes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
                <AreaChart data={requestHistory} margin={{ top: 16, right: 16, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="requestsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-requests)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-requests)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} interval={3} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Area
                    dataKey="requests"
                    type="linear"
                    stroke="var(--color-requests)"
                    strokeWidth={2}
                    fill="url(#requestsFill)"
                    isAnimationActive={false}
                  />
                  <ReferenceDot
                    x="Now"
                    y={3050}
                    r={5}
                    fill="var(--color-danger)"
                    stroke="var(--color-background)"
                    strokeWidth={2}
                    ifOverflow="visible"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Forensic Activity Log</CardTitle>
              <CardDescription>Every request {app.name} made against your data, newest first.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Time</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead className="text-right">Instances</TableHead>
                    <TableHead className="text-right">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forensicLog.map((entry) => {
                    const style = resultStyles[entry.result]
                    const Icon = style.icon
                    return (
                      <TableRow
                        key={entry.id}
                        className={cn(
                          entry.result === "Blocked" && "bg-danger/5",
                          entry.result === "Flagged" && "bg-warning/5",
                        )}
                      >
                        <TableCell className="whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">
                          {entry.time}
                        </TableCell>
                        <TableCell className="font-medium">{entry.action}</TableCell>
                        <TableCell className="text-right tabular-nums">{entry.instances}</TableCell>
                        <TableCell className="text-right">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold tracking-wide",
                              style.className,
                            )}
                          >
                            <Icon className="size-3" aria-hidden="true" />
                            {style.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
