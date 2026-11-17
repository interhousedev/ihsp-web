"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, buttonVariants, cn, Icons, Input, Label, Pill, Reveal, StateView, Textarea } from "@ihsp/ui"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { AsideCard, SplitLayout } from "../../../components/lib/split-layout"
import { UnderlineTabs } from "../../../components/lib/underline-tabs"
import { ScrollFade } from "../../../components/scroll-fade"
import { consentQuery } from "../../consent/api"
import { useList } from "../../chooser/hooks"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useScreenContext } from "../../assistant/screen-context"
import { ESSAY_KINDS, useCreateEssay, useEssays, type EssayKind } from "../api"
import { IdeasBoard } from "./ideas-board"
import { LifeStory } from "./life-story"
import { PromptCarousel } from "./prompt-carousel"
import { useEssayLabel } from "./supp-label"

const SELECT = "border-input bg-background h-9 rounded-md border px-3 text-sm"

function NewEssay({ onDone }: { onDone: () => void }) {
  const t = useT("essays")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const create = useCreateEssay()
  const list = useList()
  const [kind, setKind] = useState<EssayKind>("personal_statement")
  const [title, setTitle] = useState("")
  const [prompt, setPrompt] = useState("")
  const [limit, setLimit] = useState("")
  const [entry, setEntry] = useState("")
  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate(
      {
        kind,
        title,
        prompt_text: prompt,
        word_limit: limit ? Number(limit) : null,
        list_entry_id: kind === "supplemental" ? entry || null : null,
      },
      {
        onSuccess: (essay) => {
          onDone()
          router.push(`/essays/edit/?id=${encodeURIComponent(essay.id)}`)
        },
      },
    )
  }
  return (
    <form onSubmit={submit} className="border-hairline flex flex-col gap-3 rounded-card border p-4 animate-in fade-in">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="essay-kind">{t("kindLabel")}</Label>
          <select
            id="essay-kind"
            className={SELECT}
            value={kind}
            onChange={(e) => setKind(e.target.value as EssayKind)}
          >
            {ESSAY_KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`kind.${k}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="essay-limit">{t("wordLimit")}</Label>
          <Input
            id="essay-limit"
            type="number"
            min={1}
            inputMode="numeric"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </div>
      </div>
      {kind === "supplemental" ? (
        <div className="flex flex-col gap-1">
          <Label htmlFor="essay-entry">{t("college")}</Label>
          <select id="essay-entry" className={SELECT} required value={entry} onChange={(e) => setEntry(e.target.value)}>
            <option value="">{t("collegePick")}</option>
            {(list.data ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.institution.name}
              </option>
            ))}
          </select>
          {list.data?.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("collegeEmpty")} <Link href="/chooser/">{t("collegeOpen")}</Link>
            </p>
          ) : null}
        </div>
      ) : null}
      <PromptCarousel onPick={setPrompt} />
      <div className="flex flex-col gap-1">
        <Label htmlFor="essay-title">{t("titleLabel")}</Label>
        <Input id="essay-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="essay-prompt">{t("promptLabel")}</Label>
        <Textarea id="essay-prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      </div>
      {create.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(create.error)}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={create.isPending}>
          {t("create")}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  )
}

const KIND_TONE: Record<string, "primary" | "warning" | "neutral"> = {
  personal_statement: "primary",
  supplemental: "warning",
  other: "neutral",
}

export function EssaysBody() {
  const t = useT("essays")
  const query = useEssays()
  const [adding, setAdding] = useState(false)
  const [group, setGroup] = useState<"colleges" | "scholarships">("colleges")
  const all = query.data?.items ?? []
  const essays = all.filter((e) => (e.kind === "other") === (group === "scholarships"))
  const [tab, setTab] = useState("essays")
  const consent = useQuery(consentQuery())
  const aiGranted = consent.data?.grants.some((g) => g.purpose === "admission_ai" && g.active) === true
  const aiTarget = all[0]
  const { label } = useEssayLabel()
  const finals = essays.filter((e) => e.status === "final").length
  const drafts = essays.length - finals
  const words = essays.reduce((sum, e) => sum + e.word_count, 0)
  useScreenContext({
    title: t("title"),
    summary: `Essays: ${essays.length}. ${essays
      .map(
        (e) =>
          `"${e.title || t("untitled")}" (${e.kind}, ${e.status}, ${e.word_count}${e.word_limit ? `/${e.word_limit}` : ""} words)`,
      )
      .join("; ")}`,
  })
  return (
    <div className={pageClass("narrow")}>
      <AppPageHeader
        icon="post"
        title={t("title")}
        actions={
          adding ? null : (
            <Button type="button" onClick={() => setAdding(true)}>
              <Icons.add aria-hidden />
              {t("new")}
            </Button>
          )
        }
      />
      {adding ? <NewEssay onDone={() => setAdding(false)} /> : null}
      <SplitLayout
        aside={
          <>
            <AsideCard title={t("view.summaryTitle")} icon={<Icons.post aria-hidden className="size-4" />}>
              <dl className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-warning/10 rounded-lg p-2">
                  <dd className="text-lg font-semibold">{drafts}</dd>
                  <dt className="text-muted-foreground text-xs">{t("view.drafts")}</dt>
                </div>
                <div className="bg-success/10 rounded-lg p-2">
                  <dd className="text-lg font-semibold">{finals}</dd>
                  <dt className="text-muted-foreground text-xs">{t("view.finals")}</dt>
                </div>
                <div className="bg-primary/10 rounded-lg p-2">
                  <dd className="text-lg font-semibold">{words}</dd>
                  <dt className="text-muted-foreground text-xs">{t("view.totalWords")}</dt>
                </div>
              </dl>
            </AsideCard>
            <AsideCard
              title={t("coach.title")}
              icon={
                aiGranted ? (
                  <Icons.sparkles aria-hidden className="size-4" />
                ) : (
                  <Icons.lock aria-hidden className="size-4" />
                )
              }
            >
              {consent.isPending ? null : aiGranted ? (
                <div className="flex flex-col gap-2 text-sm">
                  <p className="text-muted-foreground">{t("aiReady")}</p>
                  {aiTarget ? (
                    <Link
                      href={`/essays/edit/?id=${encodeURIComponent(aiTarget.id)}`}
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                    >
                      {t("aiOpen")}
                    </Link>
                  ) : null}
                </div>
              ) : (
                <Link
                  href="/settings/#consent"
                  className={cn(
                    buttonVariants({ variant: "link", size: "sm" }),
                    "h-auto max-w-full shrink justify-start p-0 text-left leading-snug whitespace-normal",
                  )}
                >
                  {t("consentManage")}
                </Link>
              )}
            </AsideCard>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div role="radiogroup" aria-label={t("group.label")} className="flex gap-2">
            {(["colleges", "scholarships"] as const).map((g) => (
              <Button
                key={g}
                type="button"
                size="sm"
                role="radio"
                aria-checked={group === g}
                variant={group === g ? "default" : "outline"}
                onClick={() => setGroup(g)}
              >
                {t(`group.${g}`)}
              </Button>
            ))}
          </div>
          <UnderlineTabs
            label={t("view.tabs")}
            value={tab}
            onValueChange={setTab}
            tabs={[
              { value: "essays", label: t("view.essays"), icon: "post", count: essays.length, tone: "primary" },
              { value: "life", label: t("view.life"), icon: "chat" },
              { value: "ideas", label: t("view.ideas"), icon: "sparkles" },
            ]}
          />
          {tab === "ideas" ? (
            <IdeasBoard />
          ) : tab === "life" ? (
            <LifeStory />
          ) : query.isPending ? (
            <StateView state="loading" rows={3} />
          ) : query.isError ? (
            <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
          ) : essays.length === 0 ? (
            <StateView
              state="empty"
              icon={<Icons.post aria-hidden />}
              title={group === "scholarships" ? t("emptyScholarshipTitle") : t("emptyTitle")}
              description={group === "scholarships" ? t("emptyScholarshipText") : t("emptyText")}
            />
          ) : (
            <ScrollFade maxHeight="70vh">
              <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {essays.map((e) => (
                  <li key={e.id}>
                    <Reveal>
                      <Link
                        href={`/essays/edit/?id=${encodeURIComponent(e.id)}`}
                        className="border-hairline hover:bg-muted/40 flex flex-col gap-2 rounded-card border p-4 transition-colors"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <Pill tone={KIND_TONE[e.kind] ?? "neutral"}>{t(`kind.${e.kind}`)}</Pill>
                          <Pill tone={e.status === "final" ? "success" : "warning"}>
                            {e.status === "final" ? t("final") : t("view.drafts")}
                          </Pill>
                        </span>
                        <span className="font-medium">{label(e)}</span>
                        <span className="text-muted-foreground text-sm">
                          {e.word_limit
                            ? t("wordsOf", { count: e.word_count, limit: e.word_limit })
                            : t("words", { count: e.word_count })}
                        </span>
                      </Link>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </ScrollFade>
          )}
        </div>
      </SplitLayout>
    </div>
  )
}

export function EssaysPage() {
  return (
    <AdmissionShell>
      <EssaysBody />
    </AdmissionShell>
  )
}
