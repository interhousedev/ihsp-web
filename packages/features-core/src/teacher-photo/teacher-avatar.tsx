"use client"

import { useT } from "@ihsp/i18n"
import { cn, initials } from "@ihsp/ui"

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
  className?: string
}

/** A teacher's photo in a circle, or their initials when there is none. */
export function TeacherAvatar({ name, photoUrl, size = "default", decorative = false, className }: TeacherAvatarProps) {
  const t = useT("teacherPhoto")
  return (
    <span
      data-testid="teacher-avatar"
      aria-hidden={decorative || undefined}
      className={cn(
        "bg-muted text-muted-foreground inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium select-none",
        SIZES[size],
        className,
      )}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={decorative ? "" : t("alt", { name })} className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  )
}
