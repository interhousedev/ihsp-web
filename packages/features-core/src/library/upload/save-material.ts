import {
  patchMaterial,
  postMaterial,
  postMaterialFiles,
  postMaterialSubmit,
  uploadFile,
  type ItemDetail,
} from "@ihsp/api"
import { toInput, type MaterialValues } from "./material-values"
import { prepareImage } from "./prepare-image"

/** A file that the storage check refused after the upload (`FileItem.status === "rejected"`). */
export class UploadRejectedError extends Error {
  readonly reason: string | null
  constructor(reason: string | null) {
    super(reason ?? "rejected")
    this.name = "UploadRejectedError"
    this.reason = reason
  }
}

export type SaveStage = "saving" | "uploading" | "attaching" | "submitting"

/** Where a long save is: the file being sent (`current` of `total`) and its share in `fraction` (0 to 1). */
export type SaveProgress = { stage: SaveStage; current: number; total: number; fraction: number }

/**
 * What survives a failed attempt, so a retry does not create a second draft or send a file twice: the id of the
 * draft, the storage id of every file already sent, and the list of files last attached to the draft.
 */
export type SaveMemory = {
  itemId: string | null
  uploaded: Map<string, string>
  attached: string | null
}

export const newMemory = (itemId: string | null): SaveMemory => ({ itemId, uploaded: new Map(), attached: null })

type Report = (progress: SaveProgress) => void

const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`

async function sendFile(file: File, key: string, memory: SaveMemory, report: Report, current: number, total: number) {
  const known = memory.uploaded.get(key)
  if (known) return known
  report({ stage: "uploading", current, total, fraction: 0 })
  const stored = await uploadFile(file, "library_material", (fraction) =>
    report({ stage: "uploading", current, total, fraction }),
  )
  if (stored.status === "rejected") throw new UploadRejectedError(stored.reject_reason)
  memory.uploaded.set(key, stored.id)
  return stored.id
}

/** Storage ids of the files to attach: one PDF (or DOCX, PPTX), or the photos in their order; `null` when none is new. */
async function uploadFiles(values: MaterialValues, memory: SaveMemory, report: Report): Promise<string[] | null> {
  if (values.kind === "pdf" && values.pdf) {
    return [await sendFile(values.pdf, fileKey(values.pdf), memory, report, 1, 1)]
  }
  if (values.kind === "photos" && values.photos.length > 0) {
    const ids: string[] = []
    for (const [index, photo] of values.photos.entries()) {
      const key = `${photo.key}:${photo.rotation}`
      const prepared = memory.uploaded.has(key) ? photo.file : await prepareImage(photo.file, photo.rotation)
      ids.push(await sendFile(prepared, key, memory, report, index + 1, values.photos.length))
    }
    return ids
  }
  return null
}

/**
 * Saves the draft: creates it (`POST /library/materials`) or, when it exists, updates title, description, topics and
 * the Markdown text (`PATCH`); then sends new files (purpose `library_material`) and attaches them. Nothing is
 * submitted. Returns the latest detail of the draft.
 */
export async function saveMaterial(args: {
  values: MaterialValues
  canPublish: boolean
  memory: SaveMemory
  report: Report
}): Promise<ItemDetail> {
  const { values, canPublish, memory, report } = args
  report({ stage: "saving", current: 0, total: 1, fraction: 0 })
  let detail: ItemDetail
  if (memory.itemId === null) {
    detail = await postMaterial(toInput(values, canPublish))
    memory.itemId = detail.id
  } else {
    detail = await patchMaterial(memory.itemId, {
      title: values.title.trim(),
      description: values.description.trim(),
      topic_ids: values.topicIds,
      ...(values.kind === "markdown" ? { body_md: values.body } : {}),
    })
  }
  if (!memory.itemId) throw new Error("The server did not return an id for the draft")

  const ids = await uploadFiles(values, memory, report)
  if (ids && ids.join(",") !== memory.attached) {
    report({ stage: "attaching", current: ids.length, total: ids.length, fraction: 1 })
    detail = await postMaterialFiles(memory.itemId, { file_ids: ids })
    memory.attached = ids.join(",")
  }
  return detail
}

/** Saves the draft and then submits it: published at once for teachers, `pending_review` for students. */
export async function submitMaterial(args: {
  values: MaterialValues
  canPublish: boolean
  memory: SaveMemory
  report: Report
}): Promise<ItemDetail> {
  await saveMaterial(args)
  args.report({ stage: "submitting", current: 1, total: 1, fraction: 0 })
  return postMaterialSubmit(args.memory.itemId!)
}
