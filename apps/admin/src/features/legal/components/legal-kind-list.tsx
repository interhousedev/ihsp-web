"use client"

import type { LegalKind } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@ihsp/ui"
import type { LegalKindState } from "../utils"

type LegalKindListProps = {
  states: readonly LegalKindState[]
  selected: LegalKind | null
  onSelect: (kind: LegalKind) => void
}

/** The four kinds with the current published version, its date, the draft status and the acceptance count. */
export function LegalKindList({ states, selected, onSelect }: LegalKindListProps) {
  const t = useT("legal")
  const f = useFormatters()
  return (
    <ul className="grid gap-3 md:grid-cols-2" aria-label={t("list")}>
      {states.map((state) => (
        <li key={state.kind}>
          <Card data-selected={selected === state.kind}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {t(`kinds.${state.kind}`)}
                {state.draft ? (
                  <Badge variant="secondary">{t("draftBadge", { version: state.draft.version })}</Badge>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {state.published ? (
                <dl className="grid gap-1">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t("version")}</dt>
                    <dd>{state.published.version}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t("publishedAt")}</dt>
                    <dd>{state.published.published_at ? f.dateTime(state.published.published_at) : "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t("accepted")}</dt>
                    <dd>{state.accepted ?? 0}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-muted-foreground">{t("notPublished")}</p>
              )}
              <Button type="button" variant="outline" onClick={() => onSelect(state.kind)}>
                {t("edit")}
              </Button>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}
