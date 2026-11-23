"use client"

import {
  HTML_WIDGET_MAX_BYTES,
  lmsHtmlWidgetUploadPath,
  networkError,
  parseApiError,
  type HtmlBlock,
  type HtmlWidgetFile,
  type HtmlWidgetPackage,
  type LearningHtmlBlock,
} from "@ihsp/api"
import { getAccessToken } from "@ihsp/auth"
import { getConfig } from "@ihsp/config"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Field,
  FieldDescription,
  FieldLabel,
  Icons,
  Input,
  Progress,
  Slider,
  Switch,
} from "@ihsp/ui"
import { type ChangeEvent, type DragEvent, useEffect, useId, useRef, useState } from "react"
import { HtmlBlock as HtmlPlayer } from "../../player/components/html-block"

const MIN_HEIGHT = 200
const MAX_HEIGHT = 2000

type UploadState = { phase: "idle" } | { phase: "uploading"; pct: number } | { phase: "error"; error: unknown }

/**
 * Upload a multipart file with XHR so the bar shows real progress (fetch has no upload progress). Kept local to the
 * editor: it is the only upload that needs it. Errors come back as `{ code }` bodies like the api client's.
 */
async function uploadWithProgress(
  courseId: string,
  file: File,
  onProgress: (pct: number) => void,
  signal: AbortSignal,
): Promise<HtmlWidgetPackage> {
  const token = await getAccessToken()
  const { API_URL, APP_NAME } = getConfig()
  const { promise, resolve, reject } = Promise.withResolvers<HtmlWidgetPackage>()
  const xhr = new XMLHttpRequest()
  xhr.open("POST", `${API_URL}${lmsHtmlWidgetUploadPath(courseId)}`)
  if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  if (APP_NAME) xhr.setRequestHeader("X-IHSP-App", APP_NAME)
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
  }
  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) return resolve(JSON.parse(xhr.responseText) as HtmlWidgetPackage)
    const type = xhr.getResponseHeader("Content-Type") ?? "application/json"
    void parseApiError(new Response(xhr.responseText, { status: xhr.status, headers: { "Content-Type": type } })).then(
      reject,
    )
  }
  xhr.onerror = () => reject(networkError(new Error("upload failed")))
  xhr.onabort = () => reject(new DOMException("aborted", "AbortError"))
  signal.addEventListener("abort", () => xhr.abort())
  const form = new FormData()
  form.append("file", file)
  xhr.send(form)
  return promise
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

/**
 * An HTML widget block: the author uploads one `.html` file or a `.zip` with `index.html` at its root (drag & drop or
 * the file picker). The server checks and unpacks it; the block keeps the widget id, the frame height and whether the
 * widget's reported score counts. A saved block previews the widget in the same sandbox learners get.
 */
