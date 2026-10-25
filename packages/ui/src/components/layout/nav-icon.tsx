import { Icons } from "../icons"
import type { NavIcon } from "./nav-types"

/** Renders a nav icon given by registry name or component. */
export function NavIconView({ icon, className }: { icon: NavIcon | undefined; className?: string }) {
  if (!icon) return null
  const Component = typeof icon === "string" ? Icons[icon] : icon
  return <Component className={className} aria-hidden />
}
