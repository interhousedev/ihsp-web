"use client"

import { useT } from "@ihsp/i18n"
import { cn, initials, PersonSilhouette } from "@ihsp/ui"
import { useState } from "react"

const SIZES = {
  sm: "size-6 text-[10px]",
  default: "size-8 text-xs",
  lg: "size-20 text-xl",
} as const

export type TeacherAvatarProps = {
  /** Full name: the initials when there is no photo, and the alt text of the photo. */
  name: string
  photoUrl: string | null
  size?: keyof typeof SIZES
  /** A decorative avatar next to the name it belongs to: no alt text, hidden from assistive technology. */
  decorative?: boolean
  /** Without a photo (or when it is hidden from the viewer): the initials, or a gray default-person silhouette. */
  placeholder?: "initials" | "person"
  className?: string
}

/**
 * A person's photo in a circle. The initials are always underneath: they show while the photo loads and stay when it
 * fails (an expired presigned address, a 404), so the circle is never empty.
 */
export function TeacherAvatar({
  name,
  photoUrl,
  size = "default",
  decorative = false,
  placeholder = "initials",
  className,
}: TeacherAvatarProps) {
  const t = useT("teacherPhoto")
  // The address that failed; a new address gets another try.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const photo = photoUrl && photoUrl !== failedUrl ? photoUrl : null
  return (
    <span
      data-testid="teacher-avatar"
      aria-hidden={decorative || undefined}
      className={cn(
        "bg-muted text-muted-foreground relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium select-none",
        SIZES[size],
        className,
      )}
    >
      {placeholder === "person" ? (
        <PersonSilhouette />
      ) : (
        <span data-testid="teacher-avatar-initials" aria-hidden={photo !== null || undefined}>
          {initials(name)}
        </span>
      )}
      {photo ? (
        <img
          src={photo}
          alt={decorative ? "" : t("alt", { name })}
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailedUrl(photo)}
        />
      ) : null}
    </span>
  )
}
