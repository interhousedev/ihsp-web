// Notebooks (NotebookLM-style): a ready notebook with three sources, a cited chat turn and one Studio artifact of
// every P1/P2 kind (docs/reference/notebooklm.md § 5.5). Content is English and about photosynthesis.

import type {
  ArtifactDetail,
  ArtifactItem,
  ArtifactKind,
  Citation,
  FlashcardsContent,
  InfographicContent,
  MindMapContent,
  NotebookDetail,
  NotebookItem,
  NotebookMessage,
  NotebookTurn,
  NotebookUsage,
  PassageItem,
  QuizContent,
  RefsIndex,
  ReportContent,
  SlidesContent,
  SourceDetail,
  SourceGuide,
  SourceItem,
  DataTableContent,
  DiscoverResponse,
  LabelItem,
} from "@ihsp/api"
import { webQuota, webResults } from "./ai"
import { courseArtifactDetailOf } from "./course-workspace"
import { FIXTURE_NOW, ids, uuid } from "./world"

export const nbIds = {
  notebook: uuid(30, 1),
  notebookPinned: uuid(30, 2),
  notebookEmpty: uuid(30, 3),
  sourceFile: uuid(31, 1),
  sourceLesson: uuid(31, 2),
  sourceText: uuid(31, 3),
  sourceFailed: uuid(31, 4),
  sourceStale: uuid(31, 5),
  report: uuid(33, 1),
  mindMap: uuid(33, 2),
  flashcards: uuid(33, 3),
  quiz: uuid(33, 4),
  dataTable: uuid(33, 5),
  slides: uuid(33, 6),
  infographic: uuid(33, 7),
  generating: uuid(33, 8),
  failed: uuid(33, 9),
  userMessage: uuid(34, 1),
  assistantMessage: uuid(34, 2),
} as const

/** Passage id: source number 1 to 3 and the passage's `seq`. */
export function passageId(sourceNo: number, seq: number): string {
  return uuid(32, sourceNo * 100 + seq)
}

// - - - Passages and sources - - -

type PassageSeed = { text: string; page?: number; heading?: string }

const passageSeeds: Record<string, PassageSeed[]> = {
  [nbIds.sourceFile]: [
    {
      heading: "Photosynthesis",
      page: 1,
      text: "Photosynthesis is the process by which plants, algae and some bacteria convert light energy into chemical energy stored in glucose. The overall equation is 6CO2 + 6H2O + light -> C6H12O6 + 6O2.",
    },
    {
      page: 1,
      text: "Photosynthesis takes place in chloroplasts. A chloroplast has an outer membrane, an inner membrane, the stroma and stacks of thylakoids called grana. Chlorophyll in the thylakoid membranes absorbs mostly red and blue light and reflects green light.",
    },
    {
      heading: "Light reactions",
      page: 2,
      text: "The light reactions take place in the thylakoid membranes. Light excites electrons in chlorophyll, water is split and oxygen is released. The energy is stored in ATP and NADPH.",
    },
    {
      page: 2,
      text: "Photosystem II splits water: 2H2O -> 4H+ + 4e- + O2. The electrons travel along an electron transport chain, and the proton gradient drives ATP synthase.",
    },
    {
      heading: "Calvin cycle",
      page: 3,
      text: "The Calvin cycle takes place in the stroma. Using ATP and NADPH, the enzyme RuBisCO fixes carbon dioxide into 3-phosphoglycerate, which is reduced to a three-carbon sugar called G3P.",
    },
    {
      page: 3,
      text: "For every three CO2 molecules fixed, one G3P leaves the cycle. Two G3P molecules combine to make one glucose. The rate of photosynthesis depends on light intensity, CO2 concentration and temperature.",
    },
  ],
  [nbIds.sourceLesson]: [
    { text: "Lesson 5. Goal: describe the two stages of photosynthesis and name where they happen." },
    {
      text: "Stage one needs light and happens in the thylakoids. Stage two does not need light directly and happens in the stroma.",
    },
    {
      text: "Limiting factors: if one factor is in short supply, it limits the rate. Increase the light until another factor, such as CO2, becomes limiting.",
    },
    {
      text: "Experiment: pondweed in a beaker produces oxygen bubbles. Count the bubbles per minute at different distances from a lamp.",
    },
  ],
  [nbIds.sourceText]: [
    { text: "Remember: light reactions = thylakoid, Calvin cycle = stroma." },
    { text: "Test on Friday: the equation, the structure of a chloroplast, limiting factors." },
    { text: "Ask the teacher why leaves are green." },
  ],
}

const sourceNumber: Record<string, number> = {
  [nbIds.sourceFile]: 1,
  [nbIds.sourceLesson]: 2,
  [nbIds.sourceText]: 3,
}

