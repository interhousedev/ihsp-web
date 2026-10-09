"use client"

import { postLibrarySanction, type Sanction } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, Input, Label, NativeSelect, NativeSelectOption, Textarea } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useId, useState } from "react"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Administration may **warn** a user or **ban** them from uploading after upheld reports (§ 3.6). Librarians cannot.
 * The decision is audited by the API and shown to the user.
 */
export function SanctionsForm() {
  const t = useT("library.manage.sanctions")
  const errorMessage = useErrorMessage()
  const format = useFormatters()
  const id = useId()
  const [userId, setUserId] = useState("")
  const [kind, setKind] = useState<Sanction["kind"]>("warning")
  const [until, setUntil] = useState("")
  const [reason, setReason] = useState("")
  const [attempted, setAttempted] = useState(false)

  const create = useMutation({
    mutationFn: () =>
      postLibrarySanction({
        user_id: userId.trim(),
        kind,
        ...(kind === "upload_ban" && until ? { until: `${until}T23:59:59Z` } : {}),
        reason: reason.trim(),
      }),
    onSuccess: () => {
      setUserId("")
      setUntil("")
      setReason("")
      setAttempted(false)
    },
  })

  const idInvalid = !UUID.test(userId.trim())
  const reasonMissing = reason.trim() === ""

  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-4 rounded-xl border p-4">
      <div>
        <h2 id={`${id}-title`} className="text-lg font-semibold">
          {t("title")}
        </h2>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>
      <form
        className="flex max-w-xl flex-col gap-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          setAttempted(true)
          if (!idInvalid && !reasonMissing && !create.isPending) create.mutate()
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-user`}>{t("userId")}</Label>
          <Input
            id={`${id}-user`}
            value={userId}
            aria-invalid={attempted && idInvalid}
            className="min-h-11 font-mono md:min-h-8"
            onChange={(event) => setUserId(event.target.value)}
          />
          {attempted && idInvalid ? (
            <p role="alert" className="text-destructive text-sm">
              {t("userIdInvalid")}
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">{t("userIdHint")}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-kind`}>{t("kind")}</Label>
          <NativeSelect
            id={`${id}-kind`}
            value={kind}
            onChange={(event) => setKind(event.target.value as Sanction["kind"])}
          >
            <NativeSelectOption value="warning">{t("warning")}</NativeSelectOption>
            <NativeSelectOption value="upload_ban">{t("upload_ban")}</NativeSelectOption>
          </NativeSelect>
        </div>
        {kind === "upload_ban" ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-until`}>{t("until")}</Label>
            <Input
              id={`${id}-until`}
              type="date"
              value={until}
              className="min-h-11 w-full md:min-h-8 md:w-fit"
              onChange={(event) => setUntil(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">{t("untilHint")}</p>
          </div>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-reason`}>{t("reason")}</Label>
          <Textarea
            id={`${id}-reason`}
            rows={3}
            value={reason}
            aria-invalid={attempted && reasonMissing}
            onChange={(event) => setReason(event.target.value)}
          />
          {attempted && reasonMissing ? (
            <p role="alert" className="text-destructive text-sm">
              {t("reasonRequired")}
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">{t("reasonHint")}</p>
          )}
        </div>
        {create.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(create.error)}
          </p>
        ) : null}
        <div>
          <Button type="submit" className="min-h-11 md:min-h-8" disabled={create.isPending}>
            {t("submit")}
          </Button>
        </div>
      </form>
      <div role="status" aria-live="polite">
        {create.data ? (
          <p className="text-sm font-medium">
            {t(create.data.kind === "warning" ? "doneWarning" : "doneBan", {
              user: create.data.user_id,
              until: create.data.until ? format.date(create.data.until) : "",
            })}
          </p>
        ) : null}
      </div>
    </section>
  )
}
