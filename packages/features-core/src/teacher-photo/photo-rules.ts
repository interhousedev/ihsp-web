/** Profile photos: JPEG or PNG, at most 5 MiB. The server checks the content again; this check only saves a round trip. */
export const PHOTO_TYPES = ["image/jpeg", "image/png"] as const
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024
/** The `accept` attribute of the file input. */
export const PHOTO_ACCEPT = PHOTO_TYPES.join(",")

export type PhotoProblem = "wrongType" | "tooLarge"

/** Why a picked file cannot be uploaded, or `null` when it can. An empty file is left to the server's answer. */
export function photoProblem(file: Pick<File, "type" | "size">): PhotoProblem | null {
  if (!(PHOTO_TYPES as readonly string[]).includes(file.type)) return "wrongType"
  if (file.size > PHOTO_MAX_BYTES) return "tooLarge"
  return null
}
