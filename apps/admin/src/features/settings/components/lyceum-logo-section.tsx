"use client"

import { apiAbsoluteUrl, deleteLyceumLogo, keys, putLyceumLogo } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Card, CardContent, CardHeader, CardTitle, ConfirmDialog } from "@ihsp/ui"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"]
const LOGO_MAX_BYTES = 1024 * 1024

/** The lyceum logo of the student card: preview, upload (checked on the client first) and removal with a confirmation. */
export function LyceumLogoSection({ logoUrl }: { logoUrl: string | null }) {
  const t = useT("settings")
  const input = useRef<HTMLInputElement>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const upload = useAdminMutation({
    mutationFn: (file: File) => putLyceumLogo(file),
    invalidate: [keys.admin.settings(), keys.public.clientConfig()],
    success: t("logoSaved"),
  })
  const remove = useAdminMutation({
    mutationFn: () => deleteLyceumLogo(),
    invalidate: [keys.admin.settings(), keys.public.clientConfig()],
    success: t("logoRemoved"),
    onSuccess: () => setConfirmRemove(false),
  })

  function onPick(file: File | undefined) {
    if (input.current) input.current.value = ""
    if (!file) return
    if (!LOGO_TYPES.includes(file.type)) return void toast.error(t("logoBadType"))
    if (file.size > LOGO_MAX_BYTES) return void toast.error(t("logoTooBig"))
    upload.mutate(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("logoTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-muted-foreground text-sm">{t("logoDescription")}</p>
        {logoUrl ? (
          // oxlint-disable-next-line nextjs/no-img-element -- static export, the logo is served by the API
          <img
            data-testid="lyceum-logo-preview"
            src={apiAbsoluteUrl(logoUrl)}
            alt={t("logoAlt")}
            className="size-20 rounded-full object-cover"
          />
        ) : (
          <p className="text-muted-foreground text-sm">{t("logoNone")}</p>
        )}
        <input
          ref={input}
          type="file"
          accept={LOGO_TYPES.join(",")}
          className="hidden"
          data-testid="lyceum-logo-input"
          tabIndex={-1}
          onChange={(event) => onPick(event.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" className={TOUCH} disabled={upload.isPending} onClick={() => input.current?.click()}>
            {logoUrl ? t("logoReplace") : t("logoUpload")}
          </Button>
          {logoUrl ? (
            <Button type="button" variant="outline" className={TOUCH} onClick={() => setConfirmRemove(true)}>
              {t("logoRemove")}
            </Button>
          ) : null}
        </div>
      </CardContent>
      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title={t("logoConfirmTitle")}
        description={t("logoConfirmDescription")}
        confirmLabel={t("logoRemove")}
        destructive
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </Card>
  )
}
