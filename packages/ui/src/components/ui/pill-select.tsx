import * as React from "react"

import { cn } from "../../lib/utils"
import { IconChevronDown } from "../icons"

type PillSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  /** Required: header selectors have no visible label. */
  "aria-label": string
  icon?: React.ComponentType<{ size?: number; stroke?: number; className?: string; "aria-hidden"?: boolean }>
}

/** Native select styled as a background pill, for header selectors (semester, week, language, theme). */
function PillSelect({ className, icon: Icon, children, ...props }: PillSelectProps) {
  return (
    <div
      data-slot="pill-select"
      className={cn(
        "relative inline-flex h-8 items-center rounded-full bg-muted text-sm text-foreground transition-colors focus-within:ring-3 focus-within:ring-ring/50 hover:bg-muted/70 has-[select:disabled]:opacity-50",
        className,
      )}
    >
      {Icon ? (
        <Icon
          size={16}
          stroke={1.75}
          className="pointer-events-none absolute left-2.5 text-muted-foreground"
          aria-hidden
        />
      ) : null}
      <select
        data-slot="pill-select-control"
        className={cn(
          "h-full min-w-0 cursor-pointer appearance-none rounded-full bg-transparent pr-8 outline-none",
          Icon ? "pl-8" : "pl-3",
        )}
        {...props}
      >
        {children}
      </select>
      <IconChevronDown
        size={16}
        stroke={1.75}
        className="pointer-events-none absolute right-2.5 text-muted-foreground"
        aria-hidden
      />
    </div>
  )
}

export { PillSelect }
export type { PillSelectProps }
