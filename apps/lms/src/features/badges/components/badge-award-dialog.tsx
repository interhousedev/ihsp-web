"use client"

import { badgeKeys, getMyBadgesQuery, postBadgeAwardSeen, type MyBadges } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useLocale, useT } from "@ihsp/i18n"
import { Button, ResponsiveDialog } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { localized } from "../utils/labels"
import { BadgeMedal } from "./badge-medal"

/** Rays behind the medal; drawn only when the user allows motion. */
const RAYS = Array.from({ length: 12 }, (_, i) => i * 30)

/**
 * Celebrates badges the learner has not seen yet, one at a time; closing marks the award seen. The burst animates with
 * `motion-safe:` only, so `prefers-reduced-motion` shows a still medal.
 */
export function BadgeAwardDialog() {
  const t = useT("badges")
  const locale = useLocale()
  const { status } = useSession()
  const queryClient = useQueryClient()
  const mine = useQuery({ ...getMyBadgesQuery(), enabled: status === "authenticated", staleTime: 60_000 })
  const award = mine.data?.earned.find((item) => mine.data.unseen.includes(item.award_id)) ?? null
  const seen = useMutation({
    mutationFn: (awardId: string) => postBadgeAwardSeen(awardId),
    onMutate: (awardId) => {
      queryClient.setQueryData<MyBadges>(badgeKeys.mine(), (old) =>
        old ? { ...old, unseen: old.unseen.filter((id) => id !== awardId) } : old,
      )
    },
  })
  if (!award) return null
  const name = localized(award.badge.name, locale)
  const close = () => seen.mutate(award.award_id)
  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => !open && close()}
      title={t("award.title")}
      description={award.course_title}
      size="sm"
      footer={
        <Button className="min-h-11 w-full md:min-h-9" onClick={close} data-testid="badge-award-ok">
          {t("award.ok")}
        </Button>
      }
    >
      <div className="flex flex-col items-center gap-3 py-2 text-center" data-testid="badge-award">
        <div className="relative flex size-40 items-center justify-center">
          <div aria-hidden className="absolute inset-0 hidden motion-safe:block">
            {RAYS.map((deg) => (
              <span
                key={deg}
                className="absolute start-1/2 top-1/2 h-1 w-16 origin-left"
                style={{ transform: `rotate(${deg}deg) translateX(2.5rem)` }}
              >
                <span
                  className="animate-in fade-in-0 slide-in-from-left-4 block size-full rounded-full opacity-70 duration-700"
                  style={{ backgroundColor: award.badge.design.color }}
                />
              </span>
            ))}
          </div>
          <BadgeMedal
            design={award.badge.design}
            size={112}
            label={name}
            className="motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:spin-in-12 motion-safe:duration-700"
          />
        </div>
        <p className="text-lg font-semibold">{name}</p>
        <p className="text-muted-foreground text-sm">{localized(award.badge.description, locale)}</p>
      </div>
    </ResponsiveDialog>
  )
}
