"use client"

import { QueryState } from "@ihsp/features-core"
import { useLocale, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Icons,
  PageContainer,
  ResponsiveDialog,
  Switch,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import {
  adminBadgeKeys,
  createPlatformBadge,
  deletePlatformBadge,
  getBadgeTemplatesQuery,
  getPlatformBadgesQuery,
  patchPlatformBadge,
  type PlatformBadge,
  type PlatformEvent,
} from "../api"
import { BadgeForm, draftValid, EMPTY_DRAFT, type BadgeDraft } from "./badge-form"
import { BadgeMedal } from "./badge-medal"

const pick = (value: Record<string, string>, locale: string) =>
  value[locale] || value.ru || Object.values(value).find(Boolean) || ""

function toDraft(badge: PlatformBadge): BadgeDraft {
  return {
    name: { ru: "", uz: "", en: "", ...badge.name },
    description: { ru: "", uz: "", en: "", ...badge.description },
    design: badge.design,
    event: (badge.rule.event as PlatformEvent) ?? "level_reached",
    count: badge.rule.condition?.value ?? 1,
  }
}

const bodyOf = (d: BadgeDraft) => ({
  name: d.name,
  description: d.description,
  design: d.design,
  rule: { event: d.event, condition: { op: "count_gte" as const, value: d.count } },
})

/** Platform badges: the list with a switch, the creation page and the edit dialog. Platform rules are aggregate events with a count. */
export function BadgesPage() {
  const t = useT("lmsBadges")
  const list = useQuery(getPlatformBadgesQuery())
  const templates = useQuery(getBadgeTemplatesQuery())
  const platformCount = templates.data?.items
    .find((x) => x.scope === "platform")
    ?.params.find((p) => p.name === "count")
  const countRange = { min: platformCount?.min ?? 1, max: platformCount?.max ?? 1000 }
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  if (creating) {
    return (
      <CreateBadge
        countRange={countRange}
        onCancel={() => setCreating(false)}
        onDone={(name) => {
          setCreated(name)
          setCreating(false)
        }}
      />
    )
  }
  return (
    <PageContainer
      title={t("title")}
      actions={
        <Button type="button" onClick={() => setCreating(true)}>
          <Icons.add data-icon="inline-start" aria-hidden />
          {t("create")}
        </Button>
      }
    >
      <p className="text-muted-foreground max-w-3xl text-sm">{t("description")}</p>
      {created ? (
        <Alert role="status">
          <Icons.circleCheck aria-hidden />
          <AlertTitle>{t("created.title")}</AlertTitle>
          <AlertDescription>{t("created.body", { name: created })}</AlertDescription>
        </Alert>
      ) : null}
      <QueryState query={list} rows={4}>
        {({ items }) =>
          items.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("empty")}</p>
          ) : (
            <>
              <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} onOpen={() => setOpenId(badge.id)} />
                ))}
              </ul>
              {items.find((b) => b.id === openId) ? (
                <BadgeDetail
                  key={openId}
                  badge={items.find((b) => b.id === openId)!}
                  countRange={countRange}
                  onClose={() => setOpenId(null)}
                />
              ) : null}
            </>
          )
        }
      </QueryState>
    </PageContainer>
  )
}

function BadgeCard({ badge, onOpen }: { badge: PlatformBadge; onOpen: () => void }) {
  const t = useT("lmsBadges")
  const locale = useLocale()
  const toggle = useAdminMutation({
    mutationFn: (enabled: boolean) => patchPlatformBadge(badge.id, { enabled }),
    invalidate: [adminBadgeKeys.list()],
  })
  const rule = badge.rule
  return (
    <li>
      <Card className="h-full">
        <CardContent className="flex h-full flex-col gap-3">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={onOpen}
              className="focus-visible:ring-ring/50 flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-lg text-left focus-visible:ring-[3px] focus-visible:outline-none"
            >
              <BadgeMedal design={badge.design} size={48} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{pick(badge.name, locale)}</span>
                <span className="text-muted-foreground block text-sm">{pick(badge.description, locale)}</span>
              </span>
            </button>
            <Switch
              checked={badge.enabled}
              disabled={toggle.isPending}
              onCheckedChange={(v) => toggle.mutate(v)}
              aria-label={t("enabled")}
            />
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-2">
            <Badge variant="info">{t("scope.platform")}</Badge>
            {rule.event ? (
              <Badge variant="outline">
                {t("rule.summary", {
                  event: t(`rule.events.${rule.event as PlatformEvent}`),
                  n: rule.condition?.value ?? 1,
                })}
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </li>
  )
}

function CreateBadge({
  countRange,
  onCancel,
  onDone,
}: {
  countRange: { min: number; max: number }
  onCancel: () => void
  onDone: (name: string) => void
}) {
  const t = useT("lmsBadges")
  const locale = useLocale()
  const [draft, setDraft] = useState<BadgeDraft>(EMPTY_DRAFT)
  const create = useAdminMutation({
    mutationFn: () => createPlatformBadge(bodyOf(draft)),
    invalidate: [adminBadgeKeys.list()],
    onSuccess: () => onDone(pick(draft.name, locale)),
  })
  return (
    <PageContainer
      title={t("wizard.title")}
      back={
        <Button variant="ghost" size="sm" type="button" onClick={onCancel}>
          <Icons.chevronLeft data-icon="inline-start" aria-hidden />
          {t("wizard.back")}
        </Button>
      }
    >
      <Card>
        <CardContent className="grid gap-4">
          <p className="text-muted-foreground text-sm">{t("rule.note")}</p>
          <BadgeForm draft={draft} onChange={setDraft} countRange={countRange} />
          <div className="flex justify-between gap-2">
            <Button variant="outline" type="button" onClick={onCancel}>
              {t("wizard.cancel")}
            </Button>
            <Button type="button" disabled={!draftValid(draft) || create.isPending} onClick={() => create.mutate()}>
              <Icons.check data-icon="inline-start" aria-hidden />
              {t("wizard.create")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  )
}

function BadgeDetail({
  badge,
  countRange,
  onClose,
}: {
  badge: PlatformBadge
  countRange: { min: number; max: number }
  onClose: () => void
}) {
  const t = useT("lmsBadges")
  const locale = useLocale()
  const [draft, setDraft] = useState<BadgeDraft>(() => toDraft(badge))
  const [confirmDelete, setConfirmDelete] = useState(false)
  const save = useAdminMutation({
    mutationFn: () => patchPlatformBadge(badge.id, bodyOf(draft)),
    invalidate: [adminBadgeKeys.list()],
    onSuccess: onClose,
  })
  const remove = useAdminMutation({
    mutationFn: () => deletePlatformBadge(badge.id),
    invalidate: [adminBadgeKeys.list()],
    onSuccess: onClose,
  })
  return (
    <>
      <ResponsiveDialog
        open
        onOpenChange={(o) => !o && onClose()}
        title={pick(badge.name, locale)}
        description={t("detail.hint")}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)}>
              <Icons.trash data-icon="inline-start" aria-hidden />
              {t("detail.delete")}
            </Button>
            <Button type="button" disabled={!draftValid(draft) || save.isPending} onClick={() => save.mutate()}>
              {t("detail.save")}
            </Button>
          </>
        }
      >
        <BadgeForm draft={draft} onChange={setDraft} countRange={countRange} />
      </ResponsiveDialog>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("detail.deleteTitle")}
        description={t("detail.deleteBody")}
        confirmLabel={t("detail.deleteConfirm")}
        onConfirm={() => remove.mutate()}
      />
    </>
  )
}
