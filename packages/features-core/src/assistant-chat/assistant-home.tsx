"use client"

import type { FileItem } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { useRouter } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { limitState } from "./limit-info"
import { storePendingTurn } from "./pending-turn"
import { slashInfo, type SlashName } from "./slash-commands"
import { PillComposer, type PillSendOptions } from "./pill-composer"
import { smartState } from "./limit-info"
import { useCreateChat, useUsage, type ChatTier } from "./use-assistant-queries"
import { writeWebSwitch } from "./use-web-switch"
import { useAssistantScope } from "./assistant-context"

const CHIPS = ["explain", "cards", "quiz", "summary", "mindmap", "table"] as const satisfies readonly SlashName[]
const CHIPS_SHOWN = 4
const GREETINGS = 4
const CHIPS_STORAGE_KEY = "ihsp.assistant.chips"

/** Which of the six command chips come first: moves on by one on every visit so all of them get seen. */
function nextChipOffset(): number {
  try {
    const visits = Number(window.localStorage.getItem(CHIPS_STORAGE_KEY) ?? "0")
    const current = Number.isFinite(visits) && visits >= 0 ? Math.floor(visits) : 0
    window.localStorage.setItem(CHIPS_STORAGE_KEY, String(current + 1))
    return current % CHIPS.length
  } catch {
    return 0
  }
}

type AssistantHomeProps = {
  basePath: string
  /** Sidebar buttons of the workspace for the top bar. */
  navButtons: ReactNode
  /** Compact usage meter (phones, hidden sidebar). */
  trailing?: ReactNode
}

/**
 * `/assistant/`: a greeting, the pill composer and suggestion chips. The first message creates the chat, leaves its
 * text for the chat page (`sessionStorage`) and opens `<basePath>/chat/?id=…`, where the turn runs.
 */
export function AssistantHome({ basePath, navButtons, trailing }: AssistantHomeProps) {
  const t = useT("assistant")
  const router = useRouter()
  const errorMessage = useErrorMessage()
  const { session } = useSession()
  const { assistant, features } = useAssistantScope()
  const usage = useUsage(assistant)
  const createChat = useCreateChat(assistant)
  const [greeting] = useState(() => 1 + Math.floor(Math.random() * GREETINGS))
  const [chipOffset] = useState(nextChipOffset)
  const [tier, setTier] = useState<ChatTier>("fast")
  const smart = smartState(usage.data)
  const smartOut = smart !== null && smart.remaining <= 0
  // The week's smart requests ran out while the picker was on smart: the next chat starts on fast.
  useEffect(() => {
    if (smartOut && tier === "smart") setTier("fast")
  }, [smartOut, tier])
  const [prefill, setPrefill] = useState<{ key: number; command: SlashName } | null>(null)
  const [error, setError] = useState<unknown>(null)

  const name = session?.user.first_name ?? ""
  const tSlash = useT("assistant.slash")
  // Study chips (cards, quiz, summary, mind map, table) belong to the student assistant.
  const pool = features.notebooks ? CHIPS : CHIPS.filter((chip) => chip === "explain")
  const chips = Array.from(
    { length: Math.min(CHIPS_SHOWN, pool.length) },
    (_, index) => pool[(chipOffset + index) % pool.length] ?? "explain",
  )

  async function handleSend(text: string, files: FileItem[], options?: PillSendOptions): Promise<boolean> {
    setError(null)
    const web = options?.webSearch === true
    try {
      const chat = await createChat.mutateAsync({ tier })
      storePendingTurn(chat.id, { text, file_ids: files.map((file) => file.id), ...(web ? { web } : {}) })
      // The new chat starts with the switch the student had on, so the follow-ups keep searching.
      if (web) writeWebSwitch(chat.id, true)
      router.push(`${basePath}/chat/?id=${encodeURIComponent(chat.id)}`)
      return true
    } catch (failure) {
      setError(failure)
      return false
    }
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-1 px-2 md:px-4">
        {navButtons}
        <span className="ms-auto">{trailing}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 pb-14">
        <div className="flex w-full max-w-3xl flex-col gap-8">
          <h2 className="text-center text-3xl font-medium tracking-tight text-balance md:text-5xl">
            {t(`home.greeting${greeting}`, { name })}
          </h2>
          <div className="flex flex-col gap-3">
            <PillComposer
              sending={createChat.isPending}
              limit={limitState(usage.data)}
              onSend={handleSend}
              placeholder={t("home.placeholder")}
              tier={{ value: tier, onChange: setTier, smart }}
              prefill={prefill}
              autoFocus
            />
            {error ? (
              <p role="alert" className="text-destructive text-center text-sm">
                {errorMessage(error)}
              </p>
            ) : null}
          </div>
          <ul aria-label={t("home.chips")} className="hidden flex-wrap justify-center gap-2 md:flex">
            {chips.map((chip) => {
              const Icon = slashInfo(chip).icon
              return (
                <li key={chip}>
                  <button
                    type="button"
                    title={tSlash(`${chip}.hint`)}
                    className="bg-background hover:bg-muted focus-visible:ring-ring/50 inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm outline-none focus-visible:ring-3 md:min-h-10"
                    onClick={() => setPrefill((current) => ({ key: (current?.key ?? 0) + 1, command: chip }))}
                  >
                    <Icon className="text-primary size-4" aria-hidden />
                    {tSlash(`${chip}.title`)}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
