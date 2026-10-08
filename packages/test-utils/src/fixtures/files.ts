import type { FileCreateResponse, FileItem, StorageInfo } from "@ihsp/api"
import { TEST_STORAGE_URL } from "./env"
import { ids } from "./world"

/** A ready PDF the assistant can read, used by a link and by a lesson. */
export const filePdf: FileItem = {
  id: ids.file,
  name: "kinematics-notes.pdf",
  content_type: "application/pdf",
  byte_size: 482_113,
  purpose: "ai_upload",
  status: "ready",
  reject_reason: null,
  text_bytes: 31_420,
  assistant_ready: true,
  created_at: "2026-09-21T10:15:00Z",
  expires_on: "2027-01-15",
  used_by: [
    { kind: "chat", id: ids.chat, label: "Kinematics revision" },
    { kind: "lesson", id: ids.lessonPhysicsToday, label: "Physics, 7 Oct" },
  ],
}

/** A ready image that is too large for the assistant (no text extracted). */
export const fileImage: FileItem = {
  id: ids.fileImage,
  name: "lab-setup.jpg",
  content_type: "image/jpeg",
  byte_size: 2_904_881,
  purpose: "link",
  status: "ready",
  reject_reason: null,
  text_bytes: null,
  assistant_ready: false,
  created_at: "2026-09-28T08:00:00Z",
  expires_on: "2027-01-15",
  used_by: [{ kind: "link", id: ids.link, label: "lab-setup.jpg" }],
}

/** An upload the backend refused. */
export const fileRejected: FileItem = {
  id: ids.fileRejected,
  name: "installer.exe",
  content_type: "application/x-msdownload",
  byte_size: 1_048_576,
  purpose: "link",
  status: "rejected",
  reject_reason: "files/type-not-allowed",
  text_bytes: null,
  assistant_ready: false,
  created_at: "2026-10-05T11:00:00Z",
  expires_on: null,
  used_by: [],
}

export const fileItems: FileItem[] = [filePdf, fileImage, fileRejected]

/** A file in the state right after `POST /v1/files`. */
export function pendingFile(input: {
  id: string
  name: string
  size: number
  contentType: string
  purpose: "ai_upload" | "link"
}): FileItem {
  return {
    id: input.id,
    name: input.name,
    content_type: input.contentType,
    byte_size: input.size,
    purpose: input.purpose,
    status: "pending",
    reject_reason: null,
    text_bytes: null,
    assistant_ready: false,
    created_at: "2026-10-07T05:12:00Z",
    expires_on: "2027-01-15",
    used_by: [],
  }
}

export function uploadTargetFor(fileId: string, headers: Record<string, string>): FileCreateResponse["upload"] {
  return { url: `${TEST_STORAGE_URL}/uploads/${fileId}`, method: "PUT", headers }
}

export const storageInfo: StorageInfo = {
  used_bytes: 3_895_114,
  quota_bytes: 52_428_800,
  term_id: ids.term,
  expires_on: "2027-01-15",
}
