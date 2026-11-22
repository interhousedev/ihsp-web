"use client"

import {
  ApiError,
  getAdminEssayKeysStatusQuery,
  keys,
  postAdminEssayKeysBackup,
  postAdminEssayKeysRestore,
  postAdminEssayKeysRotate,
  type EssayKeysRestoreResult,
  type EssayKeysStatus,
} from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  FieldLabel,
  Input,
  LoadingButton,
  PageContainer,
  Progress,
} from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useRef, useState } from "react"
import { downloadBlob } from "../../shared/utils/csv"

const MIN_PASSPHRASE = 12
const POLL_MS = 3000

const STATE_KEYS = {
  idle: "status.state.idle",
  running: "status.state.running",
  done: "status.state.done",
  failed: "status.state.failed",
} as const

const ERROR_KEYS: Record<string, string> = {
  "admission/essay_keys_backup_taken": "errors.backupTaken",
  "admission/essay_keys_backup_invalid": "errors.backupInvalid",
  "admission/essay_keys_rotation_running": "errors.rotationRunning",
}

function useKnownError(error: unknown): string | null {
  const t = useT("essayKeys")
  const message = useErrorMessage()
  if (!error) return null
  const key = error instanceof ApiError ? ERROR_KEYS[error.type] : undefined
  return key ? t(key) : message(error)
}

/** Essay keys: the status of the admission essay encryption keys, their one-time backup, restore and rotation. */
export function EssayKeysPage() {
  const t = useT("essayKeys")
  const status = useQuery({
    ...getAdminEssayKeysStatusQuery(),
    refetchInterval: (query) => (query.state.data?.rotation.state === "running" ? POLL_MS : false),
  })
  return (
    <PageContainer title={t("title")}>
      <QueryState query={status} rows={3}>
        {(data) => (
          <>
            <StatusCard data={data} />
            <BackupCard />
            <RestoreCard />
            <RotateCard data={data} />
          </>
        )}
      </QueryState>
    </PageContainer>
  )
}

