"use client"

import {
  deleteAdminTimetable,
  getConflictList,
  patchAdminTimetable,
  postAdminTimetable,
  type Conflict,
  type Term,
  type TimetableEntry,
} from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  ConfirmDialog,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  LoadingButton,
  Spinner,
} from "@ihsp/ui"
import { useEffect, useId, useMemo, useState } from "react"
import { AudiencePicker, type AudienceChoice } from "../../shared/components/audience-picker"
import { LabeledField } from "../../shared/components/labeled-field"
import { SelectField } from "../../shared/components/select-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { useGroupOptions, useRoomOptions, useSubjectOptions, useTeacherOptions } from "../../shared/hooks/use-lookups"
import { fullName } from "../../shared/utils/names"
import { TOUCH } from "../../shared/utils/touch"
import { STUDY_WEEKDAYS, weekdayDate } from "../../shared/utils/weekdays"
import { useConflictCheck } from "../hooks/use-conflict-check"
import { entryInput, entryToForm, isWholeGroupOnly, newEntryForm, type EntryForm } from "../utils/entry-form"
import { ConflictList } from "./conflict-list"

export type EntryDefaults = {
  weekday: number
  period: number
  teacher_id?: string
  room_name?: string
  audience?: AudienceChoice[]
}

const INVALIDATE = [
  ["admin", "timetable"],
  ["admin", "rooms"],
  ["admin", "lessons"],
] as const

function initialForm(term: Term, entry: TimetableEntry | null, defaults: EntryDefaults | null): EntryForm {
  if (entry) return entryToForm(entry)
  return newEntryForm({ ...(defaults ?? { weekday: 1, period: 1 }), valid_from: term.starts_on })
}

/**
 * Create or edit a timetable entry (UF-ADM-06): subject, teacher, room (free text creates a room), audience with
 * subgroups, parity and validity. The entry is checked for conflicts while it is edited and "Save" stays off while a
 * conflict exists. A divisible subject suggests two subgroup entries.
 */
