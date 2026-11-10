import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-[12px] border border-[#E6E1FA] bg-white px-3.5 py-2 text-sm text-[#15122B] placeholder:text-[#5E5A7A]/60 transition-all outline-none focus:border-[#5B35F5] focus:ring-2 focus:ring-[#ECE8FF] disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
