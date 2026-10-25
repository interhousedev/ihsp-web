"use client"

import {
  getLmsImport,
  IMSCC_MAX_BYTES,
  isImsccJobFinished,
  keys,
  postLmsCourseImport,
  type ImsccImportJob,
  type ImsccImportStarted,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  LoadingButton,
  Progress,
} from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { hrefs } from "../../shared/utils/hrefs"

const POLL_MS = 1500

/** "Import .imscc": uploads a cartridge, follows the import job and shows what was imported and what was not. */
export function ImportImsccDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("imscc")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [tooBig, setTooBig] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)

  const upload = useMutation<ImsccImportStarted, unknown, File>({
    mutationFn: (value) => postLmsCourseImport(value),
    onSuccess: (started) => setJobId(started.job_id),
  })

  const job = useQuery<ImsccImportJob>({
    queryKey: [...keys.lms.all(), "imports", jobId ?? ""],
    queryFn: ({ signal }) => getLmsImport(jobId ?? "", { signal }),
    enabled: jobId !== null,
    refetchInterval: (query) => {
      const data = query.state.data
      return data && isImsccJobFinished(data.status) ? false : POLL_MS
    },
    gcTime: 0,
  })

  const data = job.data
  const finished = data ? isImsccJobFinished(data.status) : false
  const running = jobId !== null && !finished && !job.isError

  function close(next: boolean) {
    if (!next) {
      if (data?.status === "done") void queryClient.invalidateQueries({ queryKey: keys.lms.all() })
      setFile(null)
      setTooBig(false)
      setJobId(null)
      upload.reset()
    }
    onOpenChange(next)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (file && !tooBig) upload.mutate(file)
  }

  const percent = data?.total ? Math.min(100, Math.round((data.done / data.total) * 100)) : null
  const report = data?.report ?? null
  const error = upload.isError ? upload.error : job.isError ? job.error : null

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        {jobId === null ? (
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <Field>
              <FieldLabel htmlFor="imscc-file">{t("file")}</FieldLabel>
              <Input
                id="imscc-file"
                type="file"
                accept=".imscc,.zip"
                disabled={upload.isPending}
                onChange={(event) => {
                  const picked = event.target.files?.[0] ?? null
                  setFile(picked)
                  setTooBig(picked !== null && picked.size > IMSCC_MAX_BYTES)
                }}
                className="h-11 md:h-8"
              />
              <FieldDescription>{t("hint")}</FieldDescription>
            </Field>
            {tooBig ? (
              <Alert variant="destructive">
                <AlertDescription>{t("tooBig")}</AlertDescription>
              </Alert>
            ) : null}
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage(error)}</AlertDescription>
              </Alert>
            ) : null}
            <DialogFooter>
              <LoadingButton type="submit" disabled={!file || tooBig} loading={upload.isPending}>
                {t("start")}
              </LoadingButton>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            {running || (!data && !error) ? (
              <Progress value={percent} aria-label={t("progress")}>
                <span className="text-sm">
                  {percent === null
                    ? t("working")
                    : t("progressValue", { done: data?.done ?? 0, total: data?.total ?? 0 })}
                </span>
              </Progress>
            ) : null}
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage(error)}</AlertDescription>
              </Alert>
            ) : null}
            {data?.status === "failed" ? (
              <Alert variant="destructive">
                <AlertDescription>{data.error ?? t("failed")}</AlertDescription>
              </Alert>
            ) : null}
            {data?.status === "cancelled" ? <p className="text-sm">{t("cancelled")}</p> : null}
            {data?.status === "done" && report ? (
              <section aria-label={t("report")} className="flex flex-col gap-3">
                <h3 className="text-base font-semibold">{t("done", { title: report.title })}</h3>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <li>{t("sections", { count: report.sections })}</li>
                  <li>{t("steps", { count: report.steps })}</li>
                  <li>{t("files", { count: report.files })}</li>
                  <li>{t("quizzes", { count: report.quizzes })}</li>
                  <li>{t("questions", { count: report.questions })}</li>
                  <li>{t("links", { count: report.links })}</li>
                </ul>
                {report.items.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-medium">{t("unsupported", { count: report.items.length })}</h4>
                    <ul
                      aria-label={t("unsupportedList")}
                      className="flex max-h-48 flex-col gap-1 overflow-y-auto text-sm"
                    >
                      {report.items.map((item, index) => (
                        <li key={`${index}-${item.title}`}>
                          <span className="font-medium">{item.title}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            ({item.kind}): {item.note}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            ) : null}
            <DialogFooter>
              {data?.status === "done" && data.course_id ? (
                <Button
                  type="button"
                  onClick={() => {
                    const id = data.course_id
                    close(false)
                    if (id) router.push(hrefs.edit(id))
                  }}
                >
                  {t("open")}
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={() => close(false)}>
                {finished || error ? t("close") : t("background")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Button plus dialog, for the course creation page. */
export function ImportImsccButton() {
  const t = useT("imscc")
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={() => setOpen(true)}>
        {t("title")}
      </Button>
      {open ? <ImportImsccDialog open={open} onOpenChange={setOpen} /> : null}
    </>
  )
}
