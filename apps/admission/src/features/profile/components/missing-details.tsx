"use client"

import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import Link from "next/link"
import type { MissingDetail } from "../details-api"

/** Where each missing item of `/me/profile/details` is completed. */
const TARGET: Record<string, string> = {
  setup: "/setup/",
  three_words: "/profile/?tab=details#three-words",
  interest_fields: "/profile/?tab=background#interest-areas",
  service_interests: "/profile/?tab=background#services",
  career_quiz: "/career/",
  algorithm_quiz: "/colleges/algorithm/",
  activities: "/activities/",
}

/** "Missing details": one card per open item, each a link to where it is finished. */
export function MissingDetails({ missing }: { missing: MissingDetail[] }) {
  const t = useT("profilePage")
  return (
    <section aria-labelledby="missing-details" className="flex flex-col gap-3">
      <h2 id="missing-details" className="text-lg font-semibold">
        {t("missing")}
      </h2>
      {missing.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("missingNone")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {missing.map((item) => (
            <li key={item.key}>
              <Link
                href={TARGET[item.key] ?? "/profile/"}
                className="bg-card border-hairline hover:bg-accent rounded-card flex items-center justify-between gap-3 border px-4 py-3 text-sm transition-colors"
              >
                <span>{t.has(`missingItem.${item.key}`) ? t(`missingItem.${item.key}`) : item.label}</span>
                <Icons.chevronRight aria-hidden className="text-muted-foreground size-4 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
