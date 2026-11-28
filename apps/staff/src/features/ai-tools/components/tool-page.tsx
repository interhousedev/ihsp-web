"use client"

import { BackLink } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import {
  AiMark,
  Button,
  IconCheck,
  IconCopy,
  Spinner,
  IconSparkles,
  Input,
  PageContainer,
  StateView,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@ihsp/ui"
import { parseAsString, useQueryState } from "nuqs"
import { useState } from "react"
import {
  useBankPick,
  useBankTopics,
  toListQuestion,
  useRunTool,
  useSubjects,
  type ToolResult,
} from "../hooks/use-ai-tools"
import { MOCK_LESSON_TOPIC, TOOL_IDS, type Difficulty, type ToolId } from "../mock-data"
import { FieldRow, NativeSelect, SubjectGroupFields, useDefaultSubject, useNotebookName } from "./form-bits"
import { QuestionList } from "./question-list"
import { NotebookHint, NotebookSaved } from "./saved-to"
import { WorkCheckPanel } from "./work-check-panel"

function isTool(id: string | null): id is ToolId {
  return TOOL_IDS.some((tool) => tool === id)
}

const LEVEL_API = { basic: "basic", medium: "intermediate", advanced: "advanced" } as const
const LEVEL_DIFFICULTY = { basic: "easy", medium: "medium", advanced: "hard" } as const
type Level = keyof typeof LEVEL_DIFFICULTY

/** A printable text (handout, plan) set as a formatted sheet, not as raw output. */
function Sheet({ text }: { text: string }) {
  const [title, ...rest] = text.split("\n\n")
  return (
    <article className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-card p-5 leading-relaxed ring-1 md:p-8">
      <h3 className="text-xl font-semibold">{title?.replace(/^#\s*/, "")}</h3>
      {rest.map((p) => (
        <p key={p} className="break-words">
          {p}
        </p>
      ))}
    </article>
  )
}

function TextResult({
  result,
  tool,
  destination,
}: {
  result: Extract<ToolResult, { kind: "text" }>
  tool: ToolId
  destination: string
}) {
  const t = useT("aiTools")
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setCopied(true)
            void navigator.clipboard?.writeText(result.text)
          }}
        >
          {copied ? <IconCheck aria-hidden /> : <IconCopy aria-hidden />}
          {copied ? t("result.copied") : t("result.copy")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const url = URL.createObjectURL(new Blob([result.text], { type: "text/markdown" }))
            const link = document.createElement("a")
            link.href = url
            link.download = `${tool}.md`
            link.click()
            URL.revokeObjectURL(url)
          }}
        >
          {t("result.download")}
        </Button>
      </div>
      <Sheet text={result.text} />
      <NotebookSaved destination={destination} />
    </div>
  )
}

/** `/ai-tools/tool/?id=…&topic=…&subject=…`: the form of one teacher tool and its result. */
export function ToolPage() {
  const t = useT("aiTools")
  const [id] = useQueryState("id", parseAsString)
  const [topicParam] = useQueryState("topic", parseAsString)
  const [subjectParam] = useQueryState("subject", parseAsString)
  const [sourceParam] = useQueryState("source", parseAsString)
  const [groupParam] = useQueryState("group", parseAsString)
  if (id === "workCheck") {
    return (
      <PageContainer title={t("tools.workCheck.name")} className="pb-28 md:pb-6">
        <BackLink href="/ai-tools/" label={t("title")} />
        <p className="text-muted-foreground mx-auto w-full max-w-3xl text-sm">{t("tools.workCheck.desc")}</p>
        <WorkCheckPanel />
      </PageContainer>
    )
  }
  if (!isTool(id)) {
    return (
      <PageContainer title={t("title")}>
        <StateView state="empty" emptyText={t("result.empty")} />
      </PageContainer>
    )
  }
  return (
    <ToolForm
      tool={id}
      initialTopic={topicParam ?? MOCK_LESSON_TOPIC}
      initialSubject={subjectParam ?? ""}
      initialGroup={groupParam ?? ""}
      initialSource={sourceParam === "bank" ? "bank" : "ai"}
    />
  )
}

type Source = "ai" | "bank"

