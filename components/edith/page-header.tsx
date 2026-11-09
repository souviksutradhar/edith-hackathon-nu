"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  subtitle?: string
  description: string
  demoSteps: [string, string, string]
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  subtitle,
  description,
  demoSteps,
  actions,
}: PageHeaderProps) {
  const [guideOpen, setGuideOpen] = useState(true)

  return (
    <div className="space-y-3 pb-2 border-b border-zinc-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">{title}</h1>
            {subtitle && (
              <span className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                {subtitle}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400 mt-1">{description}</p>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Collapsible Demo Guide Card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => setGuideOpen(!guideOpen)}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-zinc-900/50 hover:bg-zinc-900 transition-colors text-left"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <HelpCircle className="size-3.5 text-cyan-400" />
            <span>Demo guide: What to click</span>
          </div>
          {guideOpen ? (
            <ChevronUp className="size-4 text-zinc-400" />
          ) : (
            <ChevronDown className="size-4 text-zinc-400" />
          )}
        </button>

        {guideOpen && (
          <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-zinc-800/80 bg-zinc-950/40">
            {demoSteps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-950/80 border border-cyan-700/60 text-[11px] font-bold text-cyan-300 font-mono">
                  {idx + 1}
                </span>
                <span className="text-xs text-zinc-300 leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

