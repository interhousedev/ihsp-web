"use client"

import { patchLmsCourseSettings, postLmsCourseJoinCode, type AudienceScope, type CourseDraft } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Badge,
  CopyButton,
  Field,
  FieldError,
  FieldLabel,
  Input,
  LoadingButton,
  Switch,
} from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { LinkButton } from "../../shared/components/link-button"
import { hrefs } from "../../shared/utils/hrefs"
import { GroupPicker } from "./group-picker"
import type { SettingsForm } from "../hooks/use-settings-form"
import { fromLocalInput, toLocalInput } from "../utils/validate"

const SCOPES: AudienceScope[] = ["link", "group", "lyceum", "public"]

/** Publication state, audience scope, enrolment window and the join code. */
export function VisibilityTab({ form, draft }: { form: SettingsForm; draft: CourseDraft }) {
  const t = useT("courseSettings")
  const errorMessage = useErrorMessage()
  const values = form.values
  const status = useMutation<unknown, unknown, "active" | "archived">({
    mutationFn: (next) => patchLmsCourseSettings(draft.id, { status: next }),
    onSuccess: () => form.refreshState(),
  })
  const code = useMutation<{ invite_code: string }, unknown, void>({
    mutationFn: () => postLmsCourseJoinCode(draft.id),
    onSuccess: (result) => form.update({ invite_code: result.invite_code }),
  })
  if (!values) return null
  const { update, errors } = form
  const archived = values.publish_state === "archived"
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="vis-state" className="flex flex-col gap-3">
        <h3 id="vis-state" className="text-base font-semibold">
          {t("state")}
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={values.publish_state === "published" ? "default" : "outline"}>
            {t(`states.${values.publish_state}`)}
          </Badge>
          {values.publish_state === "draft" ? (
            <LinkButton href={hrefs.publish(draft.id)} variant="outline" className="min-h-11 md:min-h-8">
              {t("goPublish")}
            </LinkButton>
          ) : null}
          <LoadingButton
            variant="outline"
            loading={status.isPending}
            onClick={() => status.mutate(archived ? "active" : "archived")}
            className="min-h-11 md:min-h-8"
          >
            {archived ? t("restore") : t("archive")}
          </LoadingButton>
        </div>
        {status.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(status.error)}</AlertDescription>
          </Alert>
        ) : null}
      </section>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-base font-semibold">{t("audienceScope")}</legend>
        {SCOPES.map((scope) => (
          <label key={scope} className="flex min-h-11 items-center gap-3 text-sm md:min-h-8">
            <input
              type="radio"
              name="audience-scope"
              value={scope}
              checked={values.audience_scope === scope}
              onChange={() => update({ audience_scope: scope })}
              className="size-4"
            />
            {t(`scopes.${scope}`)}
          </label>
        ))}
        {values.audience_scope === "group" ? (
          <GroupPicker value={values.audience_group_ids} onChange={(ids) => update({ audience_group_ids: ids })} />
        ) : null}
      </fieldset>

      <section aria-labelledby="vis-enrol" className="flex flex-col gap-3">
        <h3 id="vis-enrol" className="text-base font-semibold">
          {t("enrolment")}
        </h3>
        <label className="flex min-h-11 items-center gap-3 text-sm md:min-h-8">
          <Switch
            checked={values.enrolment_open}
            onCheckedChange={(open) => update({ enrolment_open: open })}
            aria-label={t("enrolmentOpen")}
          />
          {t("enrolmentOpen")}
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="enrol-from">{t("enrolFrom")}</FieldLabel>
            <Input
              id="enrol-from"
              type="datetime-local"
              value={toLocalInput(values.enrolment_starts_at)}
              onChange={(e) => update({ enrolment_starts_at: fromLocalInput(e.target.value) })}
              className="h-11 md:h-8"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="enrol-to">{t("enrolTo")}</FieldLabel>
            <Input
              id="enrol-to"
              type="datetime-local"
              value={toLocalInput(values.enrolment_ends_at)}
              aria-invalid={errors.enrolment_ends_at !== undefined}
              onChange={(e) => update({ enrolment_ends_at: fromLocalInput(e.target.value) })}
              className="h-11 md:h-8"
            />
            {errors.enrolment_ends_at ? <FieldError>{t("errors.dates")}</FieldError> : null}
          </Field>
        </div>
        <p className="text-muted-foreground text-xs">{t("timezoneHint")}</p>
      </section>

      <section aria-labelledby="vis-code" className="flex flex-col gap-3">
        <h3 id="vis-code" className="text-base font-semibold">
          {t("joinCode")}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {values.invite_code ? (
            <>
              <code className="bg-muted rounded-md px-3 py-2 font-mono text-sm" aria-label={t("joinCode")}>
                {values.invite_code}
              </code>
              <CopyButton value={values.invite_code} label={t("copy")} />
            </>
          ) : (
            <span className="text-muted-foreground text-sm">{t("noJoinCode")}</span>
          )}
          <LoadingButton
            variant="outline"
            loading={code.isPending}
            onClick={() => code.mutate()}
            className="min-h-11 md:min-h-8"
          >
            {values.invite_code ? t("regenerate") : t("generate")}
          </LoadingButton>
        </div>
        {code.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(code.error)}</AlertDescription>
          </Alert>
        ) : null}
      </section>
    </div>
  )
}
