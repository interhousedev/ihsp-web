"use client"

import {
  deleteAdminAiExtension,
  getAdminAiExtensionsQuery,
  getAdminAiLimitsQuery,
  getAdminAiStudentsQuery,
  keys,
  putAdminAiExtension,
  type AdminStudentItem,
  type ExtensionBody,
  type ExtensionItem,
  type LimitItem,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  NativeSelect,
  NativeSelectOption,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { QueryState } from "../../shared/components/query-state"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"

const MULTIPLIERS = [2, 3, 5, 10] as const

/** Students with raised limits: a multiplier or fixed values, until a date, with a note. */
export function ExtensionsSection() {
  const t = useT("limits")
  const [open, setOpen] = useState(false)
  const query = useQuery(getAdminAiExtensionsQuery())
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="text-base">{t("extensions.title")}</CardTitle>
          <p className="text-muted-foreground text-sm">{t("extensions.description")}</p>
        </div>
        <Button type="button" size="sm" onClick={() => setOpen(true)}>
          {t("extensions.add")}
        </Button>
      </CardHeader>
      <CardContent>
        <QueryState query={query} rows={2}>
          {({ items }) =>
            items.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">{t("extensions.empty")}</p>
            ) : (
              <ul className="flex flex-col">
                {items.map((item) => (
                  <ExtensionRow key={item.user_id} item={item} />
                ))}
              </ul>
            )
          }
        </QueryState>
      </CardContent>
      <ExtensionDialog open={open} onOpenChange={setOpen} />
    </Card>
  )
}

