"use client"

import { getMyBadgesQuery, getUserBadgesQuery, type BadgePublic, type EarnedBadge, type LockedBadge } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { QueryState } from "@ihsp/features-core"
import { useFormatters, useLocale, useT } from "@ihsp/i18n"
import { Card, CardContent, Icons, PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { localized } from "../utils/labels"
import { BadgeMedal } from "./badge-medal"

/**
 * `/profile/` (and `/profile/?user=`): the LMS profile with the earned badges. On one's own profile the locked badges of
 * courses that show them appear as goals with their hint.
 */
export function ProfilePage({ userId }: { userId: string | null }) {
  const t = useT("badges")
  const { session } = useSession()
  const own = userId === null || userId === session?.user.id
  const name = own && session ? `${session.user.last_name} ${session.user.first_name}` : undefined
  return (
    <PageContainer title={t("profile.title")} meta={name}>
      <div className="flex flex-col gap-6 px-4 pt-4 pb-10 md:px-6">
        {own ? <MyBadgesView /> : <UserBadgesView userId={userId} />}
      </div>
    </PageContainer>
  )
}

function MyBadgesView() {
  const t = useT("badges")
  const query = useQuery(getMyBadgesQuery())
  return (
    <QueryState query={query}>
      {(data) => (
        <>
          <EarnedSection items={data.earned} />
          {data.locked.length > 0 ? (
            <section aria-labelledby="badges-locked" className="flex flex-col gap-3">
              <h2 id="badges-locked" className="text-lg font-semibold">
                {t("profile.locked", { count: data.locked.length })}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {data.locked.map((item) => (
                  <LockedCard key={`${item.course_id}-${item.badge.id}`} item={item} />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </QueryState>
  )
}

function UserBadgesView({ userId }: { userId: string }) {
  const query = useQuery(getUserBadgesQuery(userId))
  return <QueryState query={query}>{(data) => <EarnedSection items={data.earned} />}</QueryState>
}

function EarnedSection({ items }: { items: EarnedBadge[] }) {
  const t = useT("badges")
  const { date: formatDate } = useFormatters()
  return (
    <section aria-labelledby="badges-earned" className="flex flex-col gap-3">
      <h2 id="badges-earned" className="text-lg font-semibold">
        {t("profile.earned", { count: items.length })}
      </h2>
      {items.length === 0 ? (
        <StateView state="empty" title={t("profile.emptyTitle")} description={t("profile.emptyHint")} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" data-testid="badges-earned">
          {items.map((item) => (
            <li key={`${item.course_id}-${item.badge.id}`}>
              <BadgeTile badge={item.badge} course={item.course_title}>
                <p className="text-muted-foreground text-xs">{formatDate(item.awarded_at)}</p>
              </BadgeTile>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function BadgeTile({ badge, course, children }: { badge: BadgePublic; course: string; children?: React.ReactNode }) {
  const locale = useLocale()
  const name = localized(badge.name, locale)
  return (
    <Card className="h-full" title={localized(badge.description, locale)}>
      <CardContent className="flex flex-col items-center gap-2 text-center">
        <BadgeMedal design={badge.design} size={72} />
        <p className="text-sm font-semibold break-words">{name}</p>
        <p className="text-muted-foreground line-clamp-2 text-xs">{course}</p>
        {children}
      </CardContent>
    </Card>
  )
}

function LockedCard({ item }: { item: LockedBadge }) {
  const t = useT("badges")
  const locale = useLocale()
  return (
    <li>
      <Card className="h-full border-dashed">
        <CardContent className="flex items-start gap-3">
          <span className="relative">
            <BadgeMedal design={item.badge.design} size={56} locked />
            <Icons.lock aria-hidden className="bg-background absolute -end-1 -bottom-1 size-5 rounded-full p-0.5" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="font-semibold break-words">{localized(item.badge.name, locale)}</p>
            <p className="text-muted-foreground text-xs">{item.course_title}</p>
            <p className="text-sm">
              <span className="sr-only">{t("profile.goal")}: </span>
              {localized(item.badge.description, locale) || t(`hint.${item.hint}`)}
            </p>
          </div>
        </CardContent>
      </Card>
    </li>
  )
}
