"use client"

import { useT } from "@ihsp/i18n"
import { Button, buttonVariants, Icons, Pill, Reveal, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { useList } from "../../chooser/hooks"
import { useExemplars } from "../api"

/** Admitted essays: an excerpt of about 80 words, its source and a link to the full text; defaults to the student's universities. */
export function ExemplarsTab({ institutionId }: { institutionId: string | null }) {
  const t = useT("essays")
  const query = useExemplars(institutionId)
  const list = useList()
  const [all, setAll] = useState(false)
  const mine = new Set((list.data ?? []).map((e) => e.institution.id))
  const filtered = !institutionId && !all && mine.size > 0
  const items = (query.data?.items ?? []).filter(
    (x) => !filtered || (x.institution_id !== null && mine.has(x.institution_id)),
  )
  if (query.isPending) return <StateView state="loading" rows={3} />
  if (query.isError) return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  return (
    <div className="flex flex-col gap-4">
      {mine.size > 0 && !institutionId ? (
        <Button type="button" size="sm" variant="outline" className="self-start" onClick={() => setAll(!all)}>
          {all ? t("examples.onlyMine") : t("examples.showAll")}
        </Button>
      ) : null}
      {items.length === 0 ? (
        <StateView
          state="empty"
          icon={<Icons.post aria-hidden />}
          title={t("examples.emptyTitle")}
          description={t("examples.emptyText")}
          action={
            mine.size === 0 ? (
              <Link href="/chooser/search/" className={buttonVariants()}>
                {t("collegeOpen")}
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((x) => (
            <li key={x.id}>
              <Reveal>
                <article className="border-hairline flex h-full flex-col gap-2 rounded-card border p-4">
                  <header className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{x.school_name || x.source_name}</h3>
                    {x.year ? <Pill tone="neutral">{x.year}</Pill> : null}
                  </header>
                  {x.prompt ? <p className="text-muted-foreground text-xs">{x.prompt}</p> : null}
                  <p className="text-sm whitespace-pre-wrap">{x.excerpt}</p>
                  <a
                    href={x.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto inline-flex items-center gap-1 text-sm underline"
                  >
                    {t("examples.readFull")}
                    <Icons.externalLink aria-hidden className="size-3.5" />
                  </a>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
