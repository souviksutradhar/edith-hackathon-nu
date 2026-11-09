"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const initialSettings = [
  {
    id: "auto-suspend",
    label: "Auto-suspend on request spikes",
    description: "Temporarily suspend apps exceeding 10x their baseline request rate.",
    enabled: true,
  },
  {
    id: "critical-alerts",
    label: "Critical alert notifications",
    description: "Notify me immediately when an app's trust score falls below 50.",
    enabled: true,
  },
  {
    id: "weekly-digest",
    label: "Weekly permission digest",
    description: "Receive a summary of permissions granted and used each week.",
    enabled: false,
  },
]

export function SettingsView() {
  const [settings, setSettings] = useState(initialSettings)

  return (
    <Card className="border border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base">Settings</CardTitle>
        <CardDescription>Control how E.D.I.T.H. monitors and responds.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {settings.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div>
              <p id={`${s.id}-label`} className="text-sm font-medium">
                {s.label}
              </p>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={s.enabled}
              aria-labelledby={`${s.id}-label`}
              onClick={() =>
                setSettings((prev) =>
                  prev.map((p) => (p.id === s.id ? { ...p, enabled: !p.enabled } : p)),
                )
              }
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                s.enabled ? "bg-primary" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "absolute left-0.5 top-0.5 size-5 rounded-full bg-white transition-transform",
                  s.enabled && "translate-x-5",
                )}
              />
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
