"use client"

import { getLmsMyCoursesQuery } from "@ihsp/api"
import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Icons, Input } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import {
  clubCourseKeys,
  clubName,
  confirmClubCourseLink,
  getClubCourseLinks,
  getCourseClubLinks,
  getMyClubs,
  requestClubCourseLink,
  unlinkClubCourse,
  type ClubCourseLink,
  type MyClub,
} from "./club-api"

type Pair = { clubId: string; courseId: string }

/**
 * The link between a course and a club, seen from both sides: "Course club" in the course settings and "Club courses" in
 * the club settings. A link needs both sides: the side that asks waits, the other confirms (a person who holds both sides
 * links at once). Either side can end a link or decline a request.
 */
export function CourseClubPanel({ mode = "course", courseId, clubId }: { mode?: "course" | "club"; courseId?: string; clubId?: string }) {
  const t = useT("duo")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState("")
  const [notice, setNotice] = useState<string | null>(null)

  const scope = mode === "course" ? courseId : clubId
  const links = useQuery({
    queryKey: mode === "course" ? clubCourseKeys.course(scope ?? "") : clubCourseKeys.club(scope ?? ""),
    queryFn: () => (mode === "course" ? getCourseClubLinks(scope!) : getClubCourseLinks(scope!)),
    enabled: scope !== undefined,
  })
  const clubs = useQuery({ queryKey: clubCourseKeys.mine(), queryFn: getMyClubs })
  const myCourses = useQuery({ ...getLmsMyCoursesQuery(), enabled: mode === "club" })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["activities"] })
  const request = useMutation({
    mutationFn: (pair: Pair) => requestClubCourseLink(pair.clubId, pair.courseId),
    onSuccess: (link) => {
      setQuery("")
      setNotice(link.status === "active" ? t("club.linked") : t("club.requested"))
      void refresh()
    },
  })
  const confirm = useMutation({
    mutationFn: (pair: Pair) => confirmClubCourseLink(pair.clubId, pair.courseId),
    onSuccess: () => {
      setNotice(t("club.linked"))
      void refresh()
    },
  })
  const unlink = useMutation({
    mutationFn: (pair: Pair) => unlinkClubCourse(pair.clubId, pair.courseId),
    onSuccess: () => {
      setNotice(t("club.unlinked"))
      void refresh()
    },
  })
  const failure = request.error ?? confirm.error ?? unlink.error

  const clubList = clubs.data ?? []
  const courseList = myCourses.data?.managed ?? []
  const nameOfClub = (id: string) => {
    const club = clubList.find((item) => item.id === id)
    return club ? clubName(club.name, locale) : t("club.unknownClub")
  }
  const nameOfCourse = (id: string) => courseList.find((item) => item.id === id)?.title ?? t("club.unknownCourse")
  const needle = query.trim().toLowerCase()

  const pairOf = (link: ClubCourseLink): Pair => ({ clubId: link.club_id, courseId: link.course_id })
  const busy = request.isPending || confirm.isPending || unlink.isPending

  const header = (
    <div className="flex flex-col gap-2">
      {mode === "course" && courseId ? (
        <Link href={`/edit/settings/?id=${courseId}`} className="text-muted-foreground inline-flex min-h-11 items-center gap-1 self-start text-sm md:min-h-8">
          <Icons.chevronLeft className="size-4" aria-hidden />
          {t("club.backCourse")}
        </Link>
      ) : null}
      <h2 id="course-club" className="text-xl font-semibold text-balance">
        {mode === "course" ? t("club.titleCourse") : t("club.titleClub", { club: clubId ? nameOfClub(clubId) : "" })}
      </h2>
      <p className="text-muted-foreground text-sm">{mode === "course" ? t("club.hintCourse") : t("club.hintClub")}</p>
    </div>
  )

  const feedback = (
    <>
      {notice ? (
        <p role="status" className="bg-muted rounded-lg p-3 text-sm">
          {notice}
        </p>
      ) : null}
      {failure ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(failure)}</AlertDescription>
        </Alert>
      ) : null}
    </>
  )

  if (scope === undefined) {
    return (
      <section aria-labelledby="course-club" className="flex flex-col gap-4">
        {header}
        <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">{t("club.noScope")}</p>
      </section>
    )
  }

  const search = (
    <div className="relative">
      <Icons.search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
      <Input
        id="club-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={mode === "course" ? t("club.search") : t("club.searchCourse")}
        className="min-h-11 pl-9 md:min-h-9"
      />
    </div>
  )

  const rows = links.data ?? []
  const linkedTo = (link: ClubCourseLink) => (mode === "course" ? link.club_id : link.course_id)
  // A request waiting for the other side is confirmed from the side that did not ask.
  const waitingForMe = (link: ClubCourseLink) => link.status === "pending" && link.requested_side !== mode

  const linkList =
    rows.length > 0 ? (
      <ul className="divide-y rounded-lg border">
        {rows.map((link) => {
          const label = mode === "course" ? nameOfClub(link.club_id) : nameOfCourse(link.course_id)
          return (
            <li key={link.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                {mode === "club" ? (
                  <Link href={`/edit/settings/?id=${link.course_id}`} className="block truncate font-medium hover:underline">
                    {label}
                  </Link>
                ) : (
                  <p className="truncate font-medium">{label}</p>
                )}
                {link.status === "pending" ? (
                  <p className="text-muted-foreground text-sm">{waitingForMe(link) ? t("club.needsMe") : t("club.awaiting")}</p>
                ) : null}
              </div>
              <div className="flex gap-2">
                {waitingForMe(link) ? (
                  <Button type="button" className="min-h-11 md:min-h-8" disabled={busy} onClick={() => confirm.mutate(pairOf(link))}>
                    {t("club.confirm")}
                  </Button>
                ) : null}
                <Button type="button" variant="outline" className="min-h-11 md:min-h-8" disabled={busy} onClick={() => unlink.mutate(pairOf(link))}>
                  {link.status === "pending" ? (waitingForMe(link) ? t("club.decline") : t("club.cancelRequest")) : t("club.unlink")}
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    ) : (
      <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">{mode === "course" ? t("club.none") : t("club.noCourses")}</p>
    )

  const taken = new Set(rows.map(linkedTo))
  const candidates =
    mode === "course"
      ? clubList.filter((club: MyClub) => !taken.has(club.id) && clubName(club.name, locale).toLowerCase().includes(needle))
      : courseList.filter((course) => !taken.has(course.id) && course.title.toLowerCase().includes(needle))

  return (
    <section aria-labelledby="course-club" className="flex flex-col gap-4" data-testid={mode === "course" ? "course-club" : "club-courses"}>
      {header}
      {links.isPending ? <p className="text-muted-foreground text-sm">{t("club.loading")}</p> : links.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(links.error)}</AlertDescription>
        </Alert>
      ) : (
        linkList
      )}
      {feedback}
      <div className="flex flex-col gap-2">
        <label htmlFor="club-search" className="text-sm font-medium">
          {mode === "course" ? t("club.attach") : t("club.attachCourse")}
        </label>
        {search}
        {candidates.length === 0 ? (
          <p className="text-muted-foreground text-sm">{mode === "course" ? t("club.empty") : t("club.emptyCourses")}</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {candidates.map((item) => {
              const id = item.id
              const label = "title" in item ? item.title : clubName(item.name, locale)
              return (
                <li key={id} className="flex items-center justify-between gap-3 p-3">
                  <p className="min-w-0 truncate font-medium">{label}</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 shrink-0 md:min-h-8"
                    disabled={busy}
                    onClick={() => request.mutate(mode === "course" ? { clubId: id, courseId: scope } : { clubId: scope, courseId: id })}
                  >
                    {t("club.pick")}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
