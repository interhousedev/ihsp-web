"use client"

import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import Link from "next/link"
import { useIsHeadStudent } from "../../exams/hooks/use-exams"
import { HOME_TILES } from "../utils/home-tiles"

/** Icon tiles, three per row on a phone, linking to the student's pages. */
export function HomeTileGrid() {
  const t = useT("home")
  const isHead = useIsHeadStudent()
  return (
    <nav aria-label={t("sections")}>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {HOME_TILES.filter((tile) => !tile.headOnly || isHead).map((tile) => {
          const Icon = typeof tile.icon === "string" ? Icons[tile.icon] : tile.icon
          return (
            <li key={tile.key}>
              <Link
                href={tile.href}
                className="bg-card text-card-foreground hover:bg-accent focus-visible:ring-ring flex aspect-square min-h-24 flex-col items-center justify-center gap-2 rounded-card border p-2 text-center text-sm font-medium shadow-xs outline-none focus-visible:ring-2"
              >
                <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                  <Icon className="size-6" aria-hidden />
                </span>
                <span className="line-clamp-2 max-w-full text-xs leading-tight [overflow-wrap:anywhere] hyphens-auto">
                  {t(`tiles.${tile.key}`)}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
