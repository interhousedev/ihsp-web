"use client"

import { useT } from "@ihsp/i18n"
import { Pill } from "@ihsp/ui"
import Link from "next/link"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { useOpportunities } from "../../opportunities/api"
import { detailHref } from "../../opportunities/components/scholarship-card"

/** Free university courses from the opportunities catalog: credit-bearing or run by a university. */
export function useFreeCourses() {
  const query = useOpportunities({ kind: "course" })
  const items = (query.data?.items ?? []).filter(
    (o) => o.fields.college_credit === "yes" || o.fields.college_credit === "possible" || o.org?.kind === "university",
  )
  return { query, items }
}

/** Free courses offered by universities, with the college credit they may count for. */
export function FreeCourses() {
  const t = useT("courses")
  const { items } = useFreeCourses()
  if (items.length === 0) return null
  return (
    <section className="flex flex-col gap-2" aria-labelledby="courses-free">
      <h2 id="courses-free" className="text-sm font-semibold">
        {t("free.title")}
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((o) => {
          const credit = o.fields.college_credit
          const name = o.org?.name ?? o.fields.provider
          return (
            <li key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-card border p-3">
              <LogoAvatar
                name={name ?? o.fields.title}
                src={o.org?.logo_url ?? o.fields.logo_url}
                fit="contain"
                className="size-9 ring-0"
              />
              <div className="min-w-0 flex-1 basis-40">
                <Link href={detailHref(o.id)} className="block truncate font-medium hover:underline">
                  {o.fields.title}
                </Link>
                {name ? <p className="text-muted-foreground truncate text-sm">{name}</p> : null}
                {o.fields.credit_note ? <p className="text-muted-foreground text-xs">{o.fields.credit_note}</p> : null}
              </div>
              {credit === "yes" || credit === "possible" ? (
                <Pill tone="success" className="h-auto whitespace-normal text-left">
                  {t(`free.credit.${credit}`)}
                </Pill>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
