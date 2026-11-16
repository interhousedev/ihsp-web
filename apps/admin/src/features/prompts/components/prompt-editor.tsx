"use client"

import {
  getAdminPromptQuery,
  keys,
  putAdminPrompt,
  revertAdminPrompt,
  type PromptBody,
  type PromptDetail,
  type PromptLocale,
  type PromptVersion,
} from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Input,
  Label,
  Textarea,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { SelectField } from "../../shared/components/select-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { PROMPT_LOCALES } from "../utils"
import { PromptDiff } from "./prompt-diff"
import { PromptHistory } from "./prompt-history"

/** One slot: the text in force for a locale, the history and a diff against the built-in text. */
export function PromptEditor({ task, name }: { task: string; name: string }) {
  const t = useT("prompts")
  const [locale, setLocale] = useState<PromptLocale>("")
  const query = useQuery(getAdminPromptQuery({ task, name, locale: locale || undefined }))
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">
          {task} / {name}
        </CardTitle>
        <SelectField
          aria-label={t("editor.locale")}
          className="w-40"
          value={locale}
          onChange={(value) => setLocale(value as PromptLocale)}
          options={PROMPT_LOCALES.map((value) => ({
            value,
            label: value === "" ? t("locales.all") : t(`locales.${value}`),
          }))}
        />
      </CardHeader>
      <CardContent>
        <QueryState query={query} rows={4}>
          {(detail) => (
            <EditorForm key={`${detail.hash}:${detail.version}:${locale}`} detail={detail} locale={locale} />
          )}
        </QueryState>
      </CardContent>
    </Card>
  )
}

function EditorForm({ detail, locale }: { detail: PromptDetail; locale: PromptLocale }) {
  const t = useT("prompts")
  const [text, setText] = useState(detail.text)
  const [note, setNote] = useState("")
  const [reverting, setReverting] = useState(false)
  const ref = { task: detail.task, name: detail.name }
  const save = useAdminMutation<PromptBody, PromptVersion>({
    mutationFn: (body) => putAdminPrompt(ref, body),
    invalidate: [keys.admin.prompts.all()],
    success: (data) => t("editor.saved", { version: data.version }),
    inlineError: true,
    onSuccess: () => setNote(""),
  })
  const revert = useAdminMutation({
    mutationFn: () => revertAdminPrompt({ ...ref, locale: locale || undefined }),
    invalidate: [keys.admin.prompts.all()],
    success: t("editor.reverted"),
    onSuccess: () => setReverting(false),
  })
  const missing = detail.placeholders.filter((placeholder) => !text.includes(placeholder))
  const changed = text !== detail.text
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">{detail.summary}</p>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="secondary">
          {detail.version === 0 ? t("editor.builtin") : t("history.version", { version: detail.version })}
        </Badge>
        {detail.placeholders.map((placeholder) => (
          <code key={placeholder} className="bg-muted rounded px-1.5 py-0.5">
            {placeholder}
          </code>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="prompt-text">{t("editor.text")}</Label>
        <Textarea
          id="prompt-text"
          rows={14}
          className="font-mono text-xs"
          value={text}
          maxLength={50000}
          onChange={(event) => setText(event.target.value)}
        />
        {missing.length > 0 ? (
          <p role="alert" className="text-destructive text-xs">
            {t("editor.missingPlaceholders", { list: missing.join(", ") })}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="prompt-note">{t("editor.note")}</Label>
        <Input id="prompt-note" value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {save.isError ? (
          <span role="alert" className="text-destructive text-sm">
            {t("editor.failed")}
          </span>
        ) : null}
        <Button
          type="button"
          variant="outline"
          disabled={detail.version === 0 || revert.isPending}
          onClick={() => setReverting(true)}
        >
          {t("editor.revert")}
        </Button>
        <Button
          type="button"
          disabled={save.isPending || !changed || text.trim() === ""}
          onClick={() => save.mutate({ text, note, locale })}
        >
          {t("editor.save")}
        </Button>
      </div>
      <section aria-labelledby="prompt-diff" className="flex flex-col gap-2">
        <h3 id="prompt-diff" className="text-sm font-semibold">
          {t("diff.title")}
        </h3>
        <PromptDiff builtin={detail.builtin} text={text} />
      </section>
      <section aria-labelledby="prompt-history" className="flex flex-col gap-2">
        <h3 id="prompt-history" className="text-sm font-semibold">
          {t("history.title")}
        </h3>
        <PromptHistory detail={detail} />
      </section>
      <ConfirmDialog
        open={reverting}
        onOpenChange={setReverting}
        title={t("editor.revertTitle")}
        description={t("editor.revertDescription")}
        confirmLabel={t("editor.revertConfirm")}
        destructive
        loading={revert.isPending}
        onConfirm={() => revert.mutate()}
      />
    </div>
  )
}