/** The passages of a source of the main notebook, numbered from 1 (`seq`). */
export function passagesOf(sourceId: string): PassageItem[] {
  const no = sourceNumber[sourceId]
  const seeds = passageSeeds[sourceId]
  if (!no || !seeds) return []
  return seeds.map((seed, index) => ({
    id: passageId(no, index + 1),
    seq: index + 1,
    text: seed.text,
    page: seed.page ?? null,
    heading: seed.heading ?? null,
  }))
}

const wordCount = (sourceId: string) =>
  passagesOf(sourceId).reduce((sum, passage) => sum + passage.text.split(/\s+/).length, 0)

export const sourceFile: SourceItem = {
  id: nbIds.sourceFile,
  notebook_id: nbIds.notebook,
  kind: "file",
  title: "Biology 10.pdf",
  status: "ready",
  failure: null,
  selected: true,
  position: 1,
  word_count: wordCount(nbIds.sourceFile),
  passage_count: 6,
  origin: null,
  ref: { file_id: ids.file },
  stale: false,
  has_guide: true,
  label_ids: [],
  synced_at: "2026-10-07T04:00:00Z",
  created_at: "2026-10-07T03:59:00Z",
}

export const sourceLesson: SourceItem = {
  id: nbIds.sourceLesson,
  notebook_id: nbIds.notebook,
  kind: "lesson_resource",
  title: "Lesson 5: Photosynthesis",
  status: "ready",
  failure: null,
  selected: true,
  position: 2,
  word_count: wordCount(nbIds.sourceLesson),
  passage_count: 4,
  origin: { subject: "Biology", lesson_date: "2026-10-05", topic: "Photosynthesis", role: "material" },
  ref: { lesson_id: ids.lessonPhysicsToday, link_id: ids.link },
  stale: false,
  has_guide: true,
  label_ids: [],
  synced_at: "2026-10-07T04:01:00Z",
  created_at: "2026-10-07T04:00:00Z",
}

export const sourceText: SourceItem = {
  id: nbIds.sourceText,
  notebook_id: nbIds.notebook,
  kind: "text",
  title: "My notes",
  status: "ready",
  failure: null,
  selected: true,
  position: 3,
  word_count: wordCount(nbIds.sourceText),
  passage_count: 3,
  origin: null,
  ref: {},
  stale: false,
  has_guide: false,
  label_ids: [],
  synced_at: "2026-10-07T04:02:00Z",
  created_at: "2026-10-07T04:02:00Z",
}

/** A source the backend could not read (no text in a scanned PDF). */
export const sourceFailed: SourceItem = {
  id: nbIds.sourceFailed,
  notebook_id: nbIds.notebook,
  kind: "file",
  title: "Scan 0042.pdf",
  status: "failed",
  failure: "no_text",
  selected: false,
  position: 4,
  word_count: 0,
  passage_count: 0,
  origin: null,
  ref: { file_id: ids.fileImage },
  stale: false,
  has_guide: false,
  label_ids: [],
  synced_at: null,
  created_at: "2026-10-07T04:03:00Z",
}

/** A chat source that has newer messages: the row shows "Outdated" and a Sync button. */
export const sourceStale: SourceItem = {
  id: nbIds.sourceStale,
  notebook_id: nbIds.notebook,
  kind: "chat",
  title: "Kinematics revision",
  status: "stale",
  failure: null,
  selected: false,
  position: 5,
  word_count: 120,
  passage_count: 2,
  origin: null,
  ref: { chat_id: ids.chat, until_seq: 2 },
  stale: true,
  has_guide: false,
  label_ids: [],
  synced_at: "2026-10-06T10:00:00Z",
  created_at: "2026-10-06T10:00:00Z",
}

/** The three ready sources of the main notebook. */
export const notebookSources: SourceItem[] = [sourceFile, sourceLesson, sourceText]

export const sourceGuide: SourceGuide = {
  summary:
    "A short chapter on **photosynthesis**: how plants turn light, water and carbon dioxide into glucose and oxygen, and where each stage happens.",
  key_topics: ["Chloroplast structure", "Light reactions", "Calvin cycle", "Limiting factors", "Chlorophyll"],
  questions: [
    "Where do the light reactions take place?",
    "What does RuBisCO do?",
    "Which factors limit the rate of photosynthesis?",
  ],
}

export function sourceDetailOf(source: SourceItem): SourceDetail {
  const editable = source.kind === "text" || source.kind === "note"
  return {
    ...source,
    guide: source.has_guide ? sourceGuide : null,
    body_md: editable
      ? passagesOf(source.id)
          .map((passage) => passage.text)
          .join("\n\n")
      : null,
    editable,
    citations: [],
  }
}

// - - - Notebooks - - -

