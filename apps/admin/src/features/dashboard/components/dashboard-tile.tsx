import { Stat } from "@ihsp/ui"
import Link from "next/link"
import type { ReactNode } from "react"

/** A number that opens the list behind it (UF-ADM-01 step 3). */
export function DashboardTile({
  href,
  label,
  value,
  hint,
  icon,
}: {
  href: string
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
}) {
  return (
    <Link href={href} className="focus-visible:ring-ring block min-h-11 rounded-xl outline-none focus-visible:ring-3">
      <Stat
        label={label}
        value={value}
        hint={hint}
        icon={icon}
        className="hover:bg-muted/50 h-full transition-colors"
      />
    </Link>
  )
}
