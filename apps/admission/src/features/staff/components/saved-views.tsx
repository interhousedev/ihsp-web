"use client"

import { ApiError, isApiError } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Input, Pill } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useAdmissionConfig } from "../../../lib/config"
import { useSavedViewMutations, useSavedViews, type CaseloadFilters, type SavedView } from "../api"

/** The cap of saved views: the API error carries it (`params.limit`); the config may announce it earlier. */
export function savedViewLimit(error: unknown, configLimit: number | undefined): number | undefined {
  if (isApiError(error) && typeof (error as ApiError).params.limit === "number")
    return (error as ApiError).params.limit as number
  return configLimit
}

/** Server-side presets of the filters: apply, save the current filters under a name, delete. */
export function SavedViews({ filters, onApply }: { filters: CaseloadFilters; onApply: (view: SavedView) => void }) {
  const t = useT("staff")
  const errorMessage = useErrorMessage()
  const config = useAdmissionConfig()
  const views = useSavedViews()
  const { create, remove } = useSavedViewMutations()
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState("")
  const [limit, setLimit] = useState<number | undefined>()
  const [limitHit, setLimitHit] = useState(false)

  const configLimit = (config.data as { limits?: Record<string, number> } | undefined)?.limits?.saved_views
  const items = views.data?.items ?? []
  const atCap = limitHit || (configLimit !== undefined && items.length >= configLimit)

  async function save(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      await create.mutateAsync({ name: trimmed, filters })
      setName("")
      setNaming(false)
    } catch (error) {
      if (isApiError(error) && error.type === "admission/saved_view_limit") {
        setLimit(savedViewLimit(error, configLimit))
        setLimitHit(true)
        setNaming(false)
      } else toast.error(errorMessage(error))
    }
  }

  function removeView(view: SavedView) {
    remove.mutate(view.id, {
      onSuccess: () => setLimitHit(false),
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <section className="flex flex-col gap-2" aria-label={t("views.title")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs font-medium">{t("views.title")}</span>
        {items.map((view) => (
          <span key={view.id} className="inline-flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => onApply(view)}>
              {view.name}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("views.delete", { name: view.name })}
              onClick={() => removeView(view)}
            >
              <Icons.trash className="size-4" />
            </Button>
          </span>
        ))}
        {naming ? (
          <form onSubmit={save} className="flex items-center gap-2">
            <Input
              aria-label={t("views.name")}
              placeholder={t("views.name")}
              value={name}
              autoFocus
              onChange={(event) => setName(event.target.value)}
            />
            <Button type="submit" size="sm" disabled={!name.trim() || create.isPending}>
              {t("views.save")}
            </Button>
          </form>
        ) : (
          <Button variant="ghost" size="sm" disabled={atCap} onClick={() => setNaming(true)}>
            <Icons.add className="size-4" />
            {t("views.saveCurrent")}
          </Button>
        )}
      </div>
      {atCap ? (
        <Pill tone="warning" role="status" className="h-auto py-1 whitespace-normal">
          {limit !== undefined ? t("views.limitReached", { limit }) : t("views.limitReachedPlain")}
        </Pill>
      ) : null}
    </section>
  )
}
