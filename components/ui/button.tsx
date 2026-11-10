import * as React from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full text-sm font-semibold whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 active:translate-y-0 focus-visible:ring-3 focus-visible:ring-[#ECE8FF] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          'bg-[#5B35F5] text-white shadow-[0_4px_14px_rgba(91,53,245,0.18)] hover:bg-[#4A27D9] hover:-translate-y-px',
        secondary:
          'bg-white border border-[#E6E1FA] text-[#5B35F5] hover:bg-[#ECE8FF]',
        outline:
          'bg-white border border-[#E6E1FA] text-[#15122B] hover:bg-[#ECE8FF] hover:text-[#5B35F5]',
        destructive:
          'bg-white border border-[#D64545] text-[#D64545] hover:bg-[#FDE8E6]',
        ghost:
          'text-[#5E5A7A] hover:bg-[#ECE8FF] hover:text-[#5B35F5]',
        link: 'text-[#5B35F5] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-[44px] px-5 gap-2 text-sm',
        sm: 'h-[36px] px-3.5 gap-1.5 text-xs',
        xs: 'h-[28px] px-2.5 gap-1 text-xs',
        lg: 'h-[48px] px-6 gap-2 text-base',
        icon: 'size-10 rounded-full',
        'icon-sm': 'size-8 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
