"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Input, LoadingButton, ResponsiveDialog } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useCourseMutations } from "../api"

const EMPTY = { title: "", provider: "", level: "", year: "", grade: "" }
const MIN_YEAR = 1990
const MAX_YEAR = 2100

/** Adds a course taken outside the lyceum (POST /courses). */
export function ManualCourseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("courses")
  const errorMessage = useErrorMessage()
  const { add } = useCourseMutations()
  const [form, setForm] = useState(EMPTY)
  const year = form.year.trim() === "" ? null : Number(form.year)
  const yearInvalid = year !== null && (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR)
  const set = (key: keyof typeof EMPTY) => (event: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await add.mutateAsync({
        title: form.title.trim(),
        provider: form.provider.trim() || null,
        level: form.level.trim() || null,
        year,
        grade: form.grade.trim() || null,
      })
      toast.success(t("manual.done"))
      setForm(EMPTY)
      onOpenChange(false)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("manual.title")}
      onSubmit={submit}
      footer={
        <LoadingButton type="submit" loading={add.isPending} disabled={!form.title.trim() || yearInvalid}>
          {t("manual.submit")}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t("manual.name")}
          <Input value={form.title} maxLength={200} onChange={set("title")} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("manual.provider")}
          <Input value={form.provider} maxLength={200} onChange={set("provider")} />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            {t("manual.level")}
            <Input value={form.level} maxLength={50} onChange={set("level")} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("manual.year")}
            <Input value={form.year} inputMode="numeric" aria-invalid={yearInvalid} onChange={set("year")} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("manual.grade")}
            <Input value={form.grade} maxLength={20} onChange={set("grade")} />
          </label>
        </div>
        {yearInvalid ? (
          <p role="alert" className="text-destructive text-sm">
            {t("manual.yearInvalid", { min: MIN_YEAR, max: MAX_YEAR })}
          </p>
        ) : null}
      </div>
    </ResponsiveDialog>
  )
}
