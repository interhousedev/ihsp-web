import type { ReactNode } from "react"
import { cn } from "../lib/utils"
import { Card, CardContent } from "./ui/card"

/** A number with a caption: GPA, absences, counts on dashboards. */
export function Stat({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string
  value: ReactNode
  /** Small line under the value (for example "+0.12 since last semester"). */
  hint?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <Card className={cn("py-4", className)}>
      <CardContent className="flex items-start justify-between gap-3 px-4">
        <div className="min-w-0">
          <p className="text-muted-foreground truncate text-xs font-medium">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
        </div>
        {icon ? <div className="text-muted-foreground shrink-0">{icon}</div> : null}
      </CardContent>
    </Card>
  )
}