function StatusCard({ data }: { data: EssayKeysStatus }) {
  const t = useT("essayKeys")
  const f = useFormatters()
  const { rotation } = data
  const percent = rotation.total > 0 ? Math.round((rotation.done / rotation.total) * 100) : 0
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("status.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t("status.students")}</dt>
            <dd data-testid="essay-keys-students" className="font-medium">
              {data.students_with_keys ?? t("status.unknown")}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("status.generation")}</dt>
            <dd data-testid="essay-keys-generation" className="font-medium">
              {data.generation}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">{t("status.backup")}</dt>
            <dd data-testid="essay-keys-backup" className="font-medium">
              {data.exported_at
                ? t("status.backupAt", { at: f.dateTime(data.exported_at), by: data.exported_by ?? "—" })
                : t("status.noBackup")}
            </dd>
          </div>
        </dl>
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">{t("status.rotation")}</span>
            <Badge variant={rotation.state === "failed" ? "destructive" : "secondary"}>
              {t(STATE_KEYS[rotation.state])}
            </Badge>
          </div>
          {rotation.state === "running" || rotation.state === "done" ? (
            <>
              <Progress value={percent} aria-label={t("status.rotation")} data-testid="essay-keys-progress" />
              <p className="text-muted-foreground">
                {t("status.progress", { done: rotation.done, total: rotation.total })}
              </p>
            </>
          ) : null}
          {rotation.unreadable > 0 ? (
            <p className="text-destructive">{t("status.unreadable", { count: rotation.unreadable })}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function BackupCard() {
  const t = useT("essayKeys")
  const queryClient = useQueryClient()
  const passId = useId()
  const confirmId = useId()
  const [passphrase, setPassphrase] = useState("")
  const [confirm, setConfirm] = useState("")
  const backup = useMutation({
    mutationFn: (value: string) => postAdminEssayKeysBackup({ passphrase: value }),
    onSuccess: async ({ blob, filename }) => {
      downloadBlob(blob, filename)
      setPassphrase("")
      setConfirm("")
      await queryClient.invalidateQueries({ queryKey: keys.admin.essayKeys() })
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.type === "admission/essay_keys_backup_taken") {
        await queryClient.invalidateQueries({ queryKey: keys.admin.essayKeys() })
      }
    },
  })
  const error = useKnownError(backup.error)
  const tooShort = passphrase.length > 0 && passphrase.length < MIN_PASSPHRASE
  const mismatch = confirm.length > 0 && confirm !== passphrase
  const valid = passphrase.length >= MIN_PASSPHRASE && confirm === passphrase

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("backup.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          autoComplete="off"
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (valid) backup.mutate(passphrase)
          }}
        >
          <Alert variant="destructive">
            <AlertTitle>{t("backup.warningTitle")}</AlertTitle>
            <AlertDescription>{t("backup.warning")}</AlertDescription>
          </Alert>
          <div className="grid gap-2">
            <FieldLabel htmlFor={passId}>{t("backup.passphrase")}</FieldLabel>
            <Input
              id={passId}
              type="password"
              autoComplete="new-password"
              spellCheck={false}
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
            />
            {tooShort ? (
              <p className="text-destructive text-sm">{t("backup.tooShort", { min: MIN_PASSPHRASE })}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor={confirmId}>{t("backup.confirm")}</FieldLabel>
            <Input
              id={confirmId}
              type="password"
              autoComplete="new-password"
              spellCheck={false}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
            {mismatch ? <p className="text-destructive text-sm">{t("backup.mismatch")}</p> : null}
          </div>
          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {backup.isSuccess ? (
            <Alert role="status">
              <AlertDescription>{t("backup.done")}</AlertDescription>
            </Alert>
          ) : null}
          <LoadingButton type="submit" disabled={!valid} loading={backup.isPending} loadingLabel={t("backup.sending")}>
            {t("backup.submit")}
          </LoadingButton>
        </form>
      </CardContent>
    </Card>
  )
}

function RestoreCard() {
  const t = useT("essayKeys")
  const queryClient = useQueryClient()
  const fileId = useId()
  const passId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [passphrase, setPassphrase] = useState("")
  const [fileName, setFileName] = useState("")
  const restore = useMutation({
    mutationFn: async ({ file, value }: { file: File; value: string }): Promise<EssayKeysRestoreResult> => {
      let backup: unknown
      try {
        backup = JSON.parse(await file.text())
      } catch {
        throw new ParseError()
      }
      if (typeof backup !== "object" || backup === null || Array.isArray(backup)) throw new ParseError()
      // Shape is validated by the server (422 admission/essay_keys_backup_invalid).
      return postAdminEssayKeysRestore({
        backup: backup as Parameters<typeof postAdminEssayKeysRestore>[0]["backup"],
        passphrase: value,
      })
    },
    onSuccess: async () => {
      setPassphrase("")
      await queryClient.invalidateQueries({ queryKey: keys.admin.essayKeys() })
    },
  })
  const apiError = useKnownError(restore.error instanceof ParseError ? null : restore.error)
  const error = restore.error instanceof ParseError ? t("errors.backupInvalid") : apiError

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("restore.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          autoComplete="off"
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            const file = fileRef.current?.files?.[0]
            if (file && passphrase) restore.mutate({ file, value: passphrase })
          }}
        >
          <p className="text-muted-foreground text-sm">{t("restore.description")}</p>
          <div className="grid gap-2">
            <FieldLabel htmlFor={fileId}>{t("restore.file")}</FieldLabel>
            <Input
              id={fileId}
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
            />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor={passId}>{t("restore.passphrase")}</FieldLabel>
            <Input
              id={passId}
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
            />
          </div>
          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {restore.data ? (
            <Alert role="status" data-testid="essay-keys-restore-result">
              <AlertTitle>{t("restore.resultTitle")}</AlertTitle>
              <AlertDescription>
                <p>{t("restore.restored", { count: restore.data.restored })}</p>
                <p>{t("restore.skipped", { count: restore.data.skipped })}</p>
                {restore.data.conflicts.length > 0 ? (
                  <div>
                    <p>{t("restore.conflicts", { count: restore.data.conflicts.length })}</p>
                    <ul className="font-mono text-xs">
                      {restore.data.conflicts.map((id) => (
                        <li key={id}>{id}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}
          <LoadingButton
            type="submit"
            disabled={fileName === "" || passphrase === ""}
            loading={restore.isPending}
            loadingLabel={t("restore.sending")}
          >
            {t("restore.submit")}
          </LoadingButton>
        </form>
      </CardContent>
    </Card>
  )
}

class ParseError extends Error {}

function RotateCard({ data }: { data: EssayKeysStatus }) {
  const t = useT("essayKeys")
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const rotate = useMutation({
    mutationFn: () => postAdminEssayKeysRotate(),
    onSuccess: async (next) => {
      queryClient.setQueryData(keys.admin.essayKeys(), next)
      setOpen(false)
    },
    onError: async () => {
      setOpen(false)
      await queryClient.invalidateQueries({ queryKey: keys.admin.essayKeys() })
    },
  })
  const error = useKnownError(rotate.error)
  const running = data.rotation.state === "running"

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("rotate.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm">{t("rotate.description")}</p>
        {error ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <div>
          <Button type="button" variant="destructive" disabled={running} onClick={() => setOpen(true)}>
            {t("rotate.start")}
          </Button>
        </div>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title={t("rotate.confirmTitle")}
          description={t("rotate.confirmDescription")}
          confirmLabel={t("rotate.confirm")}
          destructive
          loading={rotate.isPending}
          onConfirm={() => rotate.mutate()}
        />
      </CardContent>
    </Card>
  )
}