export const notebookDetail: NotebookDetail = {
  id: nbIds.notebook,
  title: "Photosynthesis",
  emoji: "🌱",
  pinned: false,
  source_count: 3,
  last_opened_at: "2026-10-07T04:30:00Z",
  updated_at: "2026-10-07T04:30:00Z",
  course_id: null,
  can_write: true,
  origin: "manual",
  subject_id: null,
  lesson_id: null,
  auto: null,
  chat_config: { style: "default", custom_prompt: null, length: "default", language: "auto" },
  summary: {
    summary:
      "These sources explain **photosynthesis**: plants turn light energy into chemical energy in the **chloroplasts**. The **light reactions** happen in the thylakoids and the **Calvin cycle** in the stroma. The rate depends on light, CO2 and temperature.",
    key_topics: ["Chloroplast", "Light reactions", "Calvin cycle", "Limiting factors"],
    suggested_questions: [
      "What is the Calvin cycle?",
      "Where do the light reactions take place?",
      "Which factors limit photosynthesis?",
      "Why are leaves green?",
    ],
    generated_at: "2026-10-07T04:05:00Z",
  },
  summary_status: "ready",
  ready_source_count: 3,
  selected_source_count: 3,
  created_at: "2026-10-07T03:58:00Z",
}

export const notebookPinnedDetail: NotebookDetail = {
  id: nbIds.notebookPinned,
  title: "World history",
  emoji: "🏛️",
  pinned: true,
  source_count: 2,
  last_opened_at: "2026-10-06T09:00:00Z",
  updated_at: "2026-10-06T09:00:00Z",
  course_id: null,
  can_write: true,
  origin: "manual",
  subject_id: null,
  lesson_id: null,
  auto: null,
  chat_config: { style: "learning_guide", custom_prompt: null, length: "shorter", language: "ru" },
  summary: null,
  summary_status: "none",
  ready_source_count: 0,
  selected_source_count: 0,
  created_at: "2026-10-01T09:00:00Z",
}

export const notebookEmptyDetail: NotebookDetail = {
  id: nbIds.notebookEmpty,
  title: "Untitled notebook",
  emoji: null,
  pinned: false,
  source_count: 0,
  last_opened_at: null,
  updated_at: "2026-10-07T05:00:00Z",
  course_id: null,
  can_write: true,
  origin: "manual",
  subject_id: null,
  lesson_id: null,
  auto: null,
  chat_config: { style: "default", custom_prompt: null, length: "default", language: "auto" },
  summary: null,
  summary_status: "none",
  ready_source_count: 0,
  selected_source_count: 0,
  created_at: "2026-10-07T05:00:00Z",
}

export function notebookItemOf(detail: NotebookDetail): NotebookItem {
  return {
    id: detail.id,
    title: detail.title,
    emoji: detail.emoji,
    pinned: detail.pinned,
    source_count: detail.source_count,
    last_opened_at: detail.last_opened_at,
    updated_at: detail.updated_at,
    origin: detail.origin,
    subject_id: detail.subject_id,
    lesson_id: detail.lesson_id,
    course_id: detail.course_id,
    can_write: detail.can_write,
  }
}

export const notebookDetails: NotebookDetail[] = [notebookDetail, notebookPinnedDetail, notebookEmptyDetail]
export const notebookItems: NotebookItem[] = notebookDetails.map(notebookItemOf)

// - - - Chat - - -

export const citation1: Citation = {
  n: 1,
  passage_id: passageId(1, 5),
  source_id: nbIds.sourceFile,
  source_title: "Biology 10.pdf",
  source_kind: "file",
  page: 3,
  snippet: "The Calvin cycle takes place in the stroma. Using ATP and NADPH, the enzyme RuBisCO fixes carbon dioxide…",
}

export const citation2: Citation = {
  n: 2,
  passage_id: passageId(2, 2),
  source_id: nbIds.sourceLesson,
  source_title: "Lesson 5: Photosynthesis",
  source_kind: "lesson_resource",
  page: null,
  snippet: "Stage two does not need light directly and happens in the stroma.",
}

export const nbMessageUser: NotebookMessage = {
  id: nbIds.userMessage,
  seq: 1,
  role: "user",
  text: "What is the Calvin cycle?",
  citations: [],
  followups: [],
  source_ids: [nbIds.sourceFile, nbIds.sourceLesson, nbIds.sourceText],
  web: [],
  retrieval: false,
  grounded: false,
  feedback: null,
  stopped: false,
  created_at: "2026-10-07T04:40:00Z",
}

export const nbMessageAssistant: NotebookMessage = {
  id: nbIds.assistantMessage,
  seq: 2,
  role: "assistant",
  text: "The Calvin cycle builds sugar from carbon dioxide ⟦1⟧. It runs in the stroma and does not need light directly ⟦1,2⟧.",
  citations: [citation1, citation2],
  followups: ["Where does it happen?", "What is the role of RuBisCO?", "What is G3P?"],
  source_ids: [nbIds.sourceFile, nbIds.sourceLesson, nbIds.sourceText],
  web: [],
  retrieval: false,
  grounded: true,
  feedback: null,
  stopped: false,
  created_at: "2026-10-07T04:40:05Z",
}

