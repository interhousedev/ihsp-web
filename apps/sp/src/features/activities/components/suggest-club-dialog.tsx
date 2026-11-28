"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Badge, Button, Field, FieldLabel, Input, ResponsiveDialog, SlugField, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { useMyClubRequests, useSubmitClub, useSuggestClub } from "../use-activities"

const STATUSES = ["draft", "pending_review"] as const
type RequestStatus = (typeof STATUSES)[number]

/** The caller's own club requests that are not published yet (draft or on review). */
export function MyClubRequests() {
  const t = useT("activities")
  const errorMessage = useErrorMessage()
  const mine = useMyClubRequests()
  const submit = useSubmitClub()
  const items = (mine.data?.items ?? []).filter((c) => (STATUSES as readonly string[]).includes(c.status ?? ""))
  if (items.length === 0) return null
  return (
    <section aria-labelledby="my-club-requests" className="flex flex-col gap-2">
      <h2 id="my-club-requests" className="text-sm font-semibold">
        {t("suggest.myRequests")}
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((c) => {
          const status = c.status as RequestStatus
          return (
            <li key={c.id} className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 font-medium">{c.name}</span>
              <Badge variant={status === "draft" ? "neutral" : "warning"}>{t(`suggest.status.${status}`)}</Badge>
              {status === "draft" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={submit.isPending}
                  onClick={() => submit.mutate(c.id)}
                >
                  {t("suggest.submitAgain")}
                </Button>
              ) : null}
            </li>
          )
        })}
      </ul>
      {submit.error ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(submit.error)}
        </p>
      ) : null}
    </section>
  )
}

/** "Suggest a club": a student proposes a club; it goes to the administrators for review. */
export function SuggestClubDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("activities")
  const errorMessage = useErrorMessage()
  const suggest = useSuggestClub()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const sent = suggest.isSuccess
  const valid = name.trim().length > 0 && /^[a-z0-9-]{1,60}$/.test(slug)

  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      suggest.reset()
      setName("")
      setSlug("")
      setDescription("")
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={close}
      title={t("suggest.title")}
      description={sent ? t("suggest.sent") : t("suggest.description")}
      onSubmit={(e) => {
        e.preventDefault()
        if (valid && !suggest.isPending) suggest.mutate({ name: name.trim(), slug, description: description.trim() })
      }}
      footer={
        sent ? (
          <Button type="button" onClick={() => close(false)}>
            {t("suggest.close")}
          </Button>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={() => close(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={!valid || suggest.isPending}>
              {t("suggest.submit")}
            </Button>
          </>
        )
      }
    >
      {sent ? null : (
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="suggest-club-name">{t("suggest.name")}</FieldLabel>
            <Input
              id="suggest-club-name"
              value={name}
              maxLength={120}
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
              className="h-11 md:h-8"
            />
          </Field>
          <SlugField
            id="suggest-club-slug"
            label={t("suggest.slug")}
            title={name}
            value={slug}
            onChange={setSlug}
            editLabel={t("suggest.slugEdit")}
            autoLabel={t("suggest.slugAuto")}
            hint={t("suggest.slugHint")}
          />
          <Field>
            <FieldLabel htmlFor="suggest-club-description">{t("suggest.descriptionLabel")}</FieldLabel>
            <Textarea
              id="suggest-club-description"
              value={description}
              maxLength={4000}
              rows={4}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          {suggest.error ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(suggest.error)}
            </p>
          ) : null}
        </div>
      )}
    </ResponsiveDialog>
  )
}
