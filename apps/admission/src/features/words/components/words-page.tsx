"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { ApiError } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  buttonVariants,
  ConfirmDialog,
  Icons,
  Pill,
  Reveal,
  useMotionReduced,
  Skeleton,
  StateView,
  TagInput,
} from "@ihsp/ui"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRef, useState } from "react"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { suggestWords, putWords, useWords, WORDS_KEY, type WordCandidate, type WordsState } from "../api"

const SLOTS = 3

function errorOf(error: unknown): ApiError | null {
  return error instanceof ApiError ? error : null
}

/** The three words (or why they cannot be shown); used by the page and by the profile. */
export function WordsBody() {
  const t = useT("words")
  const query = useWords()
  if (query.isPending) return <Skeleton className="h-40 w-full" />
  if (query.isError) {
    const err = errorOf(query.error)
    return err?.type === "admission/consent_required" ? (
      <StateView
        state="error"
        icon="lock"
        title={t("consentTitle")}
        action={
          <Link href="/settings/#consent" className={buttonVariants()}>
            {t("goConsent")}
          </Link>
        }
      />
    ) : (
      <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
    )
  }
  return <WordsEditor key={query.data.lock_version ?? "new"} initial={query.data} />
}

export function WordsPage() {
  const t = useT("words")
  return (
    <AdmissionShell>
      <div className={pageClass()}>
        <AppPageHeader icon="post" title={t("title")} />
        <WordsBody />
      </div>
    </AdmissionShell>
  )
}

function WordsEditor({ initial }: { initial: WordsState }) {
  const t = useT("words")
  const queryClient = useQueryClient()
  const locked = initial.confirmed_at !== null
  const [editing, setEditing] = useState(!locked)
  const [slots, setSlots] = useState<string[]>(initial.words)
  const [candidates, setCandidates] = useState<WordCandidate[]>(initial.candidates)
  const [thinking, setThinking] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<unknown>(null)
  const run = useRef(0)
  const reduced = useMotionReduced()

  async function suggest() {
    const id = ++run.current
    setThinking(true)
    setFailure(null)
    try {
      const next = await suggestWords()
      if (id === run.current) setCandidates(next.candidates)
    } catch (error) {
      if (id === run.current) setFailure(error)
    } finally {
      if (id === run.current) setThinking(false)
    }
  }

  function cancel() {
    run.current += 1
    setThinking(false)
  }

  async function lock() {
    setSaving(true)
    setFailure(null)
    try {
      const saved = await putWords(slots, initial.lock_version)
      queryClient.setQueryData(WORDS_KEY, saved)
      setEditing(false)
    } catch (error) {
      setFailure(error)
      if (errorOf(error)?.status === 409) await queryClient.invalidateQueries({ queryKey: WORDS_KEY })
    } finally {
      setSaving(false)
      setConfirm(false)
    }
  }

  const err = errorOf(failure)
  const full = slots.length >= SLOTS
  const taken = (word: string) => slots.some((s) => s.toLowerCase() === word.toLowerCase())

  if (!editing) {
    return (
      <div className="flex flex-col gap-4">
        <ul className="flex flex-wrap gap-2" aria-label={t("slots")}>
          {slots.map((word) => (
            <li key={word}>
              <Pill>{word}</Pill>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditing(true)}>
            {t("change")}
          </Button>
          <Link href="/alignment/" className={buttonVariants()}>
            {t("toAlignment")}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">{t("slots")}</h2>
        <TagInput
          value={slots}
          onChange={setSlots}
          max={SLOTS}
          aria-label={t("slots")}
          placeholder={t("placeholder")}
          removeLabel={(tag) => t("remove", { tag })}
        />
        <p className="text-muted-foreground text-xs" aria-live="polite">
          {t("count", { count: slots.length, total: SLOTS })}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-medium">{t("suggestions")}</h2>
          {thinking ? (
            <Button variant="ghost" size="sm" onClick={cancel}>
              {t("cancel")}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => void suggest()}>
              <Icons.sparkles />
              {candidates.length > 0 ? t("again") : t("suggest")}
            </Button>
          )}
        </div>
        {thinking ? (
          <p role="status" className="text-muted-foreground flex items-center gap-2 text-sm">
            <Icons.sparkles className="motion-safe:animate-pulse" />
            {t("thinking")}
          </p>
        ) : null}
        <ul className="flex flex-col gap-2">
          {candidates.map((candidate, index) => {
            const disabled = taken(candidate.word) || full
            return (
              <li key={candidate.word}>
                <Reveal transition={{ duration: 0.18, delay: reduced ? 0 : index * 0.05 }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      aria-disabled={disabled}
                      aria-label={t("add", { word: candidate.word })}
                      onClick={() => {
                        if (!disabled) setSlots([...slots, candidate.word])
                      }}
                    >
                      {candidate.word}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-expanded={open === candidate.word}
                      aria-label={t("why", { word: candidate.word })}
                      onClick={() => setOpen(open === candidate.word ? null : candidate.word)}
                    >
                      <Icons.info />
                    </Button>
                    {open === candidate.word ? (
                      <p className="text-muted-foreground w-full text-sm">{candidate.reason}</p>
                    ) : null}
                  </div>
                </Reveal>
              </li>
            )
          })}
        </ul>
      </section>

      {err?.type === "admission/quota_exceeded" ? (
        <Alert variant="destructive">
          <AlertDescription>
            {t("quota", { limit: String(err.params.limit ?? ""), period: String(err.params.period ?? "") })}
          </AlertDescription>
        </Alert>
      ) : err?.type === "admission/consent_required" ? (
        <Alert variant="destructive">
          <AlertDescription>
            {t("consentTitle")} <Link href="/settings/#consent">{t("goConsent")}</Link>
          </AlertDescription>
        </Alert>
      ) : err ? (
        <Alert variant="destructive">
          <AlertDescription>{err.status === 409 ? t("conflict") : err.title}</AlertDescription>
        </Alert>
      ) : null}

      <div>
        <Button disabled={slots.length !== SLOTS || saving} onClick={() => setConfirm(true)}>
          <Icons.lock />
          {t("lock")}
        </Button>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t("lockTitle")}
        description={t("lockBody")}
        confirmLabel={t("lock")}
        onConfirm={() => void lock()}
      />
    </div>
  )
}