/** An answer with a source chip and a web chip (`⟦w1⟧`); `web` holds the two pages of the search. */
export const nbMessageAssistantWeb: NotebookMessage = {
  ...nbMessageAssistant,
  id: uuid(34, 4),
  text: "The Calvin cycle builds sugar from carbon dioxide ⟦2⟧. Plants also turn light into sugar ⟦w1⟧.",
  citations: [citation2],
  web: webResults,
}

/** An answer the model could not ground in the sources: no citations. */
export const nbMessageAssistantUngrounded: NotebookMessage = {
  ...nbMessageAssistant,
  id: uuid(34, 3),
  text: "The sources do not say. A textbook chapter on plant pigments would help.",
  citations: [],
  followups: [],
  grounded: false,
}

export const notebookUsage: NotebookUsage = {
  budget: {
    session: { used: 120_000, limit: 1_500_000, resets_at: "2026-10-07T08:00:00Z" },
    day: { used: 410_000, limit: 4_000_000, resets_at: "2026-10-08T00:00:00Z" },
  },
  quotas: {
    artifacts: { used: 6, limit: 20, resets_at: "2026-10-08T00:00:00Z" },
    audio_overview: { used: 0, limit: 2, resets_at: "2026-10-08T00:00:00Z" },
    slides: { used: 1, limit: 6, resets_at: "2026-10-08T00:00:00Z" },
    infographic: { used: 1, limit: 6, resets_at: "2026-10-08T00:00:00Z" },
  },
  generating: 0,
  generating_limit: 3,
}

/** Day budget used up: the composer and the Studio tiles are disabled until `resets_at`. */
export const notebookUsageLimitReached: NotebookUsage = {
  ...notebookUsage,
  budget: {
    session: { used: 1_500_000, limit: 1_500_000, resets_at: "2026-10-07T08:00:00Z" },
    day: { used: 4_000_000, limit: 4_000_000, resets_at: "2026-10-08T00:00:00Z" },
  },
}

export function notebookTurn(
  text: string,
  options: { userSeq?: number; sourceIds?: string[]; grounded?: boolean } = {},
): NotebookTurn {
  const userSeq = options.userSeq ?? 3
  const sourceIds = options.sourceIds ?? nbMessageUser.source_ids
  const assistant = options.grounded === false ? nbMessageAssistantUngrounded : nbMessageAssistant
  return {
    user_message: {
      ...nbMessageUser,
      id: uuid(34, 100 + userSeq),
      seq: userSeq,
      text,
      source_ids: sourceIds,
      created_at: FIXTURE_NOW,
    },
    assistant_message: { ...assistant, id: uuid(34, 101 + userSeq), seq: userSeq + 1, source_ids: sourceIds },
    usage: notebookUsage,
    action: null,
  }
}

// - - - Studio artifacts - - -

const refsIndex: RefsIndex = {
  "S1:P1": {
    passage_id: passageId(1, 1),
    source_id: nbIds.sourceFile,
    source_title: "Biology 10.pdf",
    source_kind: "file",
    page: 1,
    snippet: "Photosynthesis is the process by which plants, algae and some bacteria convert light energy…",
  },
  "S1:P2": {
    passage_id: passageId(1, 2),
    source_id: nbIds.sourceFile,
    source_title: "Biology 10.pdf",
    source_kind: "file",
    page: 1,
    snippet: "Photosynthesis takes place in chloroplasts. A chloroplast has an outer membrane…",
  },
  "S1:P3": {
    passage_id: passageId(1, 3),
    source_id: nbIds.sourceFile,
    source_title: "Biology 10.pdf",
    source_kind: "file",
    page: 2,
    snippet: "The light reactions take place in the thylakoid membranes. Light excites electrons…",
  },
  "S1:P5": {
    passage_id: passageId(1, 5),
    source_id: nbIds.sourceFile,
    source_title: "Biology 10.pdf",
    source_kind: "file",
    page: 3,
    snippet: "The Calvin cycle takes place in the stroma. Using ATP and NADPH…",
  },
  "S2:P2": {
    passage_id: passageId(2, 2),
    source_id: nbIds.sourceLesson,
    source_title: "Lesson 5: Photosynthesis",
    source_kind: "lesson_resource",
    page: null,
    snippet: "Stage two does not need light directly and happens in the stroma.",
  },
  "S2:P3": {
    passage_id: passageId(2, 3),
    source_id: nbIds.sourceLesson,
    source_title: "Lesson 5: Photosynthesis",
    source_kind: "lesson_resource",
    page: null,
    snippet: "Limiting factors: if one factor is in short supply, it limits the rate…",
  },
}

