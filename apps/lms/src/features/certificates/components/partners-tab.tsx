"use client"

import {
  certAssetUrl,
  certKeys,
  deleteCertPartner,
  getCertPartnersQuery,
  postCertPartner,
  postCertPartnerLogo,
  putCertPartner,
  putCertSettings,
  type CertPartner,
  type CertPartnerBody,
  type CertSettings,
} from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Icons,
  Input,
  Label,
  LoadingButton,
  Switch,
} from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useRef, useState } from "react"
import { toast } from "sonner"

const LOGO_TYPES = "image/png,image/jpeg,image/svg+xml,image/webp"
const NAME_MAX = 120

type Draft = { id: string | null; body: CertPartnerBody; file: File | null }

/** Partners: organisations shown on the certificate and the course landing; co-issued ones sign it with the lyceum. */
export function PartnersTab({ courseId, settings }: { courseId: string; settings: CertSettings }) {
  const t = useT("courseCertificates")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const partners = useQuery(getCertPartnersQuery(courseId))
  const [editing, setEditing] = useState<Draft | null>(null)
  const [removing, setRemoving] = useState<CertPartner | null>(null)

  const shown = useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      putCertSettings(courseId, {
        ...settings,
        partner_ids: on ? [...settings.partner_ids, id] : settings.partner_ids.filter((p) => p !== id),
      }),
    onSuccess: (next) => queryClient.setQueryData(certKeys.settings(courseId), next),
    onError: (error) => toast.error(errorMessage(error)),
  })
  const remove = useMutation({
    mutationFn: (partner: CertPartner) => deleteCertPartner(courseId, partner.id),
    onSuccess: () => {
      setRemoving(null)
      void queryClient.invalidateQueries({ queryKey: certKeys.all(courseId) })
      toast.success(t("partners.deleted"))
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">{t("partners.hint")}</p>
        {editing ? null : (
          <Button
            type="button"
            onClick={() => setEditing({ id: null, body: { name: "", url: null, co_issued: false }, file: null })}
            className="min-h-11 md:min-h-8"
          >
            <Icons.add aria-hidden />
            {t("partners.add")}
          </Button>
        )}
      </div>
      {editing ? (
        <PartnerForm
          key={editing.id ?? "new"}
          courseId={courseId}
          settings={settings}
          initial={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
      <QueryState query={partners} rows={2}>
        {({ items }) =>
          items.length === 0 ? (
            <p className="text-muted-foreground rounded-card border border-dashed p-4 text-sm">{t("partners.empty")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((partner) => (
                <li key={partner.id}>
                  <Card>
                    <CardContent className="flex flex-wrap items-center gap-3">
                      <PartnerLogo partner={partner} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="font-semibold break-words">{partner.name}</span>
                        {partner.url ? (
                          <a
                            href={partner.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground truncate text-xs underline"
                          >
                            {partner.url}
                          </a>
                        ) : null}
                        {partner.co_issued ? (
                          <span className="text-xs font-medium">{t("partners.coIssuedBadge")}</span>
                        ) : null}
                      </div>
                      <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
                        <Switch
                          checked={settings.partner_ids.includes(partner.id)}
                          disabled={shown.isPending}
                          onCheckedChange={(on) => shown.mutate({ id: partner.id, on })}
                        />
                        {t("partners.onCertificate")}
                      </label>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-h-11 md:min-h-8"
                          onClick={() =>
                            setEditing({
                              id: partner.id,
                              body: { name: partner.name, url: partner.url, co_issued: partner.co_issued },
                              file: null,
                            })
                          }
                        >
                          {t("partners.edit")}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive min-h-11 md:min-h-8"
                          onClick={() => setRemoving(partner)}
                        >
                          {t("partners.delete")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )
        }
      </QueryState>
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => (open ? null : setRemoving(null))}
        title={t("partners.deleteTitle", { name: removing?.name ?? "" })}
        description={t("partners.deleteHint")}
        confirmLabel={t("partners.delete")}
        destructive
        loading={remove.isPending}
        onConfirm={() => (removing ? remove.mutate(removing) : undefined)}
      />
    </div>
  )
}

export function PartnerLogo({ partner }: { partner: { name: string; logo_url: string | null } }) {
  return partner.logo_url ? (
    <img
      src={certAssetUrl(partner.logo_url)}
      alt=""
      className="size-12 shrink-0 rounded-md border bg-white object-contain p-1"
    />
  ) : (
    <span
      aria-hidden
      className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-md text-lg font-semibold"
    >
      {partner.name.slice(0, 1).toUpperCase()}
    </span>
  )
}

function PartnerForm({
  courseId,
  settings,
  initial,
  onClose,
}: {
  courseId: string
  settings: CertSettings
  initial: Draft
  onClose: () => void
}) {
  const t = useT("courseCertificates")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<Draft>(initial)
  const fileInput = useRef<HTMLInputElement>(null)
  const ids = { name: useId(), url: useId(), co: useId() }
  const url = draft.body.url?.trim() ?? ""
  const urlInvalid = url !== "" && !/^https?:\/\/\S+$/i.test(url)

  const save = useMutation({
    mutationFn: async () => {
      const body = { ...draft.body, name: draft.body.name.trim(), url: url || null }
      let partner = draft.id ? await putCertPartner(courseId, draft.id, body) : await postCertPartner(courseId, body)
      if (draft.file) partner = await postCertPartnerLogo(courseId, partner.id, draft.file)
      if (!draft.id) {
        const next = await putCertSettings(courseId, {
          ...settings,
          partner_ids: [...settings.partner_ids, partner.id],
        })
        queryClient.setQueryData(certKeys.settings(courseId), next)
      }
      return partner
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: certKeys.partners(courseId) })
      toast.success(t("partners.saved"))
      onClose()
    },
  })

  return (
    <Card>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate()
          }}
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor={ids.name}>{t("partners.name")}</Label>
            <Input
              id={ids.name}
              required
              maxLength={NAME_MAX}
              value={draft.body.name}
              onChange={(e) => setDraft({ ...draft, body: { ...draft.body, name: e.target.value } })}
              className="min-h-11 md:min-h-9"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={ids.url}>{t("partners.url")}</Label>
            <Input
              id={ids.url}
              type="url"
              inputMode="url"
              placeholder="https://"
              value={draft.body.url ?? ""}
              aria-invalid={urlInvalid}
              onChange={(e) => setDraft({ ...draft, body: { ...draft.body, url: e.target.value } })}
              className="min-h-11 md:min-h-9"
            />
            {urlInvalid ? <p className="text-destructive text-xs">{t("partners.urlInvalid")}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInput}
              type="file"
              accept={LOGO_TYPES}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => setDraft({ ...draft, file: e.target.files?.[0] ?? null })}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInput.current?.click()}
              className="min-h-11 md:min-h-8"
            >
              <Icons.upload aria-hidden />
              {t("partners.logo")}
            </Button>
            <span className="text-muted-foreground min-w-0 truncate text-xs">
              {draft.file?.name ?? t("partners.logoHint")}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor={ids.co}>{t("partners.coIssued")}</Label>
              <p className="text-muted-foreground text-xs">{t("partners.coIssuedHint")}</p>
            </div>
            <Switch
              id={ids.co}
              checked={draft.body.co_issued}
              onCheckedChange={(co_issued) => setDraft({ ...draft, body: { ...draft.body, co_issued } })}
            />
          </div>
          {save.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(save.error)}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex gap-2">
            <LoadingButton
              type="submit"
              loading={save.isPending}
              disabled={draft.body.name.trim() === "" || urlInvalid}
              className="min-h-11 md:min-h-9"
            >
              {t("save")}
            </LoadingButton>
            <Button type="button" variant="ghost" onClick={onClose} className="min-h-11 md:min-h-9">
              {t("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
