"use client"

import { getMeStudentCardQuery } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { TeacherAvatar } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, cn, Icons, Skeleton } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { StudentCardSheet } from "../../student-card/components/student-card-sheet"
import { useScrolled } from "./use-scrolled"

/**
 * Who is signed in: photo, name, group and course, and the button that opens the student card. It sticks to the top
 * and shrinks to a compact bar once the page is scrolled.
 */
export function IdentityHeader() {
  const t = useT("today.dashboard")
  const { session } = useSession()
  const query = useQuery(getMeStudentCardQuery())
  const card = query.data
  const compact = useScrolled()
  const [open, setOpen] = useState(false)

  const user = session?.user
  const name = card
    ? `${card.first_name} ${card.last_name}`.trim()
    : user
      ? `${user.first_name} ${user.last_name}`.trim()
      : ""
  const pending = query.isPending
  if (!card && !pending && !name) return null
  const parts = card
    ? [card.group || null, card.course != null ? t("course", { course: card.course }) : null].filter(
        (part): part is string => part !== null,
      )
    : []
  const hasPhoto = card ? card.has_photo : Boolean(user?.photo_url)

  return (
    <header
      data-testid="identity-header"
      data-compact={compact}
      className={cn(
        "bg-background/90 sticky top-0 z-10 -mx-1 flex items-center gap-3 rounded-card px-3 backdrop-blur transition-[padding] motion-reduce:transition-none",
        compact ? "py-1.5" : "py-3",
      )}
    >
      <TeacherAvatar
        name={name}
        photoUrl={hasPhoto ? (user?.photo_url ?? null) : null}
        size={compact ? "default" : "lg"}
        decorative
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {pending ? (
          <>
            <Skeleton className={compact ? "h-5 w-32" : "h-7 w-40"} />
            {!compact ? <Skeleton className="mt-0.5 h-5 w-24" /> : null}
          </>
        ) : (
          <>
            <p className={cn("truncate font-semibold", compact ? "text-sm" : "text-lg")}>{name}</p>
            {!compact && parts.length > 0 ? (
              <p className="text-muted-foreground truncate text-sm">{parts.join(" · ")}</p>
            ) : null}
          </>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size={compact ? "icon" : "sm"}
        aria-label={compact ? t("studentCard") : undefined}
        onClick={() => setOpen(true)}
      >
        <Icons.qrCode aria-hidden />
        {compact ? null : t("studentCard")}
      </Button>
      <StudentCardSheet open={open} onOpenChange={setOpen} />
    </header>
  )
}
