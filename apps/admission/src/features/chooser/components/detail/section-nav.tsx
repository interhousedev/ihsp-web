"use client"

import { useT } from "@ihsp/i18n"
import { useEffect, useState } from "react"
import { sectionId } from "./section-id"

/** In-page section links: sticky chips scrolling sideways on phones, a sticky left rail from 1024px. */
export function SectionNav({ sections }: { sections: readonly string[] }) {
  const t = useT("chooserDetails")
  const [active, setActive] = useState(sections[0] ?? "")

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((entry) => entry.isIntersecting)
        if (hit) setActive(hit.target.id.replace("section-", ""))
      },
      { rootMargin: "-20% 0px -70% 0px" },
    )
    for (const name of sections) {
      const node = document.getElementById(sectionId(name))
      if (node) observer.observe(node)
    }
    return () => observer.disconnect()
  }, [sections])

  return (
    <nav
      aria-label={t("nav")}
      className="bg-background sticky top-0 z-10 -mx-4 overflow-x-auto px-4 py-2 lg:top-4 lg:mx-0 lg:self-start lg:px-0 lg:py-0"
    >
      <ul className="flex gap-2 lg:flex-col lg:gap-1">
        {sections.map((name) => (
          <li key={name} className="shrink-0">
            <button
              type="button"
              aria-current={active === name ? "true" : undefined}
              onClick={() => {
                setActive(name)
                document.getElementById(sectionId(name))?.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
              className="border-hairline-strong text-muted-foreground aria-[current=true]:text-foreground aria-[current=true]:bg-muted min-h-8 w-full rounded-full border px-3 text-left text-sm whitespace-nowrap lg:rounded-lg lg:border-transparent"
            >
              {t(`groups.${name}`)}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