function ToolForm({
  tool,
  initialTopic,
  initialSubject,
  initialGroup,
  initialSource,
}: {
  tool: ToolId
  initialTopic: string
  initialSubject: string
  initialGroup: string
  initialSource: Source
}) {
  const t = useT("aiTools")
  const { result, pending, error, run } = useRunTool(tool)
  const { picked, pending: picking, pick } = useBankPick()
  const { subjects } = useSubjects()
  const [source, setSource] = useState<Source>(initialSource)
  const [topic, setTopic] = useState(initialTopic)
  const [groupId, setGroupId] = useState(initialGroup)
  const defaultSubject = useDefaultSubject()
  const [subjectChoice, setSubjectChoice] = useState(initialSubject)
  const subjectId = subjectChoice || defaultSubject
  const [bankTopic, setBankTopic] = useState("")
  const [difficulty, setDifficulty] = useState<Difficulty | "any">("any")
  const [level, setLevel] = useState<Level>("medium")
  const [language, setLanguage] = useState("ru")
  const [count, setCount] = useState(5)
  const [nonce, setNonce] = useState(0)
  const fromBank = tool === "questions" && source === "bank"
  const { topics } = useBankTopics(fromBank ? subjectId : "")
  const available =
    bankTopic === ""
      ? topics.reduce((sum, x) => sum + x.count, 0)
      : (topics.find((x) => x.topic === bankTopic)?.count ?? 0)
  const counts = [5, 10, 15, 20].filter((n) => n <= available)
  if (available > 0 && !counts.includes(available) && available < 20) counts.push(available)
  const safeCount = counts.includes(count) ? count : (counts[counts.length - 1] ?? 0)
  const destination = useNotebookName(subjectId, groupId)
  const doPick = () => {
    pick({ subjectId, topic: bankTopic, difficulty, count: safeCount })
    setNonce((n) => n + 1)
  }
  const topicName = bankTopic === "" ? null : bankTopic
  return (
    <PageContainer
      title={t(`tools.${tool}.name`)}
      badge={fromBank ? null : <AiMark label={t("result.aiMark")} />}
      className="pb-28 md:pb-6"
    >
      <BackLink href="/ai-tools/" label={t("title")} />
      <p className="text-muted-foreground max-w-2xl text-sm">{t(`tools.${tool}.desc`)}</p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <form
          className="bg-card ring-foreground/10 flex flex-col gap-4 self-start rounded-card p-4 ring-1"
          onSubmit={(e) => {
            e.preventDefault()
            if (fromBank) doPick()
            else
              run({
                subjectId,
                groupId: groupId || null,
                topic,
                level: LEVEL_API[level],
                language,
                count,
                planMinutes: 45,
              })
          }}
        >
          {tool === "questions" ? (
            <Tabs value={source} onValueChange={(v) => setSource(v as Source)}>
              <TabsList className="w-full">
                <TabsTrigger value="ai" className="flex-1">
                  {t("questions.sourceAi")}
                </TabsTrigger>
                <TabsTrigger value="bank" className="flex-1">
                  {t("questions.sourceBank")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : null}
          {fromBank ? (
            <>
              <FieldRow label={t("form.subject")} htmlFor="f-subject">
                <NativeSelect
                  id="f-subject"
                  value={subjectId}
                  onChange={(e) => {
                    setSubjectChoice(e.target.value)
                    setBankTopic("")
                  }}
                >
                  {subjects.map((s) => (
                    <option key={s.subject_id} value={s.subject_id}>
                      {s.name}
                    </option>
                  ))}
                </NativeSelect>
              </FieldRow>
              <FieldRow label={t("form.emisTopic")} htmlFor="f-etopic">
                <NativeSelect id="f-etopic" value={bankTopic} onChange={(e) => setBankTopic(e.target.value)}>
                  <option value="">{t("bank.allTopics")}</option>
                  {topics.map((x) => (
                    <option key={x.topic} value={x.topic}>
                      {x.topic} ({x.count})
                    </option>
                  ))}
                </NativeSelect>
              </FieldRow>
              <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                <FieldRow label={t("form.difficulty")} htmlFor="f-diff">
                  <NativeSelect
                    id="f-diff"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty | "any")}
                  >
                    <option value="any">{t("form.anyDifficulty")}</option>
                    {(["easy", "medium", "hard"] as const).map((d) => (
                      <option key={d} value={d}>
                        {t(`difficulty.${d}`)}
                      </option>
                    ))}
                  </NativeSelect>
                </FieldRow>
                <FieldRow label={t("form.count")} htmlFor="f-count">
                  <NativeSelect
                    id="f-count"
                    value={safeCount}
                    disabled={available === 0}
                    onChange={(e) => setCount(Number(e.target.value))}
                  >
                    {counts.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </NativeSelect>
                </FieldRow>
              </div>
              <div className="flex flex-col gap-2 text-sm" aria-live="polite">
                <p className={available === 0 ? "text-destructive font-medium" : "font-medium"}>
                  {topicName
                    ? t("questions.inBankTopic", { n: available })
                    : t("questions.inBankSubject", { n: available })}
                </p>
                {available > 0 && available < 5 ? (
                  <p className="text-muted-foreground">{t("questions.bankFew", { n: available })}</p>
                ) : null}
                {available === 0 ? (
                  <>
                    <p className="text-muted-foreground">{t("questions.bankNone")}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="self-start"
                      onClick={() => setSource("ai")}
                    >
                      <IconSparkles aria-hidden />
                      {t("questions.createWithAi")}
                    </Button>
                  </>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <FieldRow label={t("form.topic")} htmlFor="f-topic">
                <Input
                  id="f-topic"
                  value={topic}
                  placeholder={t("form.topicPlaceholder")}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-11 md:min-h-8"
                />
              </FieldRow>
              <SubjectGroupFields
                subjectId={subjectId}
                groupId={groupId}
                onSubject={setSubjectChoice}
                onGroup={setGroupId}
              />
              <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                <FieldRow label={t("form.level")} htmlFor="f-level">
                  <NativeSelect id="f-level" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
                    {(["basic", "medium", "advanced"] as const).map((l) => (
                      <option key={l} value={l}>
                        {t(`form.levels.${l}`)}
                      </option>
                    ))}
                  </NativeSelect>
                </FieldRow>
                <FieldRow label={t("form.language")} htmlFor="f-lang">
                  <NativeSelect id="f-lang" value={language} onChange={(e) => setLanguage(e.target.value)}>
                    {(["ru", "uz", "en"] as const).map((l) => (
                      <option key={l} value={l}>
                        {t(`langs.${l}`)}
                      </option>
                    ))}
                  </NativeSelect>
                </FieldRow>
              </div>
              {tool === "questions" ? (
                <FieldRow label={t("form.count")} htmlFor="f-count">
                  <NativeSelect id="f-count" value={count} onChange={(e) => setCount(Number(e.target.value))}>
                    {[5, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </NativeSelect>
                </FieldRow>
              ) : null}
              <NotebookHint destination={destination} />
            </>
          )}
          <Button type="submit" disabled={pending || picking || subjectId === "" || (fromBank && available === 0)}>
            {pending ? <Spinner /> : <IconSparkles aria-hidden />}
            {fromBank
              ? t("questions.pick")
              : pending
                ? t("form.generating")
                : result
                  ? t("form.regenerate")
                  : t("form.generate")}
          </Button>
        </form>
        <section aria-live="polite" className="flex min-w-0 flex-col gap-3">
          <h2 className="text-lg font-semibold">{t("result.title")}</h2>
          {fromBank ? (
            picked === null ? (
              <StateView state="empty" emptyText={t("questions.bankEmpty")} />
            ) : (
              <QuestionList
                key={nonce}
                questions={picked.questions.map((q) => toListQuestion(q.id, q))}
                subjectId={subjectId}
                onShuffle={doPick}
              />
            )
          ) : (
            <>
              {pending ? <StateView state="loading" /> : null}
              {error ? <p className="text-destructive text-sm">{t("result.failed")}</p> : null}
              {!pending && result === null ? <StateView state="empty" emptyText={t("result.empty")} /> : null}
              {result?.kind === "questions" ? (
                <QuestionList
                  key={result.questions.length + String(nonce)}
                  questions={result.questions}
                  destination={destination}
                  subjectId={subjectId}
                  difficulty={LEVEL_DIFFICULTY[level]}
                  topic={topic}
                  canSaveToBank
                />
              ) : null}
              {result?.kind === "text" ? <TextResult result={result} tool={tool} destination={destination} /> : null}
            </>
          )}
        </section>
      </div>
    </PageContainer>
  )
}