export function HtmlBlockEditor({
  block,
  onChange,
  courseId,
  stepId,
}: {
  block: HtmlBlock
  onChange: (block: HtmlBlock) => void
  courseId?: string
  stepId?: string
}) {
  const t = useT("stepEditor")
  const errorMessage = useErrorMessage()
  const input = useRef<HTMLInputElement>(null)
  const abort = useRef<AbortController | null>(null)
  const ids = { title: useId(), height: useId(), graded: useId(), fullscreen: useId() }
  const [state, setState] = useState<UploadState>({ phase: "idle" })
  const [tooLarge, setTooLarge] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<HtmlWidgetFile[] | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => () => abort.current?.abort(), [])

  function upload(file: File | undefined) {
    if (!file || !courseId || state.phase === "uploading") return
    setTooLarge(file.size > HTML_WIDGET_MAX_BYTES)
    if (file.size > HTML_WIDGET_MAX_BYTES) return
    setShowPreview(false)
    setState({ phase: "uploading", pct: 0 })
    abort.current = new AbortController()
    uploadWithProgress(courseId, file, (pct) => setState({ phase: "uploading", pct }), abort.current.signal)
      .then((stored) => {
        setFiles(stored.files)
        setState({ phase: "idle" })
        onChange({
          ...block,
          package_id: stored.package_id,
          title: block.title || file.name.replace(/\.(zip|html?)$/i, ""),
        })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return setState({ phase: "idle" })
        setState({ phase: "error", error })
      })
  }

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    upload(file)
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    upload(event.dataTransfer.files[0])
  }

  const uploading = state.phase === "uploading"
  const saved = block.package_id !== "" && !block.id.startsWith("tmp-")
  const preview: LearningHtmlBlock = { ...block, passed: false, result: null }

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor={ids.title}>{t("html.titleLabel")}</FieldLabel>
        <Input
          id={ids.title}
          value={block.title}
          maxLength={200}
          onChange={(event) => onChange({ ...block, title: event.target.value })}
          className="h-11 md:h-8"
        />
      </Field>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        data-dragging={dragging || undefined}
        className="border-border data-[dragging]:border-primary data-[dragging]:bg-primary/5 flex flex-col items-center gap-3 rounded-lg border border-dashed p-4 text-center"
      >
        <p className="text-sm">
          {block.package_id ? (
            <span className="font-medium" data-html-widget-package={block.package_id}>
              {t("html.uploaded")}
            </span>
          ) : (
            <span className="text-muted-foreground">{t("html.empty")}</span>
          )}
        </p>
        <p className="text-muted-foreground text-xs">{t("html.dropHint")}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={uploading || !courseId}
            onClick={() => input.current?.click()}
            className="min-h-11 md:min-h-8"
          >
            <Icons.upload aria-hidden />
            {uploading ? t("html.uploading") : block.package_id ? t("html.replace") : t("html.upload")}
          </Button>
          {uploading ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => abort.current?.abort()}
              className="min-h-11 md:min-h-8"
            >
              {t("html.cancel")}
            </Button>
          ) : null}
        </div>
        <input
          ref={input}
          type="file"
          accept=".html,.htm,.zip,text/html,application/zip"
          hidden
          tabIndex={-1}
          aria-label={t("html.file")}
          onChange={onPick}
        />
        {uploading ? <Progress value={state.pct} aria-label={t("html.progress")} className="w-full max-w-sm" /> : null}
      </div>

      {tooLarge || state.phase === "error" ? (
        <Alert variant="destructive">
          <AlertDescription>
            {tooLarge ? t("html.tooLarge") : state.phase === "error" ? errorMessage(state.error) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {files ? (
        <details className="text-sm">
          <summary className="cursor-pointer">{t("html.files", { count: files.length })}</summary>
          <ul className="text-muted-foreground mt-2 max-h-48 overflow-auto font-mono text-xs">
            {files.map((file) => (
              <li key={file.path} className="flex justify-between gap-4">
                <span className="truncate">{file.path}</span>
                <span className="shrink-0">{formatBytes(file.byte_size)}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <Field>
        <FieldLabel htmlFor={ids.height}>{t("html.height", { px: block.height_px })}</FieldLabel>
        <Slider
          id={ids.height}
          min={MIN_HEIGHT}
          max={MAX_HEIGHT}
          step={20}
          value={[block.height_px]}
          aria-label={t("html.heightAria")}
          onValueChange={(next) => {
            const value = Array.isArray(next) ? next[0] : next
            if (typeof value === "number") onChange({ ...block, height_px: value })
          }}
        />
        <FieldDescription>{t("html.heightHint")}</FieldDescription>
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
        <label htmlFor={ids.fullscreen} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
          <Switch
            id={ids.fullscreen}
            checked={block.allow_fullscreen}
            onCheckedChange={(allow_fullscreen) => onChange({ ...block, allow_fullscreen })}
          />
          {t("html.fullscreen")}
        </label>
        <label htmlFor={ids.graded} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
          <Switch id={ids.graded} checked={block.graded} onCheckedChange={(graded) => onChange({ ...block, graded })} />
          {t("html.graded")}
        </label>
      </div>
      {block.graded ? <p className="text-muted-foreground text-xs">{t("html.gradedHint")}</p> : null}

      {saved && courseId && stepId ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowPreview((shown) => !shown)}
            aria-expanded={showPreview}
            className="min-h-11 self-start md:min-h-8"
          >
            <Icons.eye aria-hidden />
            {t("html.preview")}
          </Button>
          {showPreview ? (
            <HtmlPlayer block={preview} courseId={courseId} stepId={stepId} mode="preview" slug={null} />
          ) : null}
        </div>
      ) : block.package_id ? (
        <p className="text-muted-foreground text-xs">{t("html.saveToPreview")}</p>
      ) : null}
    </div>
  )
}
