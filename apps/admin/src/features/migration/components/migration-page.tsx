"use client"

import {
  getAdminMigrationQuery,
  keys,
  postAdminMigrationRollback,
  postAdminMigrationStart,
  type MigrationStatus,
} from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { CodeInput, ErrorAlert, StepUpSender } from "@ihsp/features-core/id-account"
import { useFormatters, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  FieldLabel,
  Input,
  LoadingButton,
  PageContainer,
} from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"

const POLL_MS = 3000
/** While the runner works (or is asked to stop) the page follows its progress. */
const ACTIVE = new Set(["queued", "running", "cancelling"])

function useStatusMutation<V>(mutationFn: (variables: V) => Promise<MigrationStatus>, onDone?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (next) => {
      queryClient.setQueryData(keys.admin.migration(), next)
      void queryClient.invalidateQueries({ queryKey: keys.public.maintenance() })
      onDone?.()
    },
  })
}

/** A step-up code with its sender, as the two dangerous actions ask for it. */
function StepUpCode({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return (
    <div className="grid gap-3">
      <CodeInput value={value} onChange={onChange} label={label} />
      <StepUpSender />
    </div>
  )
}

function StartForm() {
  const t = useT("migration")
  const ids = { host: useId(), port: useId(), url: useId(), token: useId() }
  const [confirm, setConfirm] = useState(false)
  const [form, setForm] = useState({ host: "", port: "22", url: "", token: "" })
  const [code, setCode] = useState("")
  const start = useStatusMutation(postAdminMigrationStart, () => {
    setConfirm(false)
    setForm((value) => ({ ...value, token: "" }))
    setCode("")
  })
  const ready = form.host.trim() !== "" && form.token.trim() !== "" && Number(form.port) > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("form.title")}</CardTitle>
        <CardDescription>{t("form.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          autoComplete="off"
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (ready) setConfirm(true)
          }}
        >
          <div className="grid gap-2">
            <FieldLabel htmlFor={ids.host}>{t("form.host")}</FieldLabel>
            <Input
              id={ids.host}
              value={form.host}
              onChange={(event) => setForm({ ...form, host: event.target.value })}
              spellCheck={false}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor={ids.port}>{t("form.port")}</FieldLabel>
            <Input
              id={ids.port}
              inputMode="numeric"
              value={form.port}
              onChange={(event) => setForm({ ...form, port: event.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor={ids.url}>{t("form.url")}</FieldLabel>
            <Input
              id={ids.url}
              type="url"
              placeholder="https://"
              value={form.url}
              onChange={(event) => setForm({ ...form, url: event.target.value })}
              spellCheck={false}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor={ids.token}>{t("form.token")}</FieldLabel>
            <Input
              id={ids.token}
              type="password"
              autoComplete="off"
              value={form.token}
              onChange={(event) => setForm({ ...form, token: event.target.value })}
              spellCheck={false}
            />
          </div>
          <div>
            <Button type="submit" disabled={!ready}>
              {t("form.start")}
            </Button>
          </div>
        </form>
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title={t("form.confirmTitle")}
          description={t("form.confirmDescription")}
          confirmLabel={t("form.start")}
          destructive
          loading={start.isPending}
          onConfirm={() =>
            start.mutate({
              target_host: form.host.trim(),
              target_port: Number(form.port),
              target_url: form.url.trim() === "" ? null : form.url.trim(),
              pairing_token: form.token.trim(),
              otp_code: code,
            })
          }
        >
          <StepUpCode value={code} onChange={setCode} label={t("form.code")} />
          <ErrorAlert error={start.error} />
        </ConfirmDialog>
      </CardContent>
    </Card>
  )
}

function RollbackButton() {
  const t = useT("migration")
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const rollback = useStatusMutation(postAdminMigrationRollback, () => {
    setOpen(false)
    setCode("")
  })
  return (
    <>
      <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
        {t("rollback.button")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("rollback.title")}
        description={t("rollback.description")}
        confirmLabel={t("rollback.confirm")}
        destructive
        loading={rollback.isPending}
        onConfirm={() => rollback.mutate({ otp_code: code })}
      >
        <StepUpCode value={code} onChange={setCode} label={t("rollback.code")} />
        <ErrorAlert error={rollback.error} />
      </ConfirmDialog>
    </>
  )
}

function StepList({ data }: { data: MigrationStatus }) {
  const t = useT("migration")
  return (
    <ol className="grid gap-2" aria-label={t("steps")}>
      {data.steps.map((step) => {
        const state = step.state === "running" && data.phase === "failed" ? "failed" : step.state
        return (
          <li key={step.key} data-testid={`step-${step.key}`} className="flex flex-wrap items-center gap-2 text-sm">
            <span>{t(`stepName.${step.key}`)}</span>
            <Badge variant={state === "failed" ? "destructive" : state === "done" ? "secondary" : "outline"}>
              {t(`stepState.${state}`)}
            </Badge>
          </li>
        )
      })}
    </ol>
  )
}

function Progress({ data }: { data: MigrationStatus }) {
  const t = useT("migration")
  const format = useFormatters()
  const phase = data.phase
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {t("status")}
          <Badge data-testid="migration-phase" variant={phase === "failed" ? "destructive" : "secondary"}>
            {t(`phase.${phase}`)}
          </Badge>
          {data.dry_run ? <Badge variant="outline">{t("dryRun")}</Badge> : null}
        </CardTitle>
        <CardDescription>
          {data.target_host ? t("target", { host: data.target_host, port: data.target_port ?? 22 }) : null}
          {data.requested_at ? ` · ${t("since", { date: format.dateTime(data.requested_at) })}` : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm">{t("readOnly")}</p>
        {data.stale ? (
          <Alert role="alert">
            <AlertDescription>{t("stale")}</AlertDescription>
          </Alert>
        ) : null}
        {phase === "failed" ? (
          <Alert variant="destructive" role="alert">
            <AlertTitle>{t("failedTitle")}</AlertTitle>
            {data.error ? <AlertDescription>{data.error}</AlertDescription> : null}
          </Alert>
        ) : null}
        {phase === "completed" ? (
          <Alert data-testid="migration-completed">
            <AlertTitle>{t("completedTitle")}</AlertTitle>
            <AlertDescription>
              <p>{t("completedDescription")}</p>
              {data.target_url ? (
                <a
                  href={data.target_url}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm" }) + " mt-2"}
                >
                  {t("openTarget")}
                </a>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}
        <StepList data={data} />
        {phase !== "cancelling" ? (
          <div>
            <RollbackButton />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

/** Server migration: start it with a pairing token and a step-up code, follow the runner's steps, roll it back. */
export function MigrationPage() {
  const t = useT("migration")
  const status = useQuery({
    ...getAdminMigrationQuery(),
    refetchInterval: (query) => (ACTIVE.has(query.state.data?.phase ?? "") ? POLL_MS : false),
  })
  return (
    <PageContainer title={t("title")}>
      <QueryState query={status} rows={3}>
        {(data) => (
          <>
            {data.configured ? null : (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{t("notConfigured")}</AlertDescription>
              </Alert>
            )}
            {data.phase === "idle" ? data.configured ? <StartForm /> : null : <Progress data={data} />}
          </>
        )}
      </QueryState>
    </PageContainer>
  )
}
