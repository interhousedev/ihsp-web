"use client"

import { getAdminLessonSourcesQuery, type LessonSourceItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Button, buttonVariants, cn, Dropdown, formatBytes, Icons } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { QueryState } from "../../shared/components/query-state"
import { TOUCH } from "../../shared/utils/touch"

const PAGE_SIZE = 20
const ALL_GROUPS = "all"

/** The groups seen so far: a filtered page only carries one group, but the filter keeps listing the others. */
function useKnownGroups(items: readonly LessonSourceItem[] | undefined) {
  const [groups, setGroups] = useState<Map<string, string>>(new Map())
  useEffect(() => {
    if (!items || items.length === 0) return
    setGroups((current) => {
      const next = new Map(current)
      for (const item of items) next.set(item.group_id, item.group_name)
      return next.size === current.size ? current : next
    })
  }, [items])
  return [...groups].sort((a, b) => a[1].localeCompare(b[1]))
}

function SourceRow({ item }: { item: LessonSourceItem }) {
  const t = useT("subjects.lessonSources")
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border p-2">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-medium break-words">{item.title}</span>
        <span className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary">{item.group_name}</Badge>
          {item.hidden ? <Badge variant="outline">{t("hidden")}</Badge> : null}
          {item.file ? (
            <span className="text-muted-foreground min-w-0 truncate" title={item.file.name}>
              {t("file", { name: item.file.name, size: formatBytes(item.file.byte_size) })}
            </span>
          ) : item.target_url ? (
            <span className="text-muted-foreground min-w-0 truncate" title={item.target_url}>
              {item.target_url}
            </span>
          ) : null}
        </span>
      </div>
      <a
        href={item.short_url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: "outline", size: "icon" }), "size-11 shrink-0")}
        aria-label={t("openItem", { title: item.title })}
      >
        <Icons.externalLink aria-hidden />
      </a>
    </li>
  )
}

/** "From lessons (EMIS)": the materials EMIS brought to the lessons of one subject, by group, read-only. */
export function LessonSources({ subjectId }: { subjectId: string }) {
  const t = useT("subjects.lessonSources")
  const [group, setGroup] = useState(ALL_GROUPS)
  const [offset, setOffset] = useState(0)
  const query = useQuery(
    getAdminLessonSourcesQuery(subjectId, {
      group_id: group === ALL_GROUPS ? undefined : group,
      limit: PAGE_SIZE,
      offset,
    }),
  )
  const groups = useKnownGroups(query.data?.items)
  const total = query.data?.total ?? 0
  const last = Math.min(offset + PAGE_SIZE, total)

  return (
    <section aria-label={t("heading")} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="lesson-sources-group" className="text-sm font-medium">
          {t("group")}
        </label>
        <Dropdown
          id="lesson-sources-group"
          className="w-full sm:w-60"
          value={group}
          onValueChange={(value) => {
            setGroup(value)
            setOffset(0)
          }}
          options={[
            { value: ALL_GROUPS, label: t("allGroups") },
            ...groups.map(([id, name]) => ({ value: id, label: name })),
          ]}
        />
      </div>
      <QueryState query={query} rows={3}>
        {(page) =>
          page.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("empty")}</p>
          ) : (
            <ol aria-label={t("heading")} className="flex flex-col gap-2">
              {page.items.map((item) => (
                <SourceRow key={item.link_id} item={item} />
              ))}
            </ol>
          )
        }
      </QueryState>
      {total > PAGE_SIZE ? (
        <nav aria-label={t("pages")} className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            className={TOUCH}
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            <Icons.chevronLeft aria-hidden />
            {t("previous")}
          </Button>
          <span className="text-muted-foreground text-sm">{t("range", { from: offset + 1, to: last, total })}</span>
          <Button
            type="button"
            variant="outline"
            className={TOUCH}
            disabled={last >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            {t("next")}
            <Icons.chevronRight aria-hidden />
          </Button>
        </nav>
      ) : null}
    </section>
  )
}
