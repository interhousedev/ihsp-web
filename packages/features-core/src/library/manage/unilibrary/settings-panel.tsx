"use client"

import { getUniLibrarySettingsQuery, keys, putUniLibrarySettings } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Badge, Button, Skeleton, StateView, Switch } from "@ihsp/ui"
import { IconDeviceFloppy } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useId, useState } from "react"
import { toast } from "sonner"

function SwitchRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex min-h-11 items-start justify-between gap-4">
      <div className="min-w-0">
        <p id={id} className="text-sm font-medium">
          {label}
        </p>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </div>
      <Switch checked={checked} aria-labelledby={id} onCheckedChange={onChange} />
    </div>
  )
}

/**
 * The two switches of UniLibrary: **Enable UniLibrary** and **Show anonymous cards**. UniLibrary is off by default and
 * nothing from it shows anywhere while it is off. After saving, the visitor-side probe (`keys.library.unilibrary.all()`)
 * is refetched, so the catalogue shows or hides UniLibrary without a reload.
 */
export function SettingsPanel() {
  const t = useT("library.manage.unilibrary.settings")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const settings = useQuery(getUniLibrarySettingsQuery())
  const [enabled, setEnabled] = useState(false)
  const [anonymous, setAnonymous] = useState(false)
  const saved = settings.data

  useEffect(() => {
    if (!saved) return
    setEnabled(saved.enabled)
    setAnonymous(saved.anonymous_cards)
  }, [saved])

  const save = useMutation({
    mutationFn: () => putUniLibrarySettings({ enabled, anonymous_cards: anonymous }),
    onSuccess: async (next) => {
      toast.success(next.enabled ? t("savedOn") : t("savedOff"))
      await queryClient.invalidateQueries({ queryKey: keys.library.unilibrary.all() })
      await queryClient.invalidateQueries({ queryKey: keys.library.admin.settings() })
      await queryClient.invalidateQueries({ queryKey: keys.library.admin.status() })
    },
  })

  const dirty = !!saved && (saved.enabled !== enabled || saved.anonymous_cards !== anonymous)

  return (
    <section aria-labelledby="unilibrary-settings" className="flex flex-col gap-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="unilibrary-settings" className="text-lg font-semibold">
          {t("title")}
        </h2>
        {saved ? (
          <Badge variant={saved.enabled ? "default" : "secondary"}>{saved.enabled ? t("on") : t("off")}</Badge>
        ) : null}
      </div>
      <p className="text-muted-foreground text-sm">{t("explanation")}</p>
      {settings.isPending ? (
        <Skeleton className="h-24 w-full rounded-lg" />
      ) : settings.isError ? (
        <StateView state="error" error={settings.error} onRetry={() => void settings.refetch()} />
      ) : (
        <div className="flex flex-col gap-3">
          <SwitchRow label={t("enable")} hint={t("enableHint")} checked={enabled} onChange={setEnabled} />
          <SwitchRow label={t("anonymous")} hint={t("anonymousHint")} checked={anonymous} onChange={setAnonymous} />
          {save.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(save.error)}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              className="min-h-11 md:min-h-8"
              disabled={!dirty || save.isPending}
              onClick={() => save.mutate()}
            >
              <IconDeviceFloppy aria-hidden />
              {t("save")}
            </Button>
            {dirty ? <span className="text-muted-foreground text-sm">{t("unsaved")}</span> : null}
          </div>
        </div>
      )}
    </section>
  )
}
