/** Mock data for the AI tools mockup. The hooks in `hooks/` serve it and will be swapped for the real API client. */

export type ToolId = "questions" | "handout" | "workCheck" | "lessonPlan"

export const TOOL_IDS: ToolId[] = ["questions", "handout", "workCheck", "lessonPlan"]

export type Difficulty = "easy" | "medium" | "hard"
export const AI_AUTHOR = "ИИ"
/** The signed-in teacher; the question bank of a subject is shared by all teachers of the subject. */
export const ME = "Усмонов Б."

export type MockQuestion = { id: string; text: string; options: string[]; correct: number[] }
export type BankQuestion = MockQuestion & {
  subjectId: string
  topicId: string
  difficulty: Difficulty
  author: string
}

export const isMulti = (q: MockQuestion): boolean => q.correct.length > 1

/** Subjects and topics of the EMIS curriculum plan. */
export const EMIS_SUBJECTS = [
  {
    id: "algebra",
    name: "Алгебра",
    topics: [
      { id: "quadratic", name: "Квадратные уравнения" },
      { id: "functions", name: "Функции и графики" },
      { id: "progressions", name: "Прогрессии" },
    ],
  },
  {
    id: "geometry",
    name: "Геометрия",
    topics: [
      { id: "triangles", name: "Треугольники" },
      { id: "circle", name: "Окружность" },
    ],
  },
  {
    id: "physics",
    name: "Физика",
    topics: [
      { id: "kinematics", name: "Кинематика" },
      { id: "newton", name: "Законы Ньютона" },
    ],
  },
]

/** The subjects this teacher teaches: the notebook of a material is chosen by subject and group. */
export const TEACHER_SUBJECTS = EMIS_SUBJECTS.filter((s) => s.id !== "physics")
export const ALL_GROUPS = "Все группы"
export const MOCK_GROUPS = ["9-А", "9-Б", "10-А", "11-Б"]
export const MOCK_TEMPLATES = ["Шаблон кафедры математики", "Стандартный план 45 минут"]

/** Where a material is stored: the subject notebook of one group, or the teacher-wide one. */
export function notebookName(subjectId: string, group: string | null): string {
  const subject = EMIS_SUBJECTS.find((s) => s.id === subjectId)?.name ?? ""
  return `${subject} · ${group && group !== ALL_GROUPS ? group : "все мои группы"}`
}

export const MOCK_LESSONS = [
  "Квадратные уравнения · 9-А · сегодня",
  "Дискриминант · 9-Б · завтра",
  "Теорема Виета · 10-А · в пятницу",
]

export const MOCK_QUESTIONS: MockQuestion[] = [
  {
    id: "q1",
    text: "Чему равен дискриминант уравнения x² − 5x + 6 = 0?",
    options: ["1", "5", "25", "−1"],
    correct: [0],
  },
  {
    id: "q2",
    text: "Какие числа являются корнями уравнения x² − 5x + 6 = 0?",
    options: ["x = 2", "x = 3", "x = −2", "x = 6"],
    correct: [0, 1],
  },
  {
    id: "q3",
    text: "Сколько корней имеет уравнение, если дискриминант меньше нуля?",
    options: ["Ни одного действительного", "Один", "Два", "Бесконечно много"],
    correct: [0],
  },
  {
    id: "q4",
    text: "Какая формула выражает теорему Виета для суммы корней x² + px + q = 0?",
    options: ["x₁ + x₂ = −p", "x₁ + x₂ = p", "x₁ + x₂ = q", "x₁ + x₂ = −q"],
    correct: [0],
  },
  {
    id: "q5",
    text: "При каком значении a уравнение x² + 4x + a = 0 имеет ровно один корень?",
    options: ["a = 4", "a = −4", "a = 16", "a = 2"],
    correct: [0],
  },
]

const bank = (
  id: string,
  subjectId: string,
  topicId: string,
  difficulty: Difficulty,
  author: string,
  text: string,
  options: string[],
  correct: number[],
): BankQuestion => ({ id, subjectId, topicId, difficulty, author, text, options, correct })