export function EntryEditorDialog({
  term,
  entry,
  defaults,
  open,
  onClose,
}: {
  term: Term
  entry: TimetableEntry | null
  defaults: EntryDefaults | null
  open: boolean
  onClose: () => void
}) {
  const t = useT("timetable.editor")
  const f = useFormatters()
  const errorMessage = useErrorMessage()
  const roomListId = useId()
  const groups = useGroupOptions()
  const subjects = useSubjectOptions()
  const teachers = useTeacherOptions()
  const rooms = useRoomOptions()
  const [form, setForm] = useState<EntryForm>(() => initialForm(term, entry, defaults))
  const [splitNext, setSplitNext] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(initialForm(term, entry, defaults))
    setSplitNext(false)
  }, [open, term, entry, defaults])

  const input = useMemo(() => entryInput(term.id, form), [term.id, form])
  const check = useConflictCheck(input, entry?.id)

  const save = useAdminMutation({
    mutationFn: (body: NonNullable<typeof input>) => {
      // The term of an entry never changes, so the patch leaves it out.
      return entry ? patchAdminTimetable(entry.id, { ...body, term_id: undefined }) : postAdminTimetable(body)
    },
    invalidate: INVALIDATE,
    success: entry ? t("saved") : t("created"),
    inlineError: true,
    onSuccess: () => {
      const group = form.audience[0]
      if (splitNext && group) {
        // Subgroup 1 is saved; the dialog stays open for subgroup 2 with the teacher and room cleared.
        setForm((current) => ({
          ...current,
          audience: [{ group_id: group.group_id, subgroup: 2 }],
          teacher_id: "",
          room_name: "",
        }))
        setSplitNext(false)
        return
      }
      onClose()
    },
  })
  const remove = useAdminMutation({
    mutationFn: () => deleteAdminTimetable(entry?.id ?? ""),
    invalidate: INVALIDATE,
    success: t("deleted"),
    onSuccess: () => {
      setDeleteOpen(false)
      onClose()
    },
  })

  const subject = subjects.data?.find((item) => item.id === form.subject_id)
  const suggestSplit = !entry && !splitNext && subject?.can_be_divided === true && isWholeGroupOnly(form.audience)
  const serverConflicts = getConflictList<Conflict>(save.error) ?? []
  const conflicts = serverConflicts.length > 0 && check.conflicts.length === 0 ? serverConflicts : check.conflicts
  const periods = useMemo(() => {
    const list = new Set(term.bells.map((bell) => bell.period))
    list.add(form.period)
    return [...list].toSorted((a, b) => a - b)
  }, [term.bells, form.period])

  const canSave = input !== null && !check.pending && check.conflicts.length === 0 && !save.isPending
  const set = <K extends keyof EntryForm>(field: K, value: EntryForm[K]) =>
    setForm((current) => ({ ...current, [field]: value }))

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (input && canSave) save.mutate(input)
            }}
          >
            <DialogHeader>
              <DialogTitle>{entry ? t("editTitle") : t("createTitle")}</DialogTitle>
              <DialogDescription>
                {t("description", { weekday: f.weekday(weekdayDate(form.weekday), "long"), period: form.period })}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-3">
              <LabeledField label={t("weekday")} htmlFor="entry-weekday">
                <SelectField
                  id="entry-weekday"
                  value={String(form.weekday)}
                  options={STUDY_WEEKDAYS.map((weekday) => ({
                    value: String(weekday),
                    label: f.weekday(weekdayDate(weekday), "long"),
                  }))}
                  onChange={(value) => set("weekday", Number(value))}
                />
              </LabeledField>
              <LabeledField label={t("period")} htmlFor="entry-period">
                <SelectField
                  id="entry-period"
                  value={String(form.period)}
                  options={periods.map((period) => ({ value: String(period), label: String(period) }))}
                  onChange={(value) => set("period", Number(value))}
                />
              </LabeledField>
              <LabeledField label={t("parity")} htmlFor="entry-parity">
                <SelectField
                  id="entry-parity"
                  value={form.week_parity}
                  options={[
                    { value: "every", label: t("parityEvery") },
                    { value: "odd", label: t("parityOdd") },
                    { value: "even", label: t("parityEven") },
                  ]}
                  onChange={(value) =>
                    set("week_parity", value === "odd" ? "odd" : value === "even" ? "even" : "every")
                  }
                />
              </LabeledField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <LabeledField label={t("subject")} htmlFor="entry-subject" required>
                <SelectField
                  id="entry-subject"
                  value={form.subject_id}
                  emptyLabel={t("choose")}
                  options={(subjects.data ?? []).map((item) => ({ value: item.id, label: item.name.en }))}
                  onChange={(value) => set("subject_id", value)}
                />
              </LabeledField>
              <LabeledField label={t("teacher")} htmlFor="entry-teacher">
                <SelectField
                  id="entry-teacher"
                  value={form.teacher_id}
                  emptyLabel={t("noTeacher")}
                  options={(teachers.data ?? []).map((teacher) => ({ value: teacher.id, label: fullName(teacher) }))}
                  onChange={(value) => set("teacher_id", value)}
                />
              </LabeledField>
            </div>

            <LabeledField label={t("room")} htmlFor="entry-room">
              <Input
                id="entry-room"
                list={roomListId}
                value={form.room_name}
                className={TOUCH}
                autoComplete="off"
                onChange={(event) => set("room_name", event.target.value)}
              />
              <datalist id={roomListId}>
                {(rooms.data ?? []).map((room) => (
                  <option key={room.id} value={room.name} />
                ))}
              </datalist>
            </LabeledField>

            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">{t("audience")}</h3>
              <AudiencePicker
                groups={groups.data ?? []}
                value={form.audience}
                onChange={(audience) => set("audience", audience)}
              />
              {suggestSplit ? (
                <Alert>
                  <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                    <span>{t("splitSuggestion")}</span>
                    <Button
                      type="button"
                      variant="outline"
                      className={TOUCH}
                      onClick={() => {
                        const group = form.audience[0]
                        if (!group) return
                        set("audience", [{ group_id: group.group_id, subgroup: 1 }])
                        setSplitNext(true)
                      }}
                    >
                      {t("split")}
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : null}
              {splitNext ? (
                <p className="text-muted-foreground text-xs" role="status">
                  {t("splitNext")}
                </p>
              ) : null}
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <LabeledField label={t("validFrom")} htmlFor="entry-from" required>
                <DatePicker id="entry-from" value={form.valid_from} onChange={(date) => set("valid_from", date)} />
              </LabeledField>
              <LabeledField label={t("validTo")} htmlFor="entry-to">
                <div className="flex gap-2">
                  <DatePicker
                    id="entry-to"
                    value={form.valid_to}
                    min={form.valid_from ?? undefined}
                    placeholder={t("noEnd")}
                    onChange={(date) => set("valid_to", date)}
                  />
                  {form.valid_to ? (
                    <Button type="button" variant="ghost" className={TOUCH} onClick={() => set("valid_to", null)}>
                      {t("clear")}
                    </Button>
                  ) : null}
                </div>
              </LabeledField>
            </div>

            <ConflictList conflicts={conflicts} />
            {save.isError && serverConflicts.length === 0 ? (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{errorMessage(save.error)}</AlertDescription>
              </Alert>
            ) : null}
            <p className="text-muted-foreground flex items-center gap-2 text-xs" role="status" aria-live="polite">
              {check.pending ? (
                <>
                  <Spinner aria-hidden />
                  {t("checking")}
                </>
              ) : check.failed ? (
                t("checkFailed")
              ) : check.checked && check.conflicts.length === 0 ? (
                t("noConflicts")
              ) : null}
            </p>

            <DialogFooter>
              {entry ? (
                <Button
                  type="button"
                  variant="destructive"
                  className={`${TOUCH} sm:me-auto`}
                  onClick={() => setDeleteOpen(true)}
                >
                  {t("delete")}
                </Button>
              ) : null}
              <Button type="button" variant="outline" className={TOUCH} onClick={onClose}>
                {t("cancel")}
              </Button>
              <LoadingButton type="submit" className={TOUCH} disabled={!canSave} loading={save.isPending}>
                {t("save")}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        confirmLabel={t("delete")}
        destructive
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </>
  )
}