const sourceMap = { S1: nbIds.sourceFile, S2: nbIds.sourceLesson, S3: nbIds.sourceText }

export const reportContent: ReportContent = {
  title: "Photosynthesis: conspect",
  markdown: [
    "# Photosynthesis",
    "",
    "## Main idea",
    "Plants turn light energy into chemical energy stored in glucose ⟦1⟧.",
    "",
    "## Plan",
    "1. The chloroplast",
    "2. Light reactions",
    "3. Calvin cycle",
    "",
    "## 1. The chloroplast",
    "- Photosynthesis takes place in **chloroplasts** ⟦2⟧.",
    "- **Chlorophyll** absorbs red and blue light and reflects green ⟦2⟧.",
    "",
    "## 2. Light reactions",
    "- They happen in the **thylakoid membranes**; water is split and oxygen is released ⟦3⟧.",
    "",
    "## 3. Calvin cycle",
    "- It takes place in the **stroma**; RuBisCO fixes carbon dioxide ⟦4,5⟧.",
    "",
    "## Key terms",
    "| Term | Meaning |",
    "|---|---|",
    "| Stroma | The fluid inside the chloroplast |",
    "| Thylakoid | A membrane sac that holds chlorophyll |",
    "",
    "## Remember",
    "- Light reactions: thylakoid. Calvin cycle: stroma.",
    "",
    "## Self-check",
    "1. Where does the Calvin cycle take place?",
  ].join("\n"),
  citations: [
    { ...citation1, n: 1, passage_id: passageId(1, 1), page: 1, snippet: refsIndex["S1:P1"]?.snippet ?? "" },
    { ...citation1, n: 2, passage_id: passageId(1, 2), page: 1, snippet: refsIndex["S1:P2"]?.snippet ?? "" },
    { ...citation1, n: 3, passage_id: passageId(1, 3), page: 2, snippet: refsIndex["S1:P3"]?.snippet ?? "" },
    citation1,
    citation2,
  ].map((item, index) => ({ ...item, n: index + 1 })),
  headings: [
    { level: 1, text: "Photosynthesis", id: "photosynthesis" },
    { level: 2, text: "Main idea", id: "main-idea" },
    { level: 2, text: "Plan", id: "plan" },
    { level: 2, text: "1. The chloroplast", id: "1-the-chloroplast" },
    { level: 2, text: "2. Light reactions", id: "2-light-reactions" },
    { level: 2, text: "3. Calvin cycle", id: "3-calvin-cycle" },
    { level: 2, text: "Key terms", id: "key-terms" },
    { level: 2, text: "Remember", id: "remember" },
    { level: 2, text: "Self-check", id: "self-check" },
  ],
}

export const mindMapContent: MindMapContent = {
  title: "Photosynthesis",
  nodes: [
    {
      id: "n1",
      parent_id: null,
      label: "Photosynthesis",
      note: "How plants make glucose from light.",
      refs: ["S1:P1"],
    },
    { id: "n2", parent_id: "n1", label: "Chloroplast", note: "The organelle where it happens.", refs: ["S1:P2"] },
    {
      id: "n3",
      parent_id: "n1",
      label: "Light reactions",
      note: "Take place in the thylakoid membranes.",
      refs: ["S1:P3"],
    },
    { id: "n4", parent_id: "n1", label: "Calvin cycle", note: "Builds sugar in the stroma.", refs: ["S1:P5"] },
    { id: "n5", parent_id: "n1", label: "Limiting factors", note: "Light, CO2 and temperature.", refs: ["S2:P3"] },
    { id: "n6", parent_id: "n2", label: "Thylakoids", note: "Membrane sacs with chlorophyll.", refs: ["S1:P2"] },
    { id: "n7", parent_id: "n2", label: "Stroma", note: "The fluid around the thylakoids.", refs: ["S1:P2"] },
    { id: "n8", parent_id: "n3", label: "Water is split", note: "Oxygen is released.", refs: ["S1:P3"] },
    { id: "n9", parent_id: "n3", label: "ATP and NADPH", note: "Store the energy.", refs: ["S1:P3"] },
    { id: "n10", parent_id: "n4", label: "RuBisCO", note: "Fixes carbon dioxide.", refs: ["S1:P5"] },
    { id: "n11", parent_id: "n4", label: "G3P", note: "A three-carbon sugar.", refs: ["S1:P5"] },
    {
      id: "n12",
      parent_id: "n10",
      label: "CO2 fixation",
      note: "Carbon dioxide becomes 3-phosphoglycerate.",
      refs: ["S1:P5"],
    },
  ],
}