export const MOCK_BANK: BankQuestion[] = [
  ...MOCK_QUESTIONS.map((q, i) =>
    bank(
      `b${i + 1}`,
      "algebra",
      "quadratic",
      i < 2 ? "easy" : i < 4 ? "medium" : "hard",
      i % 2 ? ME : AI_AUTHOR,
      q.text,
      q.options,
      q.correct,
    ),
  ),
  bank(
    "b6",
    "algebra",
    "quadratic",
    "medium",
    ME,
    "Как разложить на множители x² − 9?",
    ["(x − 3)(x + 3)", "(x − 9)²", "(x − 3)²", "x(x − 9)"],
    [0],
  ),
  bank(
    "b7",
    "algebra",
    "functions",
    "easy",
    "ИИ",
    "Что является графиком функции y = x²?",
    ["Парабола", "Прямая", "Гипербола", "Окружность"],
    [0],
  ),
  bank(
    "b8",
    "algebra",
    "functions",
    "medium",
    ME,
    "В какой точке график y = 2x − 6 пересекает ось Ox?",
    ["(3; 0)", "(0; −6)", "(−3; 0)", "(6; 0)"],
    [0],
  ),
  bank(
    "b9",
    "algebra",
    "progressions",
    "easy",
    AI_AUTHOR,
    "Чему равен пятый член арифметической прогрессии 2, 5, 8, …?",
    ["14", "11", "17", "13"],
    [0],
  ),
  bank(
    "b10",
    "algebra",
    "progressions",
    "hard",
    AI_AUTHOR,
    "Чему равна сумма первых 10 членов прогрессии 1, 2, 4, …?",
    ["1023", "511", "1024", "2047"],
    [0],
  ),
  bank(
    "b11",
    "geometry",
    "triangles",
    "easy",
    "Рахимова Н.",
    "Чему равна сумма углов треугольника?",
    ["180°", "90°", "360°", "270°"],
    [0],
  ),
  bank(
    "b12",
    "geometry",
    "triangles",
    "medium",
    AI_AUTHOR,
    "Какие из утверждений верны для равнобедренного треугольника?",
    ["Углы при основании равны", "Все стороны равны", "Медиана к основанию — высота", "Все углы по 60°"],
    [0, 2],
  ),
  bank(
    "b13",
    "geometry",
    "circle",
    "medium",
    ME,
    "Чему равна длина окружности радиуса r?",
    ["2πr", "πr²", "πr", "4πr"],
    [0],
  ),
  bank(
    "b14",
    "physics",
    "kinematics",
    "easy",
    AI_AUTHOR,
    "Как называется физическая величина, равная отношению пути ко времени?",
    ["Скорость", "Ускорение", "Сила", "Импульс"],
    [0],
  ),
  bank(
    "b15",
    "physics",
    "newton",
    "medium",
    "Рахимова Н.",
    "Чему равна сила, если m = 2 кг, a = 3 м/с²?",
    ["6 Н", "5 Н", "1,5 Н", "9 Н"],
    [0],
  ),
]

export const MOCK_HANDOUT = [
  "Квадратные уравнения: краткий конспект",
  "1. Вид уравнения: ax² + bx + c = 0, a ≠ 0.",
  "2. Дискриминант: D = b² − 4ac. D > 0 — два корня, D = 0 — один, D < 0 — действительных корней нет.",
  "3. Корни: x = (−b ± √D) / 2a.",
  "4. Теорема Виета: x₁ + x₂ = −b/a, x₁x₂ = c/a.",
  "Рабочий лист: решите x² − 7x + 10 = 0, x² + 2x + 5 = 0, 2x² − 8 = 0.",
].join("\n\n")

export const MOCK_PLAN = [
  "План занятия · 9-A · 45 минут",
  "Цель: научить решать квадратные уравнения через дискриминант.",
  "0–5 мин. Организационный момент, проверка домашнего задания.",
  "5–15 мин. Объяснение: вывод формулы корней, разбор примера.",
  "15–30 мин. Практика в парах: три уравнения с разным знаком D.",
  "30–40 мин. Мини-тест (5 вопросов).",
  "40–45 мин. Рефлексия и домашнее задание.",
].join("\n\n")

export type WorkCriterion = { name: string; points: number; max: number; comment: string }
export const MOCK_WORK_CHECK = {
  score: 7,
  max: 10,
  criteria: [
    {
      name: "Аргументация",
      points: 2,
      max: 3,
      comment: "Основной тезис сформулирован чётко, но не хватает второго примера.",
    },
    { name: "Структура", points: 2, max: 3, comment: "Введение и вывод есть, переходы между абзацами резкие." },
    { name: "Грамотность", points: 3, max: 4, comment: "Четыре орфографические ошибки, пунктуация в целом верна." },
  ] satisfies WorkCriterion[],
}

