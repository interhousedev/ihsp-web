"use client"

import { isApiError, keys } from "@ihsp/api"
import { logout, useSession } from "@ihsp/auth"
import { LegalDocumentView, useRefetchOnAcceptanceRequired } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  Button,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  SlideToAgree,
} from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"
import { acceptLegal, pendingQuery, type PendingItem } from "../api"

const DISCLAIMER = "admission_disclaimer"
const itemKey = (item: PendingItem) => `${item.kind}-${item.version}`

function DocumentRow({
  item,
  checked,
  onChange,
  disabled,
}: {
  item: PendingItem
  checked: boolean
  onChange: (checked: boolean) => void
  disabled: boolean
}) {
  const t = useT("consent")
  const labelId = useId()
  return (
    <li className="grid gap-1.5">
      <div className="flex items-start gap-2.5">
        <Checkbox
          className="mt-0.5"
          aria-labelledby={labelId}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(value) => onChange(value === true)}
        />
        <span id={labelId} className="text-sm">
          {t("accept", { title: item.title })}
          {item.previously_accepted_version !== null ? (
            <span className="text-muted-foreground"> · {t("updated", { version: item.version })}</span>
          ) : null}
        </span>
      </div>
      {item.announcement ? <LegalDocumentView markdown={item.announcement} className="pl-6.5 text-xs" /> : null}
      <Collapsible className="pl-6.5">
        <CollapsibleTrigger className="text-primary text-xs underline-offset-4 hover:underline">
          {t("read")}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 max-h-56 overflow-y-auto rounded-md border p-3">
            <LegalDocumentView markdown={item.body_markdown} className="text-sm" />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}

/**
 * Blocks the signed-in user until every pending document of this app is accepted: one checkbox per document, a
 * guardian attestation for minors (the server decides whether it is required) and, when the disclaimer is pending,
 * a slide-to-agree as the last step. It shows again whenever the API reports a newer version.
 */
export function AdmissionConsentGate() {
  const { status } = useSession()
  const t = useT("consent")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const authenticated = status === "authenticated"
  const pending = useQuery({ ...pendingQuery(), enabled: authenticated })
  useRefetchOnAcceptanceRequired(authenticated)
  const [ticked, setTicked] = useState<string[]>([])
  const [guardian, setGuardian] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const guardianId = useId()

  const items = pending.data?.items ?? []
  const disclaimer = items.find((item) => item.kind === DISCLAIMER)
  const documents = items.filter((item) => item.kind !== DISCLAIMER)
  const ready = documents.every((item) => ticked.includes(itemKey(item)))

  const accept = useMutation({
    mutationFn: () =>
      acceptLegal({
        items: items.map(({ kind, version, app_scope }) => ({ kind, version, app_scope })),
        guardian_attested: guardian,
      }),
    onSuccess: (remaining) => queryClient.setQueryData(keys.legal.pending(), remaining),
    onError: (error) => {
      setAttempt((value) => value + 1)
      // A newer version was published meanwhile: show the fresh list instead of accepting a stale one.
      if (isApiError(error) && error.type === "legal/stale-version") {
        void queryClient.invalidateQueries({ queryKey: keys.legal.pending() })
      }
    },
  })

  if (!authenticated || items.length === 0) return null

  function toggle(item: PendingItem, checked: boolean) {
    const key = itemKey(item)
    setTicked((current) =>
      checked ? [...current.filter((value) => value !== key), key] : current.filter((value) => value !== key),
    )
  }

  return (
    <Dialog open onOpenChange={() => undefined} disablePointerDismissal>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <ul className="grid gap-4" aria-label={t("title")}>
          {documents.map((item) => (
            <DocumentRow
              key={itemKey(item)}
              item={item}
              checked={ticked.includes(itemKey(item))}
              onChange={(checked) => toggle(item, checked)}
              disabled={accept.isPending}
            />
          ))}
        </ul>
        <div className="flex items-start gap-2.5">
          <Checkbox
            className="mt-0.5"
            aria-labelledby={guardianId}
            checked={guardian}
            disabled={accept.isPending}
            onCheckedChange={(value) => setGuardian(value === true)}
          />
          <span id={guardianId} className="text-sm">
            {t("guardian")}
          </span>
        </div>
        {disclaimer ? (
          <section className="grid gap-2" aria-label={disclaimer.title}>
            <h3 className="text-sm font-medium">{disclaimer.title}</h3>
            <div className="max-h-48 overflow-y-auto rounded-md border p-3">
              <LegalDocumentView markdown={disclaimer.body_markdown} className="text-sm" />
            </div>
            <p className="text-muted-foreground text-xs">{ready ? t("slideHint") : t("tickFirst")}</p>
            <SlideToAgree
              key={attempt}
              label={t("slide")}
              doneLabel={t("slideDone")}
              disabled={!ready || accept.isPending}
              onAgree={() => accept.mutate()}
            />
          </section>
        ) : null}
        {accept.isError ? <Alert variant="destructive">{errorMessage(accept.error)}</Alert> : null}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => void logout()}>
            {t("signOut")}
          </Button>
          {disclaimer ? null : (
            <Button type="button" disabled={!ready || accept.isPending} onClick={() => accept.mutate()}>
              {t("continue")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
