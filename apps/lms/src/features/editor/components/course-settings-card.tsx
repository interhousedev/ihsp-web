"use client"

import type { CourseDraft } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  Field,
  FieldLabel,
  NativeSelect,
  NativeSelectOption,
} from "@ihsp/ui"
import { useDraftActions } from "../hooks/use-course-draft"

/** Visibility (public or invite-only) and the archive state of the course (`PATCH /settings`, course:edit). */
export function CourseSettingsCard({ draft, canEdit }: { draft: CourseDraft; canEdit: boolean }) {
  const t = useT("editor")
  const errorMessage = useErrorMessage()
  const { settings } = useDraftActions(draft.id)
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">{t("settings")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="course-visibility">{t("visibility")}</FieldLabel>
            <NativeSelect
              id="course-visibility"
              value={draft.visibility}
              disabled={!canEdit || settings.isPending}
              onChange={(event) =>
                settings.mutate({ visibility: event.target.value === "invite" ? "invite" : "public" })
              }
              className="w-full"
            >
              <NativeSelectOption value="public">{t("visibilityPublic")}</NativeSelectOption>
              <NativeSelectOption value="invite">{t("visibilityInvite")}</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="course-status">{t("status")}</FieldLabel>
            <NativeSelect
              id="course-status"
              value={draft.status}
              disabled={!canEdit || settings.isPending}
              onChange={(event) =>
                settings.mutate({ status: event.target.value === "archived" ? "archived" : "active" })
              }
              className="w-full"
            >
              <NativeSelectOption value="active">{t("statusActive")}</NativeSelectOption>
              <NativeSelectOption value="archived">{t("statusArchived")}</NativeSelectOption>
            </NativeSelect>
          </Field>
        </div>
        {settings.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(settings.error)}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}
