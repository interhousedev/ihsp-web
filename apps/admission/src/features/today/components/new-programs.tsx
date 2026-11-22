"use client"

import { useT } from "@ihsp/i18n"
import { cn, Icons, Pill } from "@ihsp/ui"
import Link from "next/link"
import { useEffect, useRef } from "react"
import { useProgramsSeen, type NewPrograms as NewProgramsData } from "../api"

/** Programs published since the student last looked, matched to their fields; opening one (or the full list) marks them seen. */
export function NewPrograms({ programs, className }: { programs: NewProgramsData; className?: string }) {
  const t = useT("today")
  const seen = useProgramsSeen()
  const sent = useRef(false)
  const mark = () => {
    if (programs.unseen > 0 && !sent.current) {
      sent.current = true
      seen.mutate()
    }
  }
  useEffect(() => {
    sent.current = false
  }, [programs.unseen])
  if (programs.items.length === 0) return null
  return (
    <section
      aria-label={t("programs.title")}
      className={cn("bg-card rounded-card flex min-w-0 flex-col gap-2 border p-3.5", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <Icons.sparkles aria-hidden className="text-primary size-4" />
          {t("programs.title")}
        </h2>
        {programs.unseen > 0 ? <Pill tone="primary">{t("programs.new", { count: programs.unseen })}</Pill> : null}
      </div>
      <ul className="flex flex-col">
        {programs.items.map((p) => (
          <li key={p.id}>
            <Link
              href={p.href}
              onClick={mark}
              className="hover:bg-muted flex min-h-11 min-w-0 flex-col justify-center rounded-md px-2 py-1.5"
            >
              <span className="truncate text-sm font-medium">{p.title}</span>
              {p.provider ? <span className="text-muted-foreground truncate text-xs">{p.provider}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/opportunities/"
        onClick={mark}
        className="text-primary flex min-h-11 items-center text-sm font-medium"
      >
        {t("programs.all")}
      </Link>
    </section>
  )
}
