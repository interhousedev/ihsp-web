"use client"

import { ApiError, keys, postAdminLegalPublish, putAdminLegalDraft, type LegalKind } from "@ihsp/api"
import { LegalDocumentView } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  FieldLabel,
  Input,
  LoadingButton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"
import { formFrom, LEGAL_LOCALES, type LegalEditorLocale, type LegalForm, type LegalKindState } from "../utils"

type LegalEditorProps = { state: LegalKindState; onClose: () => void }

function LocalePane({
  locale,
  form,
  onChange,
}: {
  locale: LegalEditorLocale
  form: LegalForm
  onChange: (field: keyof LegalForm, value: string) => void
}) {
  const t = useT("legal")
  const id = useId()
  return (
    <div className="grid gap-4 pt-4 lg:grid-cols-2">
      <div className="grid content-start gap-3">
        <div className="grid gap-2">
          <FieldLabel htmlFor={`${id}-title`}>{t("editor.title")}</FieldLabel>
          <Input id={`${id}-title`} value={form.title[locale]} onChange={(e) => onChange("title", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <FieldLabel htmlFor={`${id}-body`}>{t("editor.body")}</FieldLabel>
          <Textarea
            id={`${id}-body`}
            rows={14}
            className="font-mono text-sm"
            value={form.body[locale]}
            onChange={(e) => onChange("body", e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <FieldLabel htmlFor={`${id}-announcement`}>{t("editor.announcement")}</FieldLabel>
          <Textarea
            id={`${id}-announcement`}
            rows={4}
            className="font-mono text-sm"
            value={form.announcement[locale]}
            onChange={(e) => onChange("announcement", e.target.value)}
          />
        </div>
      </div>
      <div className="grid content-start gap-2">
        <p className="text-sm font-medium">{t("editor.preview")}</p>
        <div className="max-h-[32rem] overflow-y-auto rounded-md border p-3" data-testid={`legal-preview-${locale}`}>
          <LegalDocumentView markdown={form.body[locale]} className="text-sm" />
        </div>
      </div>
    </div>
  )
}

/** Edits the draft of one kind in uz, ru and en; publishing makes every user accept the new version again. */
export function LegalEditor({ state, onClose }: LegalEditorProps) {
  const t = useT("legal")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<LegalForm>(() => formFrom(state.draft ?? state.published))
  const [locale, setLocale] = useState<LegalEditorLocale>("uz")
  const [confirming, setConfirming] = useState(false)
  const kind: LegalKind = state.kind

  const refresh = () => queryClient.invalidateQueries({ queryKey: keys.legal.all() })
  const save = useMutation({
    mutationFn: () =>
      putAdminLegalDraft(kind, {
        title: form.title,
        body_markdown: form.body,
        announcement: LEGAL_LOCALES.some((code) => form.announcement[code].trim() !== "") ? form.announcement : null,
      }),
    onSuccess: refresh,
  })
  const publish = useMutation({
    mutationFn: () => postAdminLegalPublish(kind),
    onSuccess: async () => {
      setConfirming(false)
      await refresh()
      onClose()
    },
    onError: () => setConfirming(false),
  })

  const error = publish.error ?? save.error
  const message = error
    ? error instanceof ApiError && error.type === "legal/no-draft"
      ? t("errors.noDraft")
      : errorMessage(error)
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("editor.heading", { kind: t(`kinds.${kind}`) })}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Tabs value={locale} onValueChange={(value) => setLocale(value as LegalEditorLocale)}>
          <TabsList aria-label={t("editor.locale")}>
            {LEGAL_LOCALES.map((code) => (
              <TabsTrigger key={code} value={code}>
                {code.toUpperCase()}
              </TabsTrigger>
            ))}
          </TabsList>
          {LEGAL_LOCALES.map((code) => (
            <TabsContent key={code} value={code}>
              <LocalePane
                locale={code}
                form={form}
                onChange={(field, value) =>
                  setForm((current) => ({ ...current, [field]: { ...current[field], [code]: value } }))
                }
              />
            </TabsContent>
          ))}
        </Tabs>
        {message ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        {save.isSuccess && !error ? <p className="text-sm text-muted-foreground">{t("editor.saved")}</p> : null}
        <div className="flex flex-wrap gap-2">
          <LoadingButton
            type="button"
            variant="outline"
            loading={save.isPending}
            loadingLabel={t("editor.saving")}
            onClick={() => save.mutate()}
          >
            {t("editor.saveDraft")}
          </LoadingButton>
          <Button type="button" disabled={!state.draft && !save.isSuccess} onClick={() => setConfirming(true)}>
            {t("editor.publish")}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("editor.close")}
          </Button>
        </div>
      </CardContent>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("publishTitle", { kind: t(`kinds.${kind}`) })}
        description={t("publishText")}
        confirmLabel={t("publishConfirm")}
        destructive
        loading={publish.isPending}
        onConfirm={() => publish.mutate()}
      />
    </Card>
  )
}
