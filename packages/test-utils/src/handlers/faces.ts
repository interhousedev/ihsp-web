import type { DeviceCallOut, DeviceCreateIn, DeviceOut, FaceOut } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, noContent, notFound, problem, readJson } from "./utils"

const PHOTO_TYPES = ["image/jpeg", "image/png"]
const PHOTO_MAX_BYTES = 5 * 1024 * 1024

const NO_FACE: FaceOut = { has_face: false, locked: false, photo_url: null, updated_at: null }

let mine: FaceOut = { ...NO_FACE }
const students = new Map<string, FaceOut>()
let devices: DeviceOut[] = seedDevices()
let calls: Record<string, DeviceCallOut[]> = seedCalls()
let sequence = 0

function seedDevices(): DeviceOut[] {
  return [
    {
      id: "device-1",
      name: "Main entrance",
      key_prefix: "ihd_ab12",
      created_at: "2026-10-01T05:00:00Z",
      revoked_at: null,
      last_used_at: "2026-11-09T03:10:00Z",
    },
    {
      id: "device-2",
      name: "Old gate",
      key_prefix: "ihd_cd34",
      created_at: "2026-09-01T05:00:00Z",
      revoked_at: "2026-10-20T05:00:00Z",
      last_used_at: null,
    },
  ]
}

function seedCalls(): Record<string, DeviceCallOut[]> {
  return {
    "device-1": [
      {
        id: "call-1",
        at: "2026-11-09T03:10:00Z",
        status: "matched",
        matched_user_id: "user-student-1",
        matched_name: "Aliyev Ali",
        excused: false,
      },
      {
        id: "call-2",
        at: "2026-11-09T03:12:00Z",
        status: "no_match",
        matched_user_id: null,
        matched_name: null,
        excused: false,
      },
    ],
  }
}

/** The state of `GET /v1/me/face`: seed a face on file, or one that staff locked. */
export function setMyFace(face: Partial<FaceOut>): void {
  mine = { ...NO_FACE, ...face }
}

export function resetFaces(): void {
  mine = { ...NO_FACE }
  students.clear()
  devices = seedDevices()
  calls = seedCalls()
  sequence = 0
}

/** Reads the `file` part and applies the server rules. File names decide the face check: `nofaces*`, `multi*`. */
async function receive(request: Request): Promise<File | Response> {
  const form = await request.formData().catch(() => null)
  const file = form?.get("file")
  if (!file || typeof file === "string" || file.size === 0) {
    return problem(422, "faces/image-empty", "The image is empty")
  }
  if (file.size > PHOTO_MAX_BYTES) return problem(413, "faces/image-too-large", "The image is too large")
  if (!PHOTO_TYPES.includes(file.type)) return problem(422, "faces/image-type", "Not a JPEG or PNG image")
  if (file.name.startsWith("nofaces")) return problem(422, "faces/no-face", "No face found")
  if (file.name.startsWith("multi")) return problem(422, "faces/multiple-faces", "More than one face found")
  return file
}

function saved(locked: boolean): FaceOut {
  sequence += 1
  return {
    has_face: true,
    locked,
    photo_url: `https://files.example.test/faces/face-${sequence}.jpg`,
    updated_at: "2026-11-10T05:00:00Z",
  }
}

/** Own face, a curator's upload for a student, and the entrance devices (`/v1/admin/devices*`). */
export const facesHandlers = [
  http.get(apiUrl("/v1/me/face"), () => HttpResponse.json(mine)),
  http.put(apiUrl("/v1/me/face"), async ({ request }) => {
    if (mine.locked) return problem(409, "faces/locked", "Staff set this photo")
    const received = await receive(request)
    if (received instanceof Response) return received
    mine = saved(false)
    return HttpResponse.json(mine)
  }),
  http.delete(apiUrl("/v1/me/face"), () => {
    if (mine.locked) return problem(409, "faces/locked", "Staff set this photo")
    mine = { ...NO_FACE }
    return noContent()
  }),
  http.put(apiUrl("/v1/staff/students/:studentId/face"), async ({ request, params }) => {
    const received = await receive(request)
    if (received instanceof Response) return received
    const face = saved(true)
    students.set(String(params.studentId), face)
    return HttpResponse.json(face)
  }),
  http.delete(apiUrl("/v1/staff/students/:studentId/face"), ({ params }) => {
    students.delete(String(params.studentId))
    return noContent()
  }),
  http.get(apiUrl("/v1/admin/users/:userId/face-photo"), ({ params }) => {
    const face = students.get(String(params.userId))
    if (!face?.photo_url) return notFound("Face photo")
    return HttpResponse.json({ photo_url: face.photo_url, updated_at: face.updated_at })
  }),
  http.get(apiUrl("/v1/admin/devices"), () => HttpResponse.json({ items: devices })),
  http.post(apiUrl("/v1/admin/devices"), async ({ request }) => {
    const body = await readJson<DeviceCreateIn>(request)
    const device: DeviceOut = {
      id: `device-new-${devices.length + 1}`,
      name: body.name ?? "",
      key_prefix: "ihd_new1",
      created_at: "2026-11-10T05:00:00Z",
      revoked_at: null,
      last_used_at: null,
    }
    devices = [device, ...devices]
    return HttpResponse.json({ ...device, token: "ihd_secret-token-shown-once" }, { status: 201 })
  }),
  http.post(apiUrl("/v1/admin/devices/:deviceId/revoke"), ({ params }) => {
    const found = devices.find((device) => device.id === params.deviceId)
    if (!found) return problem(404, "faces/device-not-found", "Device not found")
    const revoked = { ...found, revoked_at: "2026-11-10T05:00:00Z" }
    devices = devices.map((device) => (device.id === found.id ? revoked : device))
    return HttpResponse.json(revoked)
  }),
  http.get(apiUrl("/v1/admin/devices/:deviceId/calls"), ({ params }) => {
    const id = String(params.deviceId)
    if (!devices.some((device) => device.id === id)) return notFound("Device")
    return HttpResponse.json({ items: calls[id] ?? [] })
  }),
]
