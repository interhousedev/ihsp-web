"use client"

import { isApiError } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Input, LoadingButton } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { useOrgMutations, useOrgs, type Org, type OrgKind } from "../../opportunities/api"

const KINDS: OrgKind[] = ["university", "company", "foundation", "government", "ngo"]

type Draft = { name: string; kind: OrgKind; logo_url: string; website: string; country: string }
const EMPTY: Draft = { name: "", kind: "university", logo_url: "", website: "", country: "" }

function toDraft(org: Org): Draft {
  return {
    name: org.name,
    kind: org.kind,
    logo_url: org.logo_url ?? "",
    website: org.website ?? "",
    country: org.country ?? "",
  }
}

/** Organizations that run scholarships: create, edit with a logo, delete (refused while in use). */
export function OrgsEditor() {
  const t = useT("opportunitiesStaff")
  const errorMessage = useErrorMessage()
  const orgs = useOrgs()
  const { create, update, remove } = useOrgMutations()
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))
  const onError = (error: unknown) => toast.error(errorMessage(error))
  const body = {
    name: draft.name.trim(),
    kind: draft.kind,
    logo_url: draft.logo_url.trim() || null,
    website: draft.website.trim() || null,
    country: draft.country.trim() || null,
  }
  const reset = () => {
    setEditing(null)
    setDraft(EMPTY)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (editing) update.mutate({ id: editing, ...body }, { onSuccess: reset, onError })
    else create.mutate(body, { onSuccess: reset, onError })
  }

  function del(org: Org) {
    remove.mutate(org.id, {
      onSuccess: () => {
        if (editing === org.id) reset()
      },
      onError: (error) => (isApiError(error) && error.status === 409 ? toast.error(t("orgs.inUse")) : onError(error)),
    })
  }

  return (
    <section className="flex flex-col gap-4" aria-label={t("orgs.title")}>
      <h2 className="text-lg font-semibold">{t("orgs.title")}</h2>
      <ul className="flex flex-col gap-2">
        {(orgs.data?.items ?? []).map((org) => (
          <li key={org.id} className="bg-card flex items-center gap-3 rounded-card border p-3">
            <LogoAvatar name={org.name} src={org.logo_url} fit="contain" className="size-9 ring-0" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{org.name}</span>
              <span className="text-muted-foreground text-xs">{t(`orgs.kind.${org.kind}`)}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(org.id)
                setDraft(toDraft(org))
              }}
            >
              {t("orgs.edit")}
            </Button>
            <Button size="sm" variant="ghost" disabled={remove.isPending} onClick={() => del(org)}>
              {t("orgs.delete")}
            </Button>
          </li>
        ))}
      </ul>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={submit}>
        <Input
          aria-label={t("orgs.name")}
          placeholder={t("orgs.name")}
          value={draft.name}
          maxLength={200}
          onChange={(e) => set("name", e.target.value)}
        />
        <select
          aria-label={t("orgs.kindLabel")}
          className="border-input bg-background h-10 rounded-md border px-3 text-sm"
          value={draft.kind}
          onChange={(e) => set("kind", e.target.value as OrgKind)}
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {t(`orgs.kind.${k}`)}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <LogoAvatar name={draft.name || "?"} src={draft.logo_url || null} fit="contain" className="size-9 ring-0" />
          <Input
            aria-label={t("orgs.logoUrl")}
            placeholder={t("orgs.logoUrl")}
            value={draft.logo_url}
            onChange={(e) => set("logo_url", e.target.value)}
          />
        </div>
        <Input
          aria-label={t("orgs.website")}
          placeholder={t("orgs.website")}
          value={draft.website}
          onChange={(e) => set("website", e.target.value)}
        />
        <Input
          aria-label={t("orgs.country")}
          placeholder={t("orgs.country")}
          value={draft.country}
          maxLength={2}
          onChange={(e) => set("country", e.target.value.toUpperCase())}
        />
        <div className="flex gap-2">
          <LoadingButton
            type="submit"
            size="sm"
            loading={create.isPending || update.isPending}
            disabled={draft.name.trim() === ""}
          >
            {editing ? t("orgs.save") : t("orgs.add")}
          </LoadingButton>
          {editing ? (
            <Button type="button" size="sm" variant="ghost" onClick={reset}>
              {t("orgs.cancel")}
            </Button>
          ) : null}
        </div>
      </form>
    </section>
  )
}
