import { Icons } from "./icons"
import type { IconName } from "./layout/nav-types"
import { Badge } from "./ui/badge"

export type StatusTone = "success" | "warning" | "info" | "destructive" | "neutral"

export type StatusBadgeProps = {
  tone: StatusTone
  /** Already translated text. */
  label: string
  /** A name from the shared `Icons` registry, shown before the label. */
  icon?: IconName
  className?: string
}

/** A status chip on the semantic tokens (`--success`, `--warning`, `--info`, `--destructive`); use it instead of palette colours. */
export function StatusBadge({ tone, label, icon, className }: StatusBadgeProps) {
  const Icon = icon ? Icons[icon] : null
  return (
    <Badge variant={tone} data-tone={tone} className={className}>
      {Icon ? <Icon data-icon="inline-start" aria-hidden /> : null}
      {label}
    </Badge>
  )
}
