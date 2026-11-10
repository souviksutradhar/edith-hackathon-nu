import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full min-w-0 rounded-[12px] border border-[#E6E1FA] bg-white p-3 text-sm text-[#15122B] placeholder:text-[#5E5A7A]/60 transition-all outline-none focus:border-[#5B35F5] focus:ring-2 focus:ring-[#ECE8FF] disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
