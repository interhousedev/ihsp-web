"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons, Input, Label, PageHeader, StateView, Textarea, safeHttpUrl } from "@ihsp/ui"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useState, type FormEvent } from "react"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useHelpAction, useHelpDetail, useRespond, type HelpAction, type HelpDetail } from "../api"
import { PROOF_URL_MAX, validateProofUrl } from "../lib/proof-url"
import { HelpStatusBadge, useValueLabel } from "./status-badges"

/** Statuses from which the student may still cancel, per the backend state machine. */
const CANCELLABLE: Record<string, true> = { open: true, assigned: true, accepted: true }

function RespondForm({ id }: { id: string }) {
  const t = useT("help")
  const errorMessage = useErrorMessage()
  const respond = useRespond()
  const [text, setText] = useState("")
  const [url, setUrl] = useState("")
  const [error, setError] = useState<unknown>(null)
  const problem = url.trim() ? validateProofUrl(url) : null

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!text.trim() || problem) return
    setError(null)
    try {
      await respond.mutateAsync({ id, text: text.trim(), url: url.trim() || null })
      setText("")
      setUrl("")
    } catch (e) {
      setError(e)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="respond-text">{t("respond.text")}</Label>
        <Textarea id="respond-text" value={text} onChange={(event) => setText(event.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="respond-url">{t("respond.url")}</Label>
        <Input
          id="respond-url"
          type="url"
          inputMode="url"
          maxLength={PROOF_URL_MAX}
          placeholder="https://"
          value={url}
          aria-invalid={problem !== null}
          onChange={(event) => setUrl(event.target.value)}
        />
        {problem ? (
          <p role="alert" className="text-destructive text-sm">
            {t(`proof.problem_${problem}`)}
          </p>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(error)}
        </p>
      ) : null}
      <Button type="submit" className="self-start" disabled={respond.isPending || !text.trim() || problem !== null}>
        <Icons.send aria-hidden />
        {t("respond.send")}
      </Button>
    </form>
  )
}

function Actions({ detail }: { detail: HelpDetail }) {
  const t = useT("help")
  const errorMessage = useErrorMessage()
  const action = useHelpAction()
  const { request, as_helper: asHelper } = detail
  const [error, setError] = useState<unknown>(null)

  async function run(name: HelpAction) {
    setError(null)
    try {
      await action.mutateAsync({ id: request.id, action: name })
    } catch (e) {
      setError(e)
    }
  }

  const button = (name: HelpAction, variant: "default" | "outline" = "outline") => (
    <Button type="button" variant={variant} disabled={action.isPending} onClick={() => run(name)}>
      {t(`action.${name}`)}
    </Button>
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {asHelper && request.status === "assigned" ? (
          <>
            {button("accept", "default")}
            {button("decline")}
          </>
        ) : null}
        {asHelper && request.status === "accepted" ? button("deliver", "default") : null}
        {!asHelper && request.status === "delivered" ? button("close", "default") : null}
        {!asHelper && CANCELLABLE[request.status] ? button("cancel") : null}
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(error)}
        </p>
      ) : null}
    </div>
  )
}

function Detail({ id }: { id: string }) {
  const t = useT("help")
  const fmt = useFormatters()
  const kindLabel = useValueLabel("kind")
  const query = useHelpDetail(id)

  if (query.isPending) return <StateView state="loading" />
  if (query.isError) return <StateView state="error" error={query.error} onRetry={() => query.refetch()} />
  const detail = query.data
  const { request } = detail

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={kindLabel(request.kind)} actions={<HelpStatusBadge status={request.status} />} />
      <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{request.brief}</p>
      <Actions detail={detail} />
      {detail.as_helper && detail.activities ? (
        <section aria-labelledby="help-activities" className="flex flex-col gap-2">
          <h2 id="help-activities" className="font-semibold">
            {t("detail.activities")}
          </h2>
          <ul className="flex flex-col gap-2">
            {detail.activities.map((activity, index) => (
              <li key={index} className="border-hairline rounded-card border p-3">
                <p className="font-medium">{activity.position}</p>
                <p className="text-muted-foreground text-sm">{activity.org}</p>
                <p className="text-sm">{activity.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section aria-labelledby="help-responses" className="flex flex-col gap-2">
        <h2 id="help-responses" className="font-semibold">
          {t("detail.responses")}
        </h2>
        {detail.responses.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("detail.noResponses")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {detail.responses.map((response) => {
              const href = safeHttpUrl(response.url)
              return (
                <li key={response.id} className="border-hairline flex flex-col gap-1 rounded-card border p-3">
                  <p className="text-muted-foreground text-xs">
                    {response.from_guest ? t("detail.fromGuest") : t("detail.fromHelper")} ·{" "}
                    {fmt.dateTime(new Date(response.created_at))}
                  </p>
                  <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{response.text}</p>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-4 hover:underline"
                    >
                      {href}
                    </a>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>
      {detail.as_helper && request.status === "accepted" ? <RespondForm id={request.id} /> : null}
    </div>
  )
}

function DetailFromUrl() {
  const t = useT("help")
  const id = useSearchParams().get("id")
  if (!id) {
    return (
      <StateView state="empty" title={t("detail.missing")} action={<Link href="/help/">{t("detail.back")}</Link>} />
    )
  }
  return <Detail id={id} />
}

export function HelpRequestPage() {
  return (
    <AdmissionShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
        <Suspense fallback={<StateView state="loading" />}>
          <DetailFromUrl />
        </Suspense>
      </div>
    </AdmissionShell>
  )
}
