import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[#ECE8FF] [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-[#ECE8FF] text-[#5B35F5] border-[#5B35F5]/20",
        secondary: "bg-[#F9F8FF] text-[#5E5A7A] border-[#E6E1FA]",
        destructive: "bg-[#FDE8E6] text-[#B42318] border-[#D64545]/20 font-bold",
        outline: "bg-white text-[#15122B] border-[#E6E1FA]",
        ghost: "hover:bg-[#ECE8FF] hover:text-[#5B35F5]",
        link: "text-[#5B35F5] underline-offset-4 hover:underline",
        success: "bg-[#E3F6EE] text-[#12704A] border-[#1E9E6A]/20 font-semibold",
        warning: "bg-[#FFF1D6] text-[#8A5A00] border-[#D99A1E]/20 font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
