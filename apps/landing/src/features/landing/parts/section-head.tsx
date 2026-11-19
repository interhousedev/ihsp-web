import type { ReactNode } from "react"
import { Reveal } from "../reveal"

/** The eyebrow and the heading every middle section opens with; `id` is the heading id the section labels itself by. */
export function SectionHead({
  id,
  eyebrow,
  title,
  align = "center",
  children,
}: {
  id: string
  eyebrow: string
  title: string
  align?: "center" | "start"
  children?: ReactNode
}) {
  return (
    <Reveal className={align === "center" ? "lnd-head lnd-head-center" : "lnd-head"}>
      <p className="lnd-eyebrow">{eyebrow}</p>
      <h2 id={id} className="lnd-h2">
        {title}
      </h2>
      {children}
    </Reveal>
  )
}
