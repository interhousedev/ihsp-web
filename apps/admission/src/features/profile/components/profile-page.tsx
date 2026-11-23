"use client"

import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { buttonVariants, Skeleton, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AppPageHeader, PageSection, pageClass, ProgressRing } from "../../../components/lib/page"
import { UnderlineTabs } from "../../../components/lib/underline-tabs"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { WordsBody } from "../../words/components/words-page"
import { useProfileDetails } from "../details-api"
import { useProfile, useWizardConfig } from "../api"
import { useProfileText } from "../lib/use-profile-text"
import { isAnswered, sectionsOf, visibleQuestions } from "../lib/visibility"
import type { AdmissionConfig, Profile } from "../types"
import { InterestChips } from "./interest-chips"
import { StudyFieldsPicker } from "./study-fields-picker"
import { MissingDetails } from "./missing-details"
import { StoryCards } from "./story-cards"

type Tab = "details" | "background"

function DetailsTab({ config, profile }: { config: AdmissionConfig; profile: Profile }) {
  const t = useT("profilePage")
  const text = useProfileText()
  const questions = visibleQuestions(config, { answers: profile.answers, accountKind: profile.account_kind })
  return (
    <div className="flex flex-col gap-10">
      <PageSection title={t("details")}>
        <ul className="grid gap-4 md:grid-cols-2">
          {sectionsOf(questions).map((section) => {
            const own = questions.filter((question) => question.section === section)
            const done = own.filter((question) => isAnswered(profile.answers[question.id])).length
            const first = own.find((question) => !isAnswered(profile.answers[question.id])) ?? own[0]
            return (
              <li
                key={section}
                className="bg-card border-hairline rounded-card flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border p-5"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <h3 className="font-semibold">{text.section(section)}</h3>
                  <p className="text-muted-foreground text-sm whitespace-nowrap tabular-nums">
                    {t("storyAnswered", { done, total: own.length })}
                  </p>
                </div>
                <Link
                  href={`/setup/?q=${first?.id ?? ""}`}
                  className={`${buttonVariants({ variant: "outline", size: "sm" })} shrink-0`}
                >
                  {done === own.length ? t("review") : t("continue")}
                </Link>
              </li>
            )
          })}
        </ul>
      </PageSection>
      <section id="three-words" aria-labelledby="three-words-title" className="flex scroll-mt-20 flex-col gap-4">
        <h2 id="three-words-title" className="text-lg font-semibold">
          {t("threeWords")}
        </h2>
        <WordsBody />
      </section>
    </div>
  )
}

function BackgroundTab({ config, profile }: { config: AdmissionConfig; profile: Profile }) {
  const t = useT("profilePage")
  return (
    <div className="flex flex-col gap-10">
      <PageSection title={t("story.title")}>
        <StoryCards initial={profile} questions={config.questions} />
      </PageSection>
      <section id="interests" aria-labelledby="interests-title" className="flex scroll-mt-20 flex-col gap-4">
        <h2 id="interests-title" className="text-lg font-semibold">
          {t("interests.fields")}
        </h2>
        <StudyFieldsPicker />
      </section>
      <section id="interest-areas" aria-labelledby="areas-title" className="flex scroll-mt-20 flex-col gap-4">
        <h2 id="areas-title" className="text-lg font-semibold">
          {t("interests.areas")}
        </h2>
        <InterestChips kind="fields" />
      </section>
      <section id="services" aria-labelledby="services-title" className="flex scroll-mt-20 flex-col gap-4">
        <h2 id="services-title" className="text-lg font-semibold">
          {t("interests.services")}
        </h2>
        <InterestChips kind="services" />
      </section>
    </div>
  )
}

/** The profile content; `base` is the URL prefix the sub-tab (`details`, `background`) is written after. */
export function ProfileBody({ base = "/profile/?section=" }: { base?: string }) {
  const t = useT("profilePage")
  const router = useRouter()
  const params = useSearchParams()
  const { session } = useSession()
  const details = useProfileDetails()
  const config = useWizardConfig()
  const profile = useProfile()
  const wanted = params.get("section") ?? params.get("tab")
  const tab: Tab = wanted === "background" ? "background" : "details"

  if (details.isError || config.isError || profile.isError) {
    return (
      <StateView
        state="error"
        error={details.error ?? config.error ?? profile.error}
        onRetry={() => {
          void details.refetch()
          void config.refetch()
          void profile.refetch()
        }}
      />
    )
  }
  if (!details.data || !config.data || !profile.data) return <Skeleton className="h-96 w-full" />
  const name = session ? `${session.user.first_name} ${session.user.last_name}`.trim() : ""

  return (
    <>
      <header className="flex items-center gap-6">
        <ProgressRing percent={details.data.completion_percent} label={t("completion")} size={112} />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="truncate text-xl font-semibold">{name}</h2>
          <p className="text-muted-foreground text-sm">
            {t("completionText", { percent: details.data.completion_percent })}
          </p>
        </div>
      </header>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <UnderlineTabs
            label={t("title")}
            tabs={[
              { value: "details", label: t("details"), icon: "userPen" },
              { value: "background", label: t("background"), icon: "journal" },
            ]}
            value={tab}
            onValueChange={(next) => router.replace(`${base}${next}`)}
          />
          {tab === "details" ? (
            <DetailsTab config={config.data} profile={profile.data} />
          ) : (
            <BackgroundTab config={config.data} profile={profile.data} />
          )}
        </div>
        <MissingDetails missing={details.data.missing} />
      </div>
    </>
  )
}

/** `/profile/`: completion, the setup answers by section, the three words, "Your story" and the interests. */
export function ProfilePage() {
  const t = useT("profilePage")
  return (
    <AdmissionShell>
      <div className={pageClass()}>
        <AppPageHeader icon="profile" title={t("title")} />
        <ProfileBody />
      </div>
    </AdmissionShell>
  )
}
