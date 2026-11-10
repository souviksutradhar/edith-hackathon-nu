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
  RotateCcw,
  Settings,
  ShieldCheck,
  Smartphone,
  Terminal,
  Info,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSimulation } from "@/lib/simulation-context"

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
  | "about"

const navItems: { id: ViewId; label: string; icon: LucideIcon }[] = [
  { id: "radar-triage", label: "Live Attack Demo", icon: Flame },
  { id: "black-box", label: "Incident Black Box", icon: Terminal },
  { id: "consent-ledger", label: "Consent Ledger", icon: FileCheck2 },
  { id: "privacy-doppelganger", label: "Privacy Doppelganger", icon: Ghost },
  { id: "logs", label: "Activity Logs", icon: Activity },
  { id: "about", label: "About E.D.I.T.H.", icon: Info },
  { id: "settings", label: "Settings", icon: Settings },
]

interface SidebarProps {
  active: ViewId
  onNavigate: (view: ViewId) => void
  recommendationCount: number
}

export function Sidebar({ active, onNavigate, recommendationCount }: SidebarProps) {
  const { resetAllDemoData } = useSimulation()

  return (
    <div className="flex h-full flex-col bg-white border-r border-[#E6E1FA]">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-[#E6E1FA] px-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-[#ECE8FF] text-[#5B35F5]">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </div>
        <div className="leading-tight">
          <p className="text-base font-extrabold tracking-wider text-[#15122B]">E.D.I.T.H.</p>
          <p className="text-[11px] font-medium text-[#5E5A7A]">
            Zero-Trust Mobile Defense
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Primary" className="flex-1 space-y-1.5 p-3">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left text-sm font-semibold transition-all cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B35F5]",
                isActive
                  ? "bg-[#ECE8FF] text-[#5B35F5]"
                  : "text-[#5E5A7A] hover:bg-[#F9F8FF] hover:text-[#5B35F5]"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate">{label}</span>
              {id === "recommendations" && recommendationCount > 0 && (
                <span className="rounded-full bg-[#FDE8E6] px-2 py-0.5 text-[10px] font-bold text-[#B42318]">
                  {recommendationCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer with Reset All Demo Data button */}
      <div className="p-4 border-t border-[#E6E1FA] space-y-3">
        <button
          type="button"
          onClick={resetAllDemoData}
          className="w-full flex items-center justify-center gap-2 rounded-full border border-[#E6E1FA] bg-white hover:bg-[#ECE8FF] py-2 px-4 text-xs font-semibold text-[#5B35F5] transition-all cursor-pointer shadow-xs"
        >
          <RotateCcw className="size-3.5" />
          <span>Reset all demo data</span>
        </button>

        <div className="rounded-[16px] border border-[#E6E1FA] bg-[#F9F8FF] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#15122B]">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#1E9E6A] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[#1E9E6A]" />
            </span>
            E.D.I.T.H. Defense Active
          </div>
          <p className="mt-1 text-[11px] text-[#5E5A7A] leading-relaxed">
            Autonomous zero-trust protection &amp; instant 1930 complaint kit generator.
          </p>
        </div>
      </div>
    </div>
  )
}