export const flashcardsContent: FlashcardsContent = {
  title: "Photosynthesis: cards",
  cards: [
    {
      id: "c1",
      front: "Where do the light reactions take place?",
      back: "In the thylakoid membranes of the chloroplast.",
      hint: "Think of the inner membranes",
      topic: "Light reactions",
      refs: ["S1:P3"],
    },
    {
      id: "c2",
      front: "Where does the Calvin cycle take place?",
      back: "In the stroma.",
      hint: null,
      topic: "Calvin cycle",
      refs: ["S1:P5"],
    },
    {
      id: "c3",
      front: "What does RuBisCO do?",
      back: "It fixes carbon dioxide.",
      hint: null,
      topic: "Calvin cycle",
      refs: ["S1:P5"],
    },
    {
      id: "c4",
      front: "Which pigment absorbs light?",
      back: "Chlorophyll.",
      hint: "It is green",
      topic: "Chloroplast",
      refs: ["S1:P2"],
    },
    {
      id: "c5",
      front: "Name three limiting factors.",
      back: "Light intensity, CO2 concentration, temperature.",
      hint: null,
      topic: "Limiting factors",
      refs: ["S2:P3"],
    },
    {
      id: "c6",
      front: "What is released when water is split?",
      back: "Oxygen.",
      hint: null,
      topic: "Light reactions",
      refs: ["S1:P3"],
    },
  ],
}

export const quizContent: QuizContent = {
  title: "Photosynthesis: quiz",
  questions: [
    {
      id: "q1",
      type: "single",
      prompt: "Which gas is released in the light reactions?",
      options: [
        { id: "a", text: "Oxygen" },
        { id: "b", text: "Carbon dioxide" },
        { id: "c", text: "Nitrogen" },
        { id: "d", text: "Hydrogen" },
      ],
      correct: ["a"],
      explanation: "Water is split and oxygen is released. CO2 is used in the Calvin cycle.",
      hint: "Water is split.",
      difficulty: "easy",
      topic: "Light reactions",
      refs: ["S1:P3"],
    },
    {
      id: "q2",
      type: "multiple",
      prompt: "Which factors limit the rate of photosynthesis?",
      options: [
        { id: "a", text: "Light intensity" },
        { id: "b", text: "CO2 concentration" },
        { id: "c", text: "Temperature" },
        { id: "d", text: "Soil colour" },
      ],
      correct: ["a", "b", "c"],
      explanation: "Light, CO2 and temperature all limit the rate. Soil colour does not.",
      hint: null,
      difficulty: "medium",
      topic: "Limiting factors",
      refs: ["S2:P3"],
    },
    {
      id: "q3",
      type: "true_false",
      prompt: "The Calvin cycle takes place in the thylakoid membranes.",
      options: [
        { id: "true", text: "True" },
        { id: "false", text: "False" },
      ],
      correct: ["false"],
      explanation: "The Calvin cycle takes place in the stroma, not in the thylakoids.",
      hint: "Which stage needs light directly?",
      difficulty: "easy",
      topic: "Calvin cycle",
      refs: ["S1:P5"],
    },
    {
      id: "q4",
      type: "single",
      prompt: "What does RuBisCO fix?",
      options: [
        { id: "a", text: "Oxygen" },
        { id: "b", text: "Carbon dioxide" },
        { id: "c", text: "Water" },
      ],
      correct: ["b"],
      explanation: "RuBisCO fixes carbon dioxide into 3-phosphoglycerate.",
      hint: null,
      difficulty: "medium",
      topic: "Calvin cycle",
      refs: ["S1:P5"],
    },
  ],
}

export const dataTableContent: DataTableContent = {
  title: "Stages of photosynthesis",
  columns: [
    { key: "stage", label: "Stage", type: "text" },
    { key: "place", label: "Place", type: "text" },
    { key: "needs_light", label: "Needs light", type: "text" },
    { key: "order", label: "Order", type: "number" },
  ],
  rows: [
    {
      cells: { stage: "Light reactions", place: "Thylakoid membranes", needs_light: "Yes", order: "1" },
      refs: ["S1:P3"],
    },
    {
      cells: { stage: "Calvin cycle", place: "Stroma", needs_light: "Not directly", order: "2" },
      refs: ["S1:P5", "S2:P2"],
    },
    { cells: { stage: "Water splitting", place: "Photosystem II", needs_light: "Yes", order: "1" }, refs: ["S1:P3"] },
    { cells: { stage: "Sugar output", place: "Stroma", needs_light: "Not directly", order: "3" }, refs: ["S1:P5"] },
  ],
}

