import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-all",
  {
    variants: {
      variant: {
        default: "border-white bg-white text-black",
        secondary: "border-white/30 bg-white/10 text-white",
        destructive: "border-white bg-white text-black",
        outline: "border-white/30 text-white bg-transparent",
        success: "border-white bg-white text-black",
        warning: "border-white bg-white text-black",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
