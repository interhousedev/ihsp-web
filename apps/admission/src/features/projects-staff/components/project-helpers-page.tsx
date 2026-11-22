"use client"

import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Skeleton, StateView } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { CURATOR_ROLES } from "../../../config/nav"
import { HELP_TAGS, type Helper } from "../../projects/api"
import { QueryError } from "../../shell/components/query-error"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useStaffHelperMutations, useStaffHelpers } from "../api"
import { HelperDialog } from "./helper-dialog"

type ActiveFilter = "all" | "active" | "inactive"
const SELECT = "border-input bg-background h-11 rounded-md border px-3 text-sm"

function contactOf(h: Helper): { text: string; href: string } | null {
  const c = h.contacts
  if (c.website) return { text: c.website, href: c.website }
  if (c.telegram)
    return { text: c.telegram, href: c.telegram.startsWith("@") ? `https://t.me/${c.telegram.slice(1)}` : c.telegram }
  if (c.email) return { text: c.email, href: `mailto:${c.email}` }
  if (c.phone) return { text: c.phone, href: `tel:${c.phone.replace(/[^+0-9]/g, "")}` }
  return null
}

export function ProjectHelpersBody() {
  const t = useT("projects")
  const lang = useLocale()
  const errorMessage = useErrorMessage()
  const query = useStaffHelpers()
  const { remove, update } = useStaffHelperMutations()
  const [kind, setKind] = useState("")
  const [tag, setTag] = useState("")
  const [active, setActive] = useState<ActiveFilter>("all")
  const [editing, setEditing] = useState<Helper | "new" | null>(null)
  const [deleting, setDeleting] = useState<Helper | null>(null)
  const onError = (error: unknown) => toast.error(errorMessage(error))

  const rows = (query.data?.items ?? []).filter(
    (h) =>
      (!kind || h.kind === kind) &&
      (!tag || h.tags.includes(tag)) &&
      (active === "all" || (active === "active" ? h.active : !h.active)),
  )

  let body
  if (query.isPending) body = <Skeleton className="h-32 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else if (rows.length === 0)
    body = <StateView state="empty" title={t("staff.emptyTitle")} description={t("staff.emptyText")} />
  else
    body = (
      <ul className="flex flex-col gap-2">
        {rows.map((h) => (
          <li key={h.id} className="bg-card flex flex-col gap-2 rounded-card border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-muted rounded-full px-2 py-0.5 text-xs">{t(`helpers.kind.${h.kind}`)}</span>
              <span className="font-medium">{h.name}</span>
              {!h.active && <span className="text-muted-foreground text-xs">{t("staff.inactive")}</span>}
            </div>
            <p className="text-muted-foreground text-sm">
              {h.description[lang as "en" | "ru" | "uz"] || h.description.en}
            </p>
            {h.tags.length > 0 && (
              <ul className="flex flex-wrap gap-1">
                {h.tags.map((x) => (
                  <li key={x} className="border-primary/40 rounded-full border px-2 py-0.5 text-xs">
                    {t(`helpTags.${x}`)}
                  </li>
                ))}
              </ul>
            )}
            {h.help_types.length > 0 && (
              <p className="text-muted-foreground text-xs">
                {t("staff.helpTypes")}: {h.help_types.map((x) => t(`helpTypes.${x}`)).join(", ")}
              </p>
            )}
            {contactOf(h) && (
              <p className="text-xs">
                <a className="text-primary underline" href={contactOf(h)?.href}>
                  {contactOf(h)?.text}
                </a>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" className="min-h-11" onClick={() => setEditing(h)}>
                {t("staff.edit")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11"
                disabled={update.isPending}
                onClick={() => {
                  const { id, ...rest } = h
                  update.mutate({ id, body: { ...rest, active: !h.active } }, { onError })
                }}
              >
                {h.active ? t("staff.deactivate") : t("staff.activate")}
              </Button>
              <Button type="button" size="sm" variant="ghost" className="min-h-11" onClick={() => setDeleting(h)}>
                {t("staff.delete")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    )

  return (
    <div className={pageClass()}>
      <AppPageHeader
        icon="sparkles"
        title={t("staff.title")}
        actions={
          <Button type="button" size="sm" className="min-h-11" onClick={() => setEditing("new")}>
            {t("staff.add")}
          </Button>
        }
      />
      <div className="flex flex-wrap gap-2">
        <select aria-label={t("staff.kind")} className={SELECT} value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">{t("staff.allKinds")}</option>
          <option value="person">{t("helpers.kind.person")}</option>
          <option value="organization">{t("helpers.kind.organization")}</option>
        </select>
        <select aria-label={t("staff.tag")} className={SELECT} value={tag} onChange={(e) => setTag(e.target.value)}>
          <option value="">{t("staff.allTags")}</option>
          {HELP_TAGS.map((x) => (
            <option key={x} value={x}>
              {t(`helpTags.${x}`)}
            </option>
          ))}
        </select>
        <select
          aria-label={t("staff.status")}
          className={SELECT}
          value={active}
          onChange={(e) => setActive(e.target.value as ActiveFilter)}
        >
          <option value="all">{t("staff.statusAll")}</option>
          <option value="active">{t("staff.statusActive")}</option>
          <option value="inactive">{t("staff.statusInactive")}</option>
        </select>
      </div>
      {body}
      <HelperDialog helper={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("staff.deleteTitle")}
        description={deleting?.name}
        confirmLabel={t("staff.delete")}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return
          remove.mutate(deleting.id, {
            onSuccess: () => setDeleting(null),
            onError: (error) => {
              setDeleting(null)
              onError(error)
            },
          })
        }}
      />
    </div>
  )
}

export function ProjectHelpersPage() {
  return (
    <AdmissionShell roles={[...CURATOR_ROLES]}>
      <ProjectHelpersBody />
    </AdmissionShell>
  )
}
