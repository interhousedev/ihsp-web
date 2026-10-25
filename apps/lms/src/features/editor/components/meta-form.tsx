"use client"

import type { CourseDraft } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Card, CardContent, Field, FieldLabel, Input, Textarea } from "@ihsp/ui"
import type { useMetaEditor } from "../hooks/use-meta-editor"

/** Title and description of the course draft, with the offline-buffer and conflict notices. */
export function MetaForm({
  draft,
  editor,
  canEdit,
}: {
  draft: CourseDraft
  editor: ReturnType<typeof useMetaEditor>
  canEdit: boolean
}) {
  const t = useT("editor")
  const errorMessage = useErrorMessage()
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        {editor.restorable ? (
          <Alert>
            <AlertDescription className="flex flex-wrap items-center gap-2">
              <span>{t("bufferFound")}</span>
              <Button size="sm" onClick={editor.restore} className="min-h-11 md:min-h-7">
                {t("bufferRestore")}
              </Button>
              <Button size="sm" variant="outline" onClick={editor.discardBuffer} className="min-h-11 md:min-h-7">
                {t("bufferDiscard")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
        {editor.status === "conflict" ? (
          <Alert variant="destructive">
            <AlertDescription className="flex flex-wrap items-center gap-2">
              <span>{t("metaConflict")}</span>
              <Button size="sm" onClick={() => void editor.keepMine()} className="min-h-11 md:min-h-7">
                {t("keepMine")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void editor.takeTheirs()}
                className="min-h-11 md:min-h-7"
              >
                {t("takeTheirs")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : editor.status === "error" ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(editor.error)}</AlertDescription>
          </Alert>
        ) : null}
        <Field>
          <FieldLabel htmlFor="course-title">{t("courseTitle")}</FieldLabel>
          <Input
            id="course-title"
            value={editor.title}
            onChange={(event) => editor.setTitle(event.target.value)}
            disabled={!canEdit}
            maxLength={200}
            className="h-11 md:h-8"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="course-description">{t("courseDescription")}</FieldLabel>
          <Textarea
            id="course-description"
            value={editor.description}
            onChange={(event) => editor.setDescription(event.target.value)}
            disabled={!canEdit}
            rows={4}
          />
        </Field>
        <p className="text-muted-foreground text-xs">{t("slugInfo", { slug: draft.slug })}</p>
      </CardContent>
    </Card>
  )
}
