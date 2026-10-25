"use client"

import type { StaffLesson } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@ihsp/ui"
import { useId, useState } from "react"
import { toast } from "sonner"
import { useSaveTopic } from "../hooks/use-lesson-mutations"

/** The lesson topic (ACA-21, STF-8): set by the lesson's teacher; shown in the journal column header. */
export function TopicEditor({ lesson }: { lesson: StaffLesson["lesson"] }) {
  const t = useT("lessonDetail.topic")
  const errorMessage = useErrorMessage()
  const inputId = useId()
  const [value, setValue] = useState(lesson.topic ?? "")
  const save = useSaveTopic(lesson.id)
  const unchanged = value.trim() === (lesson.topic ?? "")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          <label htmlFor={inputId}>{t("title")}</label>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            if (!unchanged) save.mutate(value.trim(), { onSuccess: () => toast.success(t("saved")) })
          }}
        >
          <Input
            id={inputId}
            value={value}
            placeholder={t("placeholder")}
            className="h-11 md:h-8"
            onChange={(event) => setValue(event.target.value)}
          />
          <Button type="submit" className="min-h-11 md:min-h-8" disabled={save.isPending || unchanged}>
            {t("save")}
          </Button>
        </form>
        {save.isError ? (
          <p role="alert" className="text-destructive mt-2 text-sm">
            {errorMessage(save.error)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