export const MOCK_SUBMISSION_FILE = "homework-algebra.docx"

export type AuthorshipPart = { text: string; flagged: boolean }
export type AuthorshipResult = { verdict: "low" | "mid" | "high"; parts: AuthorshipPart[] }

/** The text of a hand-in and the passages that look machine-written. */
export const MOCK_AUTHORSHIP: AuthorshipResult = {
  verdict: "low",
  parts: [
    { text: "Квадратные уравнения я решал по дискриминанту, и сначала путался со знаком. ", flagged: false },
    {
      text: "Таким образом, можно сделать вывод, что метод является универсальным и позволяет эффективно находить корни при любых значениях коэффициентов. ",
      flagged: true,
    },
    {
      text: "В примере с x² − 5x + 6 у меня вышло D = 1, а потом корни 2 и 3, это я проверил подстановкой. ",
      flagged: false,
    },
    {
      text: "Подводя итог, следует отметить, что владение данным алгоритмом существенно повышает точность вычислений. ",
      flagged: true,
    },
    { text: "Мне ещё сложно, когда a не равно 1.", flagged: false },
  ],
}

export const MOCK_COURSES = [
  { id: "c1", name: "Алгебра 9 класс", steps: ["Квадратные уравнения: введение", "Дискриминант", "Теорема Виета"] },
  { id: "c2", name: "Подготовка к тесту", steps: ["Тренировка 1", "Тренировка 2"] },
]

export const MOCK_LESSON_TOPIC = "Квадратные уравнения"

export type JobKind = "video" | "audio"
export type JobState = "queued" | "running" | "ready" | "failed" | "cancelled"
export const STAGES = ["queued", "voice", "compose", "ready"] as const
export type Stage = (typeof STAGES)[number]

export type MockJob = {
  id: string
  kind: JobKind
  title: string
  state: JobState
  stage: Stage
  progress: number
  queuePosition?: number
  etaMin?: number
  when: string
}

export const MOCK_JOBS: MockJob[] = [
  {
    id: "j1",
    kind: "video",
    title: "Дискриминант: видео-объяснение",
    state: "running",
    stage: "compose",
    progress: 64,
    etaMin: 2,
    when: "сейчас",
  },
  {
    id: "j2",
    kind: "audio",
    title: "Озвучка конспекта: теорема Виета",
    state: "queued",
    stage: "queued",
    progress: 0,
    queuePosition: 2,
    when: "1 мин назад",
  },
  {
    id: "j3",
    kind: "video",
    title: "Квадратные уравнения за 60 секунд",
    state: "ready",
    stage: "ready",
    progress: 100,
    when: "вчера",
  },
  {
    id: "j4",
    kind: "audio",
    title: "Озвучка: введение",
    state: "failed",
    stage: "voice",
    progress: 38,
    when: "2 дня назад",
  },
]

/** The script of a media item: each scene starts at `start` seconds; this is the text stored in the notebook. */
export const MOCK_SCENES = [
  {
    id: "s1",
    start: 0,
    heading: "Что такое квадратное уравнение",
    text: "Уравнение вида ax² + bx + c = 0, где a не равно нулю.",
  },
  { id: "s2", start: 42, heading: "Дискриминант", text: "D = b² − 4ac показывает, сколько корней у уравнения." },
  { id: "s3", start: 96, heading: "Формула корней", text: "Корни находим по формуле x = (−b ± √D) / 2a." },
  { id: "s4", start: 134, heading: "Пример", text: "Для x² − 5x + 6 = 0 дискриминант равен 1, корни 2 и 3." },
]
export const MOCK_MEDIA_SECONDS = 190

export function timecode(seconds: number): string {
  const m = Math.floor(seconds / 60)
  return `${String(m).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
}

export const MOCK_VOICES: { id: string; name: string; lang: "ru" | "uz" | "en"; female: boolean }[] = [
  { id: "v1", name: "Дилноза", lang: "uz", female: true },
  { id: "v2", name: "Мария", lang: "ru", female: true },
  { id: "v3", name: "Артём", lang: "ru", female: false },
  { id: "v4", name: "Emma", lang: "en", female: true },
]
