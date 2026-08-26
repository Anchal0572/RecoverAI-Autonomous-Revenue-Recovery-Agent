import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'secondary'
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  
  const variants = {
    default: "bg-primary/20 text-primary border-primary/30",
    success: "bg-success-bg text-success border-success/30",
    warning: "bg-warning-bg text-warning border-warning/30",
    danger: "bg-danger-bg text-danger border-danger/30",
    outline: "text-foreground",
    secondary: "bg-surfaceHover text-gray-300 border-border"
  }
  
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