export const slidesContent: SlidesContent = {
  title: "Photosynthesis",
  subtitle: "Grade 10 biology",
  slides: [
    {
      id: "s1",
      layout: "title",
      title: "Photosynthesis",
      bullets: [],
      notes: "Welcome. Today: how plants make food.",
      refs: [],
    },
    {
      id: "s2",
      layout: "bullets",
      title: "Two stages",
      bullets: ["Light reactions", "Calvin cycle"],
      notes: "Name both stages.",
      visual_hint: "Two-box diagram",
      refs: ["S1:P2"],
    },
    {
      id: "s3",
      layout: "two_columns",
      title: "Compare",
      notes: "Compare the places.",
      left: { heading: "Light reactions", bullets: ["Thylakoids", "Need light"] },
      right: { heading: "Calvin cycle", bullets: ["Stroma", "Need ATP and NADPH"] },
      refs: ["S1:P3", "S1:P5"],
    },
    {
      id: "s4",
      layout: "quote",
      title: "",
      quote: { text: "Stage two does not need light directly.", attribution: "Lesson 5" },
      notes: "Read it aloud.",
      refs: ["S2:P2"],
    },
    {
      id: "s5",
      layout: "table",
      title: "Summary table",
      table: {
        columns: ["Stage", "Where"],
        rows: [
          ["Light", "Thylakoid"],
          ["Calvin", "Stroma"],
        ],
      },
      notes: "",
      refs: [],
    },
    {
      id: "s6",
      layout: "summary",
      title: "Remember",
      bullets: ["Light -> thylakoid", "Calvin -> stroma", "Glucose is the product"],
      notes: "Recap.",
      refs: ["S1:P1"],
    },
  ],
}

export const infographicContent: InfographicContent = {
  title: "Photosynthesis at a glance",
  subtitle: "Grade 10",
  footer: "Source: Biology 10.pdf",
  blocks: [
    { type: "stat", title: "", items: [{ head: "6CO2 + 6H2O", body: "-> C6H12O6 + 6O2" }], refs: ["S1:P1"] },
    {
      type: "steps",
      title: "Process",
      items: [
        { head: "Absorb light", body: "Chlorophyll captures it" },
        { head: "Split water", body: "Releases O2" },
        { head: "Fix CO2", body: "RuBisCO in the stroma" },
      ],
      refs: ["S1:P3"],
    },
    {
      type: "comparison",
      title: "Two stages",
      items: [],
      columns: [
        { title: "Light", points: ["Thylakoid", "Needs light"] },
        { title: "Calvin", points: ["Stroma", "Needs ATP"] },
      ],
      refs: ["S1:P5"],
    },
    {
      type: "list",
      title: "Limiting factors",
      items: [
        { head: "Light", body: "" },
        { head: "CO2", body: "" },
        { head: "Temperature", body: "" },
      ],
      refs: ["S2:P3"],
    },
    {
      type: "definition",
      title: "",
      items: [{ head: "Stroma", body: "The fluid inside the chloroplast" }],
      refs: ["S1:P2"],
    },
    {
      type: "callout",
      title: "Remember",
      items: [{ head: "Light reactions: thylakoid", body: "Calvin cycle: stroma" }],
      refs: [],
    },
  ],
}

function artifactItem(id: string, kind: ArtifactKind, title: string, extra: Partial<ArtifactItem> = {}): ArtifactItem {
  return {
    id,
    notebook_id: nbIds.notebook,
    kind,
    format: null,
    title,
    status: "ready",
    error: null,
    options: {} as ArtifactItem["options"],
    prompt: null,
    source_count: 3,
    sampled: false,
    unread: false,
    progress: null,
    has_assets: false,
    parent_id: null,
    flashcard_set_id: null,
    created_at: "2026-10-07T04:10:00Z",
    finished_at: "2026-10-07T04:11:00Z",
    ...extra,
  }
}

export const artifactReport = artifactItem(nbIds.report, "report", "Photosynthesis: conspect", {
  format: "conspect",
  options: { format: "conspect", detail: "standard", style: "outline" },
  unread: true,
})
export const artifactMindMap = artifactItem(nbIds.mindMap, "mind_map", "Photosynthesis", {
  options: { detail: "overview" },
})
export const artifactFlashcards = artifactItem(nbIds.flashcards, "flashcards", "Photosynthesis: cards", {
  options: { count: "standard", difficulty: "medium" },
})
export const artifactQuiz = artifactItem(nbIds.quiz, "quiz", "Photosynthesis: quiz", {
  options: { count: "standard", difficulty: "medium", types: ["single", "multiple", "true_false"] },
  prompt: "Only the Calvin cycle",
})
export const artifactDataTable = artifactItem(nbIds.dataTable, "data_table", "Stages of photosynthesis", {
  options: { max_rows: 25 },
})
export const artifactSlides = artifactItem(nbIds.slides, "slides", "Photosynthesis", {
  options: { format: "presenter", length: "default" },
})
export const artifactInfographic = artifactItem(nbIds.infographic, "infographic", "Photosynthesis at a glance", {
  options: { orientation: "portrait", detail: "standard", style: "clean" },
})
/** A quiz that is still being written. */
export const artifactGenerating = artifactItem(nbIds.generating, "quiz", "", {
  status: "generating",
  progress: 0.4,
  finished_at: null,
  options: { count: "fewer", difficulty: "easy" },
})
/** Flash cards the model could not produce twice in a row. */
export const artifactFailed = artifactItem(nbIds.failed, "flashcards", "", {
  status: "failed",
  error: { code: "invalid_output", message_key: "notebooks.artifact.invalid_output", params: {} },
  finished_at: null,
})

