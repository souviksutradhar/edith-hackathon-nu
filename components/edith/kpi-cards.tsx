import { AppWindow, BellRing, Database, ShieldCheck, type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Kpi {
  label: string
  value: string
  suffix?: string
  hint: string
  icon: LucideIcon
  tone: "info" | "success" | "danger" | "neutral"
}

const toneClasses: Record<Kpi["tone"], string> = {
  info: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  danger: "bg-danger/15 text-danger",
  neutral: "bg-muted text-muted-foreground",
}

export function KpiCards({
  criticalAlerts,
  trustScore,
  totalApps = 3,
}: {
  criticalAlerts: number
  trustScore: number
  totalApps?: number
}) {
  const trustTone: Kpi["tone"] =
    trustScore < 40 ? "danger" : trustScore < 75 ? "info" : "success"

  const trustHint =
    trustScore < 40
      ? "Critical drop: Auto-containment triggered"
      : trustScore < 75
      ? "Warning: Suspicious intent mismatch detected"
      : "Baseline secure & validated"

  const kpis: Kpi[] = [
    {
      label: "Total Connected Apps",
      value: String(totalApps),
      hint: `${totalApps} apps actively audited`,
      icon: AppWindow,
      tone: "info",
    },
    {
      label: "Identity Trust Score",
      value: String(trustScore),
      suffix: "/100",
      hint: trustHint,
      icon: ShieldCheck,
      tone: trustTone,
    },
    {
      label: "Active Alerts",
      value: String(criticalAlerts),
      suffix: criticalAlerts > 0 ? "Critical" : "",
      hint: criticalAlerts > 0 ? "Immediate containment required" : "Zero open threats",
      icon: BellRing,
      tone: criticalAlerts > 0 ? "danger" : "neutral",
    },
    {
      label: "Data Requests Today",
      value: "1,240",
      hint: "Continuous background auditing",
      icon: Database,
      tone: "info",
    },
  ]

  return (
    <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map(({ label, value, suffix, hint, icon: Icon, tone }) => (
        <Card
          key={label}
          className="border border-border bg-card transition-colors hover:border-primary/40 hover:bg-accent/40"
        >
          <CardContent className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 flex items-baseline gap-1.5 text-3xl font-semibold tabular-nums">
                {value}
                {suffix && (
                  <span
                    className={cn(
                      "text-sm font-medium",
                      tone === "danger" ? "text-danger" : "text-muted-foreground",
                    )}
                  >
                    {suffix}
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </div>
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", toneClasses[tone])}>
              <Icon className="size-5" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