/** One extension in the list, with its state and a remove button. */
export function ExtensionRow({ item }: { item: ExtensionItem }) {
  const t = useT("limits")
  const remove = useAdminMutation<void, void>({
    mutationFn: () => deleteAdminAiExtension(item.user_id),
    invalidate: [keys.admin.aiExtensions()],
    success: t("extensions.removed"),
  })
  const grant =
    item.multiplier !== null
      ? t("extensions.multiplier", { value: item.multiplier })
      : Object.entries(item.values)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ")
  const until = item.expires_on ? t("extensions.until", { date: item.expires_on }) : t("extensions.forever")
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-t py-2.5 text-sm">
      <div className="flex min-w-0 flex-col">
        <p className="font-medium">
          {item.user_name}
          {item.login ? <span className="text-muted-foreground ms-2 text-xs">{item.login}</span> : null}
        </p>
        <p className="text-muted-foreground text-xs break-words">
          {grant} · {until}
          {item.note ? ` · ${item.note}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs">{item.active ? t("extensions.active") : t("extensions.expired")}</span>
        <Button type="button" size="sm" variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate()}>
          {t("extensions.remove")}
        </Button>
      </div>
    </li>
  )
}

/** Choose a student, then the grant: a multiplier or fixed values, an optional expiry and a note. */
export function ExtensionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("limits")
  const [search, setSearch] = useState("")
  const [student, setStudent] = useState<AdminStudentItem | null>(null)
  const [mode, setMode] = useState<"multiplier" | "values">("multiplier")
  const [multiplier, setMultiplier] = useState<number>(2)
  const [custom, setCustom] = useState<Record<string, string>>({})
  const [expires, setExpires] = useState("")
  const [note, setNote] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const query = search.trim()
  const found = useQuery({ ...getAdminAiStudentsQuery(query), enabled: query.length >= 2 && student === null })
  const limits = useQuery(getAdminAiLimitsQuery())
  const save = useAdminMutation<ExtensionBody, ExtensionItem>({
    mutationFn: (body) => putAdminAiExtension(student?.id ?? "", body),
    invalidate: [keys.admin.aiExtensions()],
    success: t("extensions.saved"),
    inlineError: true,
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  function reset() {
    setSearch("")
    setStudent(null)
    setMode("multiplier")
    setMultiplier(2)
    setCustom({})
    setExpires("")
    setNote("")
    setFormError(null)
  }

  function submit() {
    if (!student) return
    const values = Object.fromEntries(
      Object.entries(custom)
        .map(([key, text]) => [key, text.trim()] as const)
        .filter(([, text]) => /^\d+$/.test(text))
        .map(([key, text]) => [key, Number(text)]),
    )
    if (mode === "values" && Object.keys(values).length === 0) {
      setFormError(t("extensions.dialog.need"))
      return
    }
    setFormError(null)
    save.mutate(
      {
        multiplier: mode === "multiplier" ? multiplier : null,
        values: mode === "values" ? values : {},
        expires_on: expires || null,
        note: note.trim(),
      },
      { onSuccess: reset },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("extensions.dialog.title")}</DialogTitle>
        </DialogHeader>
        {student ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">
                {t("extensions.dialog.student")}: {student.name}
              </span>
              <Button type="button" size="sm" variant="ghost" onClick={() => setStudent(null)}>
                {t("extensions.dialog.change")}
              </Button>
            </div>
            <div className="flex gap-2" role="group" aria-label={t("extensions.dialog.mode")}>
              <Button
                type="button"
                size="sm"
                variant={mode === "multiplier" ? "default" : "outline"}
                aria-pressed={mode === "multiplier"}
                onClick={() => setMode("multiplier")}
              >
                {t("extensions.dialog.multiplier")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "values" ? "default" : "outline"}
                aria-pressed={mode === "values"}
                onClick={() => setMode("values")}
              >
                {t("extensions.dialog.custom")}
              </Button>
            </div>
            {mode === "multiplier" ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ext-multiplier">{t("extensions.dialog.multiplier")}</Label>
                <NativeSelect
                  id="ext-multiplier"
                  value={String(multiplier)}
                  onChange={(event) => setMultiplier(Number(event.target.value))}
                >
                  {MULTIPLIERS.map((value) => (
                    <NativeSelectOption key={value} value={String(value)}>
                      {t("extensions.multiplier", { value })}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            ) : (
              <div className="flex max-h-72 flex-col gap-3 overflow-y-auto">
                <p className="text-muted-foreground text-xs">{t("extensions.dialog.customHint")}</p>
                <QueryState query={limits} rows={2}>
                  {({ limits: items }) => (
                    <>
                      {items.map((item: LimitItem) => (
                        <div key={item.key} className="grid grid-cols-[1fr_auto] items-center gap-2">
                          <Label htmlFor={`ext-${item.key}`} className="text-xs">
                            {item.key}
                          </Label>
                          <Input
                            id={`ext-${item.key}`}
                            inputMode="numeric"
                            className="w-28 text-end tabular-nums"
                            value={custom[item.key] ?? ""}
                            onChange={(event) => setCustom({ ...custom, [item.key]: event.target.value })}
                          />
                        </div>
                      ))}
                    </>
                  )}
                </QueryState>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ext-expires">{t("extensions.dialog.expires")}</Label>
              <Input
                id="ext-expires"
                type="date"
                value={expires}
                onChange={(event) => setExpires(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ext-note">{t("extensions.dialog.note")}</Label>
              <Input id="ext-note" value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} />
            </div>
            {formError ? (
              <p role="alert" className="text-destructive text-sm">
                {formError}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ext-search">{t("extensions.dialog.search")}</Label>
              <Input id="ext-search" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            {query.length >= 2 && found.data && found.data.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("extensions.dialog.noResults")}</p>
            ) : null}
            <ul className="flex flex-col">
              {(found.data?.items ?? []).map((candidate) => (
                <li key={candidate.id}>
                  <button
                    type="button"
                    className="hover:bg-muted flex w-full flex-col rounded-md px-2 py-2 text-start text-sm"
                    onClick={() => setStudent(candidate)}
                  >
                    <span className="font-medium">{candidate.name}</span>
                    {candidate.login ? <span className="text-muted-foreground text-xs">{candidate.login}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <DialogFooter>
          <Button type="button" onClick={submit} disabled={!student || save.isPending}>
            {t("extensions.dialog.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
