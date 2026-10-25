"use client"

import { getLmsCourseVersionsQuery } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { EditorFrame } from "../../editor/components/editor-frame"
import { QueryState } from "../../shared/components/query-state"
import { hrefs } from "../../shared/utils/hrefs"
import { personName } from "../../shared/utils/people"
import { can } from "../../shared/utils/permissions"
import { LinkButton } from "../../shared/components/link-button"
import { ChangeSummary } from "./change-summary"
import { RestoreVersionButton } from "./restore-version-button"

/** `/edit/versions/?id=`: all published versions with View, Compare and Restore (UF-LMS-11, UF-LMS-12). */
export function VersionsPage({ courseId }: { courseId: string }) {
  const t = useT("versions")
  const format = useFormatters()
  const versions = useQuery(getLmsCourseVersionsQuery(courseId))
  const [selected, setSelected] = useState<number[]>([])

  function toggle(number: number) {
    setSelected((current) =>
      current.includes(number) ? current.filter((item) => item !== number) : [...current.slice(-1), number],
    )
  }
  const [a, b] = selected.toSorted((x, y) => x - y)

  return (
    <EditorFrame courseId={courseId} current="versions" title={t("title")}>
      {(permissions) => (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {selected.length === 2 && a !== undefined && b !== undefined ? (
              <LinkButton href={hrefs.compare(courseId, a, b)} variant="outline" className="min-h-11 md:min-h-8">
                {t("compareSelected")}
              </LinkButton>
            ) : (
              <Button variant="outline" disabled className="min-h-11 md:min-h-8">
                {t("compareSelected")}
              </Button>
            )}
          </div>
          <QueryState query={versions} isEmpty={(items) => items.length === 0} emptyText={t("empty")}>
            {(items) => (
              <ul className="flex flex-col gap-3">
                {items.map((item, index) => (
                  <li key={item.number}>
                    <Card>
                      <CardContent className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="flex min-h-11 items-center gap-2 md:min-h-0">
                            <input
                              type="checkbox"
                              checked={selected.includes(item.number)}
                              onChange={() => toggle(item.number)}
                              aria-label={t("select", { number: item.number })}
                              className="accent-primary size-5"
                            />
                            <span className="text-base font-semibold">{t("version", { number: item.number })}</span>
                          </label>
                          {index === 0 ? <Badge>{t("live")}</Badge> : null}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {format.dateTime(item.published_at)} · {personName(item.published_by)}
                        </p>
                        {item.note ? <p className="text-sm break-words">{item.note}</p> : null}
                        <p className="text-muted-foreground text-xs">
                          <ChangeSummary changes={item.changes} />
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <LinkButton
                            href={hrefs.version(courseId, item.number)}
                            size="sm"
                            variant="outline"
                            className="min-h-11 md:min-h-7"
                          >
                            {t("view")}
                          </LinkButton>
                          {can(permissions, "edit") ? (
                            <RestoreVersionButton courseId={courseId} number={item.number} />
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </QueryState>
        </div>
      )}
    </EditorFrame>
  )
}
