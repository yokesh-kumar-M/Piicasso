import * as React from "react"
import { cn } from "../../lib/utils"

const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-cyber-dark border border-cyber-cyan/30",
      className
    )}
    {...props}
  >
    <div
      className="h-full w-full flex-1 bg-cyber-cyan transition-all duration-500 ease-in-out"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] opacity-50 mix-blend-overlay animate-[scanline_2s_linear_infinite]" />
  </div>
))
Progress.displayName = "Progress"

export { Progress }
