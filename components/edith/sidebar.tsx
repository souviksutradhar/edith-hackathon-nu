"use client"

import {
  Activity,
  AppWindow,
  FileCheck2,
  Flame,
  Ghost,
  LayoutDashboard,
  Lightbulb,
  PhoneCall,
  Radar,
  Settings,
  ShieldCheck,
  Smartphone,
  Terminal,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type ViewId =
  | "radar-triage"
  | "black-box"
  | "consent-ledger"
  | "privacy-doppelganger"
  | "dashboard"
  | "radar"
  | "caller-radar"
  | "consent-receipts"
  | "doppelganger"
  | "mobile-shield"
  | "apps"
  | "logs"
  | "recommendations"
  | "settings"

const navItems: { id: ViewId; label: string; icon: LucideIcon }[] = [
  { id: "radar-triage", label: "Radar & Triage", icon: Flame },
  { id: "black-box", label: "Incident Black Box", icon: Terminal },
  { id: "consent-ledger", label: "Consent Ledger", icon: FileCheck2 },
  { id: "privacy-doppelganger", label: "Privacy Doppelganger", icon: Ghost },
  { id: "logs", label: "Activity Logs", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
]

interface SidebarProps {
  active: ViewId
  onNavigate: (view: ViewId) => void
  recommendationCount: number
}

export function Sidebar({ active, onNavigate, recommendationCount }: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </div>
        <div className="leading-tight">
          <p className="text-base font-semibold tracking-widest">E.D.I.T.H.</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Zero-Trust Defense
          </p>
        </div>
      </div>

      <nav aria-label="Primary" className="flex-1 space-y-1 p-3">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-primary/15 text-primary ring-1 ring-primary/25"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate">{label}</span>
              {id === "recommendations" && recommendationCount > 0 && (
                <span className="rounded-full bg-danger/20 px-1.5 py-0.5 text-[10px] font-semibold text-danger">
                  {recommendationCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="m-3 rounded-lg border border-sidebar-border bg-background/40 p-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          Radar Heuristic Engine Active
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Autonomous mobile scam kill-chain monitoring &amp; 1930 dossier filing.
        </p>
      </div>
    </div>
  )
}
