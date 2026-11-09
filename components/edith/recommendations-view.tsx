"use client"

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  MapPin,
  MicOff,
  Network,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { recommendations, type RecommendationPriority } from "@/lib/edith-data"
import { cn } from "@/lib/utils"

const priorityStyles: Record<
  RecommendationPriority,
  { label: string; badge: string; icon: string; bar: string; Icon: LucideIcon }
> = {
  high: {
    label: "High Priority",
    badge: "bg-danger/15 text-danger",
    icon: "bg-danger/15 text-danger",
    bar: "bg-danger",
    Icon: AlertTriangle,
  },
  medium: {
    label: "Medium Priority",
    badge: "bg-warning/15 text-warning",
    icon: "bg-warning/15 text-warning",
    bar: "bg-warning",
    Icon: Network,
  },
  info: {
    label: "Info",
    badge: "bg-info/15 text-info",
    icon: "bg-info/15 text-info",
    bar: "bg-info",
    Icon: Info,
  },
}

const cardIcons: Record<string, LucideIcon> = {
  "unused-microphone": MicOff,
  "over-privileged": Network,
  "background-location": MapPin,
}

interface RecommendationsViewProps {
  dismissed: string[]
  onApply: (id: string) => void
  onApplyAll: () => void
}

export function RecommendationsView({ dismissed, onApply, onApplyAll }: RecommendationsViewProps) {
  const items = recommendations.filter((r) => !dismissed.includes(r.id))
  const pendingFixes = items.filter((r) => r.fixable)
  const allFixed = pendingFixes.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-balance text-2xl font-semibold tracking-tight">Automated Security Audit</h2>
        <p className="text-sm text-muted-foreground">E.D.I.T.H. has analyzed your connected applications.</p>
      </div>

      <section
        aria-label="One-click secure"
        className={cn(
          "relative overflow-hidden rounded-xl border p-6 md:p-8",
          allFixed ? "border-success/30 bg-success/10" : "border-primary/30 bg-primary/10",
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -right-16 -top-16 size-56 rounded-full blur-3xl",
            allFixed ? "bg-success/20" : "bg-primary/25",
          )}
        />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-xl",
                allFixed ? "bg-success/20 text-success" : "bg-primary/20 text-primary",
              )}
            >
              {allFixed ? (
                <CheckCircle2 className="size-6" aria-hidden="true" />
              ) : (
                <ShieldCheck className="size-6" aria-hidden="true" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {allFixed ? "Your applications are secured" : "One-Click Secure"}
              </h3>
              <p className="mt-1 max-w-xl text-pretty text-sm text-muted-foreground">
                {allFixed
                  ? "All recommended fixes have been applied. E.D.I.T.H. will keep monitoring for new risks."
                  : `${pendingFixes.length} recommended fix${pendingFixes.length === 1 ? "" : "es"} ready. E.D.I.T.H. will tighten permissions without disrupting how your apps work.`}
              </p>
            </div>
          </div>
          <Button size="lg" onClick={onApplyAll} disabled={allFixed} className="shrink-0">
            {allFixed ? "All Fixes Applied" : "Apply All Recommended Fixes"}
          </Button>
        </div>
      </section>

      {items.length === 0 ? (
        <Card className="border border-border bg-card">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No open recommendations. Nice work.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {items.map((rec) => {
            const style = priorityStyles[rec.priority]
            const Icon = cardIcons[rec.id] ?? style.Icon
            return (
              <li key={rec.id}>
                <Card className="relative overflow-hidden border border-border bg-card py-0">
                  <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", style.bar)} />
                  <CardContent className="flex flex-col gap-4 p-5 pl-6 md:flex-row md:items-center">
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-lg",
                        style.icon,
                      )}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            style.badge,
                          )}
                        >
                          {style.label}
                        </span>
                        <h3 className="text-base font-semibold">{rec.title}</h3>
                      </div>
                      <p className="mt-1.5 text-pretty text-sm text-foreground/90">{rec.detail}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{rec.evidence}</p>
                    </div>
                    <Button
                      variant={rec.priority === "info" ? "outline" : "default"}
                      onClick={() => onApply(rec.id)}
                      className="shrink-0"
                    >
                      {rec.actionLabel}
                    </Button>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