/** Newest first, as the API returns them. */
export const notebookArtifacts: ArtifactItem[] = [
  artifactGenerating,
  artifactFailed,
  artifactReport,
  artifactMindMap,
  artifactFlashcards,
  artifactQuiz,
  artifactDataTable,
  artifactSlides,
  artifactInfographic,
]

/** The detail of an artifact: the fixture content of its kind (`null` until it is `ready`). */
export function artifactDetailOf(item: ArtifactItem): ArtifactDetail {
  const extra = { refs_index: refsIndex, source_map: sourceMap, progress_state: null, assets: [] }
  const ready = item.status === "ready"
  switch (item.kind) {
    case "report":
      return { ...item, kind: "report", content: ready ? reportContent : null, ...extra, refs_index: {} }
    case "mind_map":
      return { ...item, kind: "mind_map", content: ready ? mindMapContent : null, ...extra }
    case "flashcards":
      return { ...item, kind: "flashcards", content: ready ? flashcardsContent : null, ...extra }
    case "quiz":
      return { ...item, kind: "quiz", content: ready ? quizContent : null, ...extra }
    case "data_table":
      return { ...item, kind: "data_table", content: ready ? dataTableContent : null, ...extra }
    case "slides":
      return { ...item, kind: "slides", content: ready ? slidesContent : null, ...extra }
    case "infographic":
      return { ...item, kind: "infographic", content: ready ? infographicContent : null, ...extra }
    case "course_plan":
    case "lesson_draft":
      return courseArtifactDetailOf(item)
  }
}

/** The title the backend gives a finished artifact of a kind. */
export function artifactTitleOf(kind: ArtifactKind, format: ArtifactItem["format"]): string {
  switch (kind) {
    case "report":
      return format === "conspect" || format === null ? "Photosynthesis: conspect" : `Photosynthesis: ${format}`
    case "mind_map":
      return "Photosynthesis"
    case "flashcards":
      return "Photosynthesis: cards"
    case "quiz":
      return "Photosynthesis: quiz"
    case "data_table":
      return "Stages of photosynthesis"
    case "slides":
      return "Photosynthesis"
    case "infographic":
      return "Photosynthesis at a glance"
    case "course_plan":
      return "Mechanics for Grade 10"
    case "lesson_draft":
      return "Newton's laws"
  }
}

// - - - Discover, search and labels - - -

/** What Discover finds: three pages, one of them already a source of the notebook. */
export const discoverResponse: DiscoverResponse = {
  mode: "fast",
  queries: ["photosynthesis stages"],
  results: [
    {
      title: "Photosynthesis - Wikipedia",
      url: "https://uz.wikipedia.org/wiki/Fotosintez",
      site: "uz.wikipedia.org",
      snippet: "Photosynthesis is the process by which plants turn light, water and carbon dioxide into sugar.",
      why: "Defines the process",
      already_added: false,
    },
    {
      title: "The Calvin cycle (Khan Academy)",
      url: "https://www.khanacademy.org/science/biology/photosynthesis/calvin-cycle",
      site: "khanacademy.org",
      snippet: "The Calvin cycle uses ATP and NADPH to fix carbon dioxide into three-carbon sugars in the stroma.",
      why: "Explains the light-independent stage",
      already_added: false,
    },
    {
      title: "Chloroplasts (already added)",
      url: "https://example.org/chloroplasts",
      site: "example.org",
      snippet: "Chloroplasts contain chlorophyll and the thylakoid membranes.",
      why: "Structure",
      already_added: true,
    },
  ],
  quota: { ...webQuota, used: 7, remaining: 3 },
}

/** Deep search: more queries and the quota charged `deep_cost`. */
export const discoverDeepResponse: DiscoverResponse = {
  ...discoverResponse,
  mode: "deep",
  queries: ["photosynthesis stages", "calvin cycle stroma", "light reactions thylakoid"],
  quota: { ...webQuota, used: 9, remaining: 1 },
}

export const labelPhotosynthesis: LabelItem = {
  id: uuid(35, 1),
  name: "Photosynthesis",
  emoji: "🌱",
  position: 1,
  origin: "auto",
  source_count: 2,
}

export const labelCalvin: LabelItem = {
  id: uuid(35, 2),
  name: "Calvin cycle",
  emoji: "🔄",
  position: 2,
  origin: "auto",
  source_count: 1,
}
