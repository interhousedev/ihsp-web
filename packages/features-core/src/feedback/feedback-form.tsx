"use client"

import {
  ApiError,
  FEEDBACK_DESCRIPTION_MAX,
  FEEDBACK_TITLE_MAX,
  keys,
  postFeedback,
  type FeedbackArea,
  type FeedbackCreateBody,
  type FeedbackKind,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Dropdown, Input, Label, Textarea } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useId, useState, type FormEvent } from "react"
import { FEEDBACK_AREAS, FEEDBACK_KINDS } from "./feedback-options"
import { FeedbackAttachmentsField } from "./feedback-attachments-field"
import { pageAddressOf } from "./page-address"
import { useFeedbackAttachments } from "./use-feedback-attachments"

export type FeedbackFormProps = {
  /** The section the user is in; the area selector starts on it. */
  defaultArea: FeedbackArea
  /** Closes the dialog (cancel, or the button after the report was sent). */
  onClose: () => void
}

/** The current page address without its query and hash (they can carry codes or ids). Empty outside the browser. */
function currentPageUrl(): string | undefined {
  return typeof window === "undefined" ? undefined : pageAddressOf(window.location.href)
}

/**
 * The report form: type, section, title, details and screenshots. `page_url` is filled from the address bar at the
 * moment of sending. On success the form shows the thank-you line and the close button.
 */
export function FeedbackForm({ defaultArea, onClose }: FeedbackFormProps) {
  const t = useT("feedback")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const ids = useId()
  const [kind, setKind] = useState<FeedbackKind>("bug")
  const [area, setArea] = useState<FeedbackArea>(defaultArea)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const attachments = useFeedbackAttachments()

  const mutation = useMutation({
    mutationFn: (body: FeedbackCreateBody) => postFeedback(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.feedback.mine() })
    },
  })

  const trimmedTitle = title.trim()
  const trimmedDescription = description.trim()
  const canSend =
    trimmedTitle.length > 0 &&
    trimmedTitle.length <= FEEDBACK_TITLE_MAX &&
    trimmedDescription.length > 0 &&
    trimmedDescription.length <= FEEDBACK_DESCRIPTION_MAX &&
    !attachments.hasPending &&
    !attachments.hasFailed &&
    !mutation.isPending

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSend) return
    mutation.mutate({
      kind,
      area,
      title: trimmedTitle,
      description: trimmedDescription,
      attachment_file_ids: attachments.readyIds,
      page_url: currentPageUrl(),
    })
  }

  if (mutation.isSuccess) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="text-sm">
          {t("dialog.sent")}
        </p>
        <Button type="button" className="min-h-11 md:min-h-8" onClick={onClose}>
          {t("dialog.close")}
        </Button>
      </div>
    )
  }

  const rateLimited =
    mutation.error instanceof ApiError &&
    (mutation.error.status === 429 || mutation.error.type === "feedback/rate-limited")

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t("dialog.kind")}</span>
          <Dropdown
            aria-label={t("dialog.kind")}
            value={kind}
            onValueChange={(value) => setKind(value as FeedbackKind)}
            options={FEEDBACK_KINDS.map((value) => ({ value, label: t(`kind.${value}`) }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t("dialog.area")}</span>
          <Dropdown
            aria-label={t("dialog.area")}
            value={area}
            onValueChange={(value) => setArea(value as FeedbackArea)}
            options={FEEDBACK_AREAS.map((value) => ({ value, label: t(`area.${value}`) }))}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${ids}-title`}>{t("dialog.titleField")}</Label>
        <Input
          id={`${ids}-title`}
          value={title}
          maxLength={FEEDBACK_TITLE_MAX}
          className="h-11 md:h-8"
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${ids}-description`}>{t("dialog.description")}</Label>
        <Textarea
          id={`${ids}-description`}
          value={description}
          maxLength={FEEDBACK_DESCRIPTION_MAX}
          rows={5}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <FeedbackAttachmentsField
        items={attachments.items}
        issue={attachments.issue}
        onFiles={(files) => attachments.add(files)}
        onRemove={attachments.remove}
        disabled={mutation.isPending}
      />
      {mutation.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {rateLimited ? t("dialog.rateLimited") : errorMessage(mutation.error)}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={onClose}>
          {t("dialog.cancel")}
        </Button>
        <Button type="submit" className="min-h-11 md:min-h-8" disabled={!canSend}>
          {mutation.isPending ? t("dialog.sending") : t("dialog.submit")}
        </Button>
      </div>
    </form>
  )
}
