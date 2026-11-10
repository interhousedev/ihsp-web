// Faces: the photo the entrance device recognises (own photo, curator or administrator upload) and the devices.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent } from "../types/common"

/** Whether a face is on file. `locked`: staff set it, so the student cannot change it. */
export type FaceOut = {
  has_face: boolean
  locked: boolean
  photo_url: string | null
  updated_at: string | null
}

/** An entrance device; its token is never returned again. */
export type DeviceOut = {
  id: string
  name: string
  key_prefix: string
  created_at: string
  revoked_at: string | null
  last_used_at: string | null
}

export type DeviceListOut = { items: DeviceOut[] }

/** A new device; `token` is shown only in this response. */
export type DeviceCreatedOut = {
  id: string
  name: string
  key_prefix: string
  created_at: string
  token: string
}

export type DeviceCreateIn = { name: string }

/** One request of a device. */
export type DeviceCallOut = {
  id: string
  at: string
  status: string
  matched_user_id: string | null
  matched_name: string | null
  excused: boolean | null
}

export type DeviceCallListOut = { items: DeviceCallOut[] }

function faceForm(file: File): FormData {
  const form = new FormData()
  form.append("file", file)
  return form
}

/** GET /v1/me/face — whether the caller has a face on file and whether staff locked it. */
export function getMyFace(opts?: RequestOptions): Promise<FaceOut> {
  return api.get<FaceOut>("/v1/me/face", opts)
}
export const getMyFaceQuery = () =>
  queryOptions({ queryKey: keys.me.face(), queryFn: ({ signal }) => getMyFace({ signal }) })

/** PUT /v1/me/face — multipart `file`, JPEG or PNG up to 5 MB; `faces/locked` when staff set the photo. */
export function putMyFace(file: File, opts?: RequestOptions): Promise<FaceOut> {
  return api.request<FaceOut>({ ...opts, method: "PUT", path: "/v1/me/face", formData: faceForm(file) })
}

/** DELETE /v1/me/face — removes the face; `faces/locked` when staff set the photo. */
export function deleteMyFace(opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>("/v1/me/face", opts)
}

/** PUT /v1/staff/students/{student_id}/face — curator of the student's group or admin; locks the face against the student. */
export function putStudentFace(studentId: string, file: File, opts?: RequestOptions): Promise<FaceOut> {
  return api.request<FaceOut>({
    ...opts,
    method: "PUT",
    path: `/v1/staff/students/${seg(studentId)}/face`,
    formData: faceForm(file),
  })
}

/** DELETE /v1/staff/students/{student_id}/face — removes the face and releases the lock. */
export function deleteStudentFace(studentId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/staff/students/${seg(studentId)}/face`, opts)
}

/** GET /v1/admin/devices — admin; every device. */
export function getAdminDevices(opts?: RequestOptions): Promise<DeviceListOut> {
  return api.get<DeviceListOut>("/v1/admin/devices", opts)
}
export const getAdminDevicesQuery = () =>
  queryOptions({ queryKey: keys.admin.devices(), queryFn: ({ signal }) => getAdminDevices({ signal }) })

/** POST /v1/admin/devices — admin; the token is in this response only. */
export function postAdminDevice(body: DeviceCreateIn, opts?: RequestOptions): Promise<DeviceCreatedOut> {
  return api.post<DeviceCreatedOut>("/v1/admin/devices", body, opts)
}

/** POST /v1/admin/devices/{device_id}/revoke — admin. */
export function postAdminDeviceRevoke(deviceId: string, opts?: RequestOptions): Promise<DeviceOut> {
  return api.post<DeviceOut>(`/v1/admin/devices/${seg(deviceId)}/revoke`, undefined, opts)
}

/** GET /v1/admin/devices/{device_id}/calls — admin; the last 7 days. */
export function getAdminDeviceCalls(deviceId: string, opts?: RequestOptions): Promise<DeviceCallListOut> {
  return api.get<DeviceCallListOut>(`/v1/admin/devices/${seg(deviceId)}/calls`, opts)
}
export const getAdminDeviceCallsQuery = (deviceId: string) =>
  queryOptions({
    queryKey: keys.admin.deviceCalls(deviceId),
    queryFn: ({ signal }) => getAdminDeviceCalls(deviceId, { signal }),
  })
