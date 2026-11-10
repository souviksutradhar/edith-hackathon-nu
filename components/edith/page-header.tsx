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
    <div className="space-y-4 pb-4 border-b border-[#E6E1FA]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[32px] sm:text-[36px] font-extrabold tracking-[-0.02em] text-[#15122B] leading-tight">
              {title}
            </h1>
            {subtitle && (
              <span className="text-xs font-semibold text-[#5B35F5] bg-[#ECE8FF] px-3 py-1 rounded-full">
                {subtitle}
              </span>
            )}
          </div>
          <p className="text-[15px] text-[#5E5A7A] mt-1 leading-relaxed">{description}</p>
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>

      {/* Collapsible Demo Guide Card */}
      <div className="rounded-[20px] border border-[#E6E1FA] bg-white overflow-hidden text-sm shadow-none">
        <button
          type="button"
          onClick={() => setGuideOpen(!guideOpen)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-[#F9F8FF] hover:bg-[#ECE8FF]/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5 text-sm font-bold text-[#15122B]">
            <HelpCircle className="size-4 text-[#5B35F5]" />
            <span>Demo guide: What to click</span>
          </div>
          {guideOpen ? (
            <ChevronUp className="size-4 text-[#5E5A7A]" />
          ) : (
            <ChevronDown className="size-4 text-[#5E5A7A]" />
          )}
        </button>

        {guideOpen && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#EEEAFB] bg-white">
            {demoSteps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#ECE8FF] text-xs font-bold text-[#5B35F5]">
                  {idx + 1}
                </span>
                <span className="text-sm text-[#5E5A7A] leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
