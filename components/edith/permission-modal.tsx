"use client"

import { useEffect, useState } from "react"
import { Camera, MapPin, Users, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ConnectedApp } from "@/lib/edith-data"
import { cn } from "@/lib/utils"

export type PermissionMode = "always" | "hour" | "deny"

export interface PermissionConfig {
  Camera: PermissionMode
  Location: PermissionMode
  Contacts: PermissionMode
}

const HOUR_SECONDS = 3600

const options: { value: PermissionMode; label: string; active: string }[] = [
  { value: "always", label: "Always Allow", active: "text-success" },
  { value: "hour", label: "Allow for 1 Hour", active: "text-warning" },
  { value: "deny", label: "Deny", active: "text-danger" },
]

const indicatorTone: Record<PermissionMode, string> = {
  always: "bg-success/15 ring-success/40",
  hour: "bg-warning/15 ring-warning/40",
  deny: "bg-danger/15 ring-danger/40",
}

const permissionMeta: { id: keyof PermissionConfig; description: string; icon: LucideIcon }[] = [
  { id: "Camera", description: "Capture photos and video", icon: Camera },
  { id: "Location", description: "Read your device location", icon: MapPin },
  { id: "Contacts", description: "Read names, emails and phone numbers", icon: Users },
]

function formatCountdown(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function SegmentedControl({
  label,
  value,
  onChange,
}: {
  label: string
  value: PermissionMode
  onChange: (next: PermissionMode) => void
}) {
  const index = options.findIndex((o) => o.value === value)
  return (
    <div
      role="radiogroup"
      aria-label={`${label} access`}
      className="relative grid grid-cols-3 rounded-full border border-border bg-background/60 p-1"
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full ring-1 transition-all duration-200 ease-out",
          indicatorTone[value],
        )}
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 rounded-full px-1 py-1.5 text-[11px] leading-tight font-medium text-balance transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:text-xs",
              selected ? option.active : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function PermissionForm({
  app,
  onCancel,
  onSave,
}: {
  app: ConnectedApp
  onCancel: () => void
  onSave: (config: PermissionConfig) => void
}) {
  const [modes, setModes] = useState<PermissionConfig>({
    Camera: "always",
    Location: "hour",
    Contacts: "deny",
  })
  const [expiresAt, setExpiresAt] = useState<Partial<Record<keyof PermissionConfig, number>>>(() => ({
    Location: Date.now() + (42 * 60 + 15) * 1000,
  }))
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const remaining = (id: keyof PermissionConfig) => {
    const at = expiresAt[id]
    return at ? Math.max(0, Math.ceil((at - now) / 1000)) : 0
  }

  const effectiveMode = (id: keyof PermissionConfig): PermissionMode =>
    modes[id] === "hour" && remaining(id) <= 0 ? "deny" : modes[id]

  const change = (id: keyof PermissionConfig, next: PermissionMode) => {
    setModes((prev) => ({ ...prev, [id]: next }))
    if (next === "hour" && modes[id] !== "hour") {
      setExpiresAt((prev) => ({ ...prev, [id]: Date.now() + HOUR_SECONDS * 1000 }))
      setNow(Date.now())
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Application Permissions</DialogTitle>
        <DialogDescription>
          Choose how long <span className="font-medium text-foreground">{app.name}</span> can use each
          permission. Temporary access expires automatically.
        </DialogDescription>
      </DialogHeader>

      <ul className="flex flex-col gap-4">
        {permissionMeta.map(({ id, description, icon: Icon }) => {
          const mode = effectiveMode(id)
          const secondsLeft = remaining(id)
          return (
            <li key={id} className="rounded-xl border border-border bg-background/40 p-3.5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/80">
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{id}</p>
                    <p className="truncate text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
                {mode === "hour" && (
                  <span
                    role="timer"
                    aria-label={`${id} access expires in ${formatCountdown(secondsLeft)}`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-semibold text-orange-400 tabular-nums ring-1 ring-orange-500/40"
                  >
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-orange-400/70" />
                      <span className="relative inline-flex size-2 rounded-full bg-orange-400" />
                    </span>
                    Expires in {formatCountdown(secondsLeft)}
                  </span>
                )}
              </div>
              <SegmentedControl label={id} value={mode} onChange={(next) => change(id, next)} />
            </li>
          )
        })}
      </ul>

      <DialogFooter>
        <Button variant="outline" size="lg" onClick={onCancel} className="h-10 sm:px-5">
          Cancel
        </Button>
        <Button
          size="lg"
          onClick={() =>
            onSave({
              Camera: effectiveMode("Camera"),
              Location: effectiveMode("Location"),
              Contacts: effectiveMode("Contacts"),
            })
          }
          className="h-10 bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/85"
        >
          Save Configuration
        </Button>
      </DialogFooter>
    </>
  )
}

interface PermissionModalProps {
  app: ConnectedApp | null
  onClose: () => void
  onSave: (app: ConnectedApp, config: PermissionConfig) => void
}

export function PermissionModal({ app, onClose, onSave }: PermissionModalProps) {
  return (
    <Dialog open={app !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {app && <PermissionForm app={app} onCancel={onClose} onSave={(config) => onSave(app, config)} />}
      </DialogContent>
    </Dialog>
  )
}
