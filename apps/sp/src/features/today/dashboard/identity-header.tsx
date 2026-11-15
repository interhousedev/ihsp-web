"use client"

import { getMeStudentCardQuery } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { TeacherAvatar } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, cn, Icons, Skeleton } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { StudentCardError, retryCardQuery } from "../../student-card/components/student-card-error"
import { StudentCardSheet } from "../../student-card/components/student-card-sheet"
import { useScrolled } from "./use-scrolled"

/**
 * Who is signed in: photo, name, group and course, and the button that opens the student card. It sticks to the top
 * below the floating controls and gains a shadow once the page is scrolled (its height never changes).
 */
export function IdentityHeader() {
  const t = useT("today.dashboard")
  const { session } = useSession()
  const query = useQuery({ ...getMeStudentCardQuery(), retry: retryCardQuery })
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
    <>
      <header
        data-testid="identity-header"
        data-compact={compact}
        className={cn(
          "bg-background/90 sticky top-(--shell-top-reserve,0px) z-10 -mx-1 flex items-center gap-3 rounded-card px-3 py-2 backdrop-blur transition-shadow motion-reduce:transition-none",
          compact && "shadow-sm",
        )}
      >
        <TeacherAvatar name={name} photoUrl={hasPhoto ? (user?.photo_url ?? null) : null} size="lg" decorative />
        <div className="flex min-w-0 flex-1 flex-col">
          {pending ? (
            <>
              <Skeleton className="h-7 w-40 max-w-full" />
              <Skeleton className="mt-0.5 h-5 w-24" />
            </>
          ) : (
            <>
              <p className="line-clamp-2 text-lg leading-tight font-semibold break-words">{name}</p>
              {parts.length > 0 ? <p className="text-muted-foreground truncate text-sm">{parts.join(" · ")}</p> : null}
            </>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={t("studentCard")}
          className="max-sm:size-11 max-sm:px-0"
          onClick={() => setOpen(true)}
        >
          <Icons.qrCode aria-hidden />
          <span className="max-sm:sr-only">{t("studentCard")}</span>
        </Button>
        <StudentCardSheet open={open} onOpenChange={setOpen} />
      </header>
      {query.isError && !card ? (
        <StudentCardError error={query.error} onRetry={() => void query.refetch()} inline />
      ) : null}
    </>
  )
}
