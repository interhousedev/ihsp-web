"use client"

import { type DeviceCreatedOut, keys, postAdminDevice } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Input, Label, LoadingButton, ResponsiveDialog } from "@ihsp/ui"
import { useState } from "react"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

/** Names a new entrance device; the created device (with its one-time token) goes to `onCreated`. */
export function DeviceCreateDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (device: DeviceCreatedOut) => void
}) {
  const t = useT("devices")
  const tCommon = useT("common")
  const errorMessage = useErrorMessage()
  const [name, setName] = useState("")
  const create = useAdminMutation({
    mutationFn: (value: string) => postAdminDevice({ name: value }),
    invalidate: [keys.admin.devices()],
    inlineError: true,
    onSuccess: onCreated,
  })
  const trimmed = name.trim()

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("createTitle")}
      size="sm"
      onSubmit={(event) => {
        event.preventDefault()
        if (trimmed) create.mutate(trimmed)
      }}
      footer={
        <>
          <Button type="button" variant="outline" className={TOUCH} onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <LoadingButton
            type="submit"
            className={TOUCH}
            disabled={!trimmed}
            loading={create.isPending}
            loadingLabel={tCommon("loading")}
          >
            {t("create")}
          </LoadingButton>
        </>
      }
    >
      <div className="grid gap-2">
        <Label htmlFor="device-name">{t("name")}</Label>
        <Input
          id="device-name"
          value={name}
          maxLength={200}
          autoComplete="off"
          className={TOUCH}
          onChange={(event) => setName(event.target.value)}
        />
        {create.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(create.error)}
          </p>
        ) : null}
      </div>
    </ResponsiveDialog>
  )
}
