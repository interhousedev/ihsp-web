"use client"

import { QueryState } from "@ihsp/features-core"
import { useLocale, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, AlertTitle, Badge, Button, Icons, PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { activateLevelScheme, getLevelSchemesQuery, getRewardBadgesQuery, levelKeys, type LevelScheme } from "../api"
import { pick } from "../levels"
import { DraftEditor } from "./draft-editor"
import { NewDraft } from "./new-draft"

const SELECT_CLASS =
  "border-input bg-background h-9 min-h-11 w-full rounded-lg border px-2 text-sm md:min-h-9 focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"

/** Level schemes: the live one, drafts with a server preview on today's learners, and a guarded activation. Levels never drop. */
export function LevelsPage() {
  const query = useQuery(getLevelSchemesQuery())
  const badges = useQuery(getRewardBadgesQuery())
  return (
    <QueryState query={query} rows={6}>
      {({ items }) => (
        <Schemes items={items.filter((s) => s.scope === "platform")} rewardBadges={badges.data?.items ?? []} />
      )}
    </QueryState>
  )
}

function Schemes({
  items,
  rewardBadges,
}: {
  items: LevelScheme[]
  rewardBadges: { id: string; name: Record<string, string> }[]
}) {
  const t = useT("lmsLevels")
  const locale = useLocale()
  const active = items.find((s) => s.active) ?? null
  const drafts = items.filter((s) => !s.active)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [previous, setPrevious] = useState<LevelScheme | null>(null)
  const [justActivated, setJustActivated] = useState<LevelScheme | null>(null)
  const selected = drafts.find((s) => s.id === selectedId) ?? (creating ? null : (drafts[0] ?? null))

  const revert = useAdminMutation({
    mutationFn: (id: string) => activateLevelScheme(id),
    invalidate: [levelKeys.schemes()],
    onSuccess: () => {
      setPrevious(null)
      setJustActivated(null)
    },
  })

  return (
    <PageContainer
      title={t("title")}
      badge={
        <Badge variant={selected ? "warning" : "success"}>{selected ? t("status.draft") : t("status.active")}</Badge>
      }
      meta={
        active ? (
          <span className="text-muted-foreground text-sm">{t("meta", { active: pick(active.name, locale) })}</span>
        ) : undefined
      }
      actions={
        selected ? (
          <Button type="button" variant="outline" onClick={() => setCreating(true)}>
            <Icons.add data-icon="inline-start" aria-hidden />
            {t("newDraft.open")}
          </Button>
        ) : undefined
      }
    >
      <p className="text-muted-foreground max-w-3xl text-sm">{t("description")}</p>

      {justActivated ? (
        <Alert variant="default" role="status">
          <Icons.circleCheck aria-hidden />
          <AlertTitle>{t("activated.title")}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{t("activated.body", { name: pick(justActivated.name, locale) })}</span>
            {previous ? (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0"
                disabled={revert.isPending}
                onClick={() => revert.mutate(previous.id)}
              >
                {t("activated.revert", { name: pick(previous.name, locale) })}
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {drafts.length > 1 && selected ? (
        <select
          className={`${SELECT_CLASS} sm:max-w-xs`}
          aria-label={t("drafts")}
          value={selected.id}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          {drafts.map((d) => (
            <option key={d.id} value={d.id}>
              {pick(d.name, locale)}
            </option>
          ))}
        </select>
      ) : null}

      {selected ? (
        <DraftEditor
          key={selected.id}
          scheme={selected}
          active={active}
          rewardBadges={rewardBadges}
          onActivated={(was, now) => {
            setPrevious(was)
            setJustActivated(now)
            setSelectedId(null)
          }}
        />
      ) : (
        <NewDraft
          active={active}
          onCreated={(scheme) => {
            setCreating(false)
            setSelectedId(scheme.id)
          }}
          onCancel={drafts.length > 0 ? () => setCreating(false) : undefined}
        />
      )}
    </PageContainer>
  )
}
