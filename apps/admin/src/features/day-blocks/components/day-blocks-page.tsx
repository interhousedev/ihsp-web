"use client"

import { getAdminGroupsQuery, type GroupItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  IconPencil,
  IconPlus,
  IconTrash,
  Input,
  PageContainer,
  ResponsiveDialog,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { SelectField } from "../../shared/components/select-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH, TOUCH_ICON } from "../../shared/utils/touch"
import {
  DAY_BLOCK_KINDS,
  DAY_BLOCK_SCOPES,
  dayBlocksKey,
  deleteAdminDayBlock,
  getAdminDayBlocksQuery,
  postAdminDayBlock,
  putAdminDayBlock,
  type DayBlock,
  type DayBlockBody,
  type DayBlockKind,
  type DayBlockScope,
} from "../api"

const WEEKDAYS = [1, 2, 3, 4, 5] as const
const COURSES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const
const INVALIDATE = [dayBlocksKey] as const

/** "08:30:00" → "08:30". */
function hhmm(value: string): string {
  return value.slice(0, 5)
}

const EMPTY: DayBlockBody = {
  name: "",
  kind: "lunch",
  starts_at: "12:00",
  ends_at: "12:40",
  weekdays: [1, 2, 3, 4, 5],
  scope: "all",
  course: null,
  group_ids: [],
}

function BlockDialog({ block, groups, onClose }: { block: DayBlock | null; groups: GroupItem[]; onClose: () => void }) {
  const t = useT("dayBlocks")
  const [form, setForm] = useState<DayBlockBody>(() =>
    block
      ? { ...block, starts_at: hhmm(block.starts_at), ends_at: hhmm(block.ends_at) }
      : EMPTY,
  )
  const patch = (part: Partial<DayBlockBody>) => setForm((prev) => ({ ...prev, ...part }))
  const save = useAdminMutation({
    mutationFn: () => {
      const body: DayBlockBody = {
        ...form,
        name: form.name.trim(),
        weekdays: [...form.weekdays].sort(),
        course: form.scope === "course" ? form.course : null,
        group_ids: form.scope === "groups" ? form.group_ids : [],
      }
      return block ? putAdminDayBlock(block.id, body) : postAdminDayBlock(body)
    },
    invalidate: INVALIDATE,
    success: t("saved"),
    onSuccess: onClose,
  })
  const timeValid = form.starts_at !== "" && form.ends_at !== "" && form.starts_at < form.ends_at
  const valid =
    form.name.trim() !== "" &&
    form.weekdays.length > 0 &&
    timeValid &&
    (form.scope !== "course" || form.course !== null) &&
    (form.scope !== "groups" || form.group_ids.length > 0)
  const toggle = <T,>(list: T[], value: T, on: boolean) =>
    on ? (list.includes(value) ? list : [...list, value]) : list.filter((item) => item !== value)

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      title={block ? t("editTitle", { name: block.name }) : t("newTitle")}
      onSubmit={(event) => {
        event.preventDefault()
        if (valid) save.mutate()
      }}
      footer={
        <>
          <Button type="button" variant="outline" className={TOUCH} onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" className={TOUCH} disabled={!valid || save.isPending}>
            {t("save")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <LabeledField label={t("form.name")} htmlFor="day-block-name" required>
          <Input
            id="day-block-name"
            value={form.name}
            maxLength={120}
            className={TOUCH}
            placeholder={t("form.namePlaceholder")}
            onChange={(event) => patch({ name: event.target.value })}
          />
        </LabeledField>
        <LabeledField label={t("form.kind")} htmlFor="day-block-kind" required>
          <SelectField
            id="day-block-kind"
            value={form.kind}
            options={DAY_BLOCK_KINDS.map((kind) => ({ value: kind, label: t(`kind.${kind}`) }))}
            onChange={(value) => patch({ kind: value as DayBlockKind })}
          />
        </LabeledField>
        <div className="grid grid-cols-2 gap-3">
          <LabeledField label={t("form.startsAt")} htmlFor="day-block-start" required>
            <Input
              id="day-block-start"
              type="time"
              value={form.starts_at}
              className={TOUCH}
              onChange={(event) => patch({ starts_at: event.target.value })}
            />
          </LabeledField>
          <LabeledField label={t("form.endsAt")} htmlFor="day-block-end" required>
            <Input
              id="day-block-end"
              type="time"
              value={form.ends_at}
              className={TOUCH}
              aria-invalid={!timeValid}
              onChange={(event) => patch({ ends_at: event.target.value })}
            />
          </LabeledField>
        </div>
        {!timeValid && <p className="text-destructive text-sm">{t("form.timeError")}</p>}
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">{t("form.weekdays")}</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {WEEKDAYS.map((day) => (
              <label key={day} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
                <Checkbox
                  checked={form.weekdays.includes(day)}
                  onCheckedChange={(checked) => patch({ weekdays: toggle(form.weekdays, day, checked === true) })}
                />
                {t(`weekday.${day}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <LabeledField label={t("form.scope")} htmlFor="day-block-scope" required>
          <SelectField
            id="day-block-scope"
            value={form.scope}
            options={DAY_BLOCK_SCOPES.map((scope) => ({ value: scope, label: t(`scope.${scope}`) }))}
            onChange={(value) => patch({ scope: value as DayBlockScope })}
          />
        </LabeledField>
        {form.scope === "course" && (
          <LabeledField label={t("form.course")} htmlFor="day-block-course" required>
            <SelectField
              id="day-block-course"
              value={form.course === null ? "" : String(form.course)}
              emptyLabel={t("form.chooseCourse")}
              options={COURSES.map((course) => ({ value: String(course), label: t("courseN", { n: course }) }))}
              onChange={(value) => patch({ course: value === "" ? null : Number(value) })}
            />
          </LabeledField>
        )}
        {form.scope === "groups" && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">{t("form.groups")}</legend>
            <div className="grid max-h-60 grid-cols-2 gap-x-4 gap-y-1 overflow-y-auto sm:grid-cols-3">
              {groups.map((group) => (
                <label key={group.id} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
                  <Checkbox
                    checked={form.group_ids.includes(group.id)}
                    onCheckedChange={(checked) =>
                      patch({ group_ids: toggle(form.group_ids, group.id, checked === true) })
                    }
                  />
                  {group.name}
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </div>
    </ResponsiveDialog>
  )
}

/** Lunch, second lunch, breaks and assemblies by weekday, time and audience (all, one course, chosen groups). */
export function DayBlocksPage() {
  const t = useT("dayBlocks")
  const blocks = useQuery(getAdminDayBlocksQuery())
  const groups = useQuery(getAdminGroupsQuery({ status: "active" }))
  const [editing, setEditing] = useState<DayBlock | "new" | null>(null)
  const [deleting, setDeleting] = useState<DayBlock | null>(null)
  const remove = useAdminMutation({
    mutationFn: (block: DayBlock) => deleteAdminDayBlock(block.id),
    invalidate: INVALIDATE,
    success: t("deleted"),
    onSuccess: () => setDeleting(null),
  })
  const groupNames = useMemo(
    () => new Map((groups.data ?? []).map((group) => [group.id, group.name])),
    [groups.data],
  )
  const byDay = useMemo(
    () =>
      WEEKDAYS.map((day) => ({
        day,
        items: (blocks.data ?? [])
          .filter((block) => block.weekdays.includes(day))
          .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
      })),
    [blocks.data],
  )

  const audience = (block: DayBlock) => {
    if (block.scope === "course") return t("courseN", { n: block.course ?? 0 })
    if (block.scope === "groups")
      return block.group_ids.map((id) => groupNames.get(id) ?? "?").join(", ")
    return t("scope.all")
  }

  return (
    <PageContainer
      title={t("title")}
      actions={
        <Button type="button" className={TOUCH} onClick={() => setEditing("new")}>
          <IconPlus aria-hidden />
          {t("new")}
        </Button>
      }
    >
      <p className="text-muted-foreground mb-4 text-sm">{t("description")}</p>
      {blocks.isError ? (
        <p className="text-destructive text-sm">{t("loadError")}</p>
      ) : blocks.isPending ? (
        <p className="text-muted-foreground text-sm">{t("loading")}</p>
      ) : (blocks.data ?? []).length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {byDay.map(({ day, items }) => (
            <section key={day} aria-labelledby={`day-blocks-${day}`}>
              <h2 id={`day-blocks-${day}`} className="mb-2 text-base font-semibold">
                {t(`weekday.${day}`)}
              </h2>
              {items.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("dayEmpty")}</p>
              ) : (
                <ul className="divide-border flex flex-col divide-y rounded-lg border">
                  {items.map((block) => (
                    <li key={block.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
                      <span className="w-28 font-mono text-sm tabular-nums">
                        {hhmm(block.starts_at)}–{hhmm(block.ends_at)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{block.name}</span>{" "}
                        <Badge variant="outline">{t(`kind.${block.kind}`)}</Badge>
                        <span className="text-muted-foreground block text-sm break-words">{audience(block)}</span>
                      </span>
                      <span className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={TOUCH_ICON}
                          aria-label={t("edit", { name: block.name })}
                          onClick={() => setEditing(block)}
                        >
                          <IconPencil aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={TOUCH_ICON}
                          aria-label={t("delete", { name: block.name })}
                          onClick={() => setDeleting(block)}
                        >
                          <IconTrash aria-hidden />
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
      {editing !== null && (
        <BlockDialog
          key={editing === "new" ? "new" : editing.id}
          block={editing === "new" ? null : editing}
          groups={groups.data ?? []}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          open
          onOpenChange={(open) => (open ? undefined : setDeleting(null))}
          title={t("deleteTitle", { name: deleting.name })}
          description={t("deleteDescription")}
          confirmLabel={t("deleteConfirm")}
          destructive
          loading={remove.isPending}
          onConfirm={() => remove.mutate(deleting)}
        />
      )}
    </PageContainer>
  )
}
