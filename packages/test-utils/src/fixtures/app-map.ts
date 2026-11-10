import type { AppMapItem } from "@ihsp/api"

/** Pages of the app map for the demo student (`GET /v1/app-map`). */
export const appMapItems: AppMapItem[] = [
  {
    id: "sp-home",
    app: "sp",
    path: "/",
    url: "https://my.iht.test/",
    title: { uz: "Bosh sahifa", ru: "Главная", en: "Home" },
    keywords: ["bosh", "sahifa", "главная", "home", "today"],
  },
  {
    id: "sp-timetable",
    app: "sp",
    path: "/timetable/",
    url: "https://my.iht.test/timetable/",
    title: { uz: "Dars jadvali", ru: "Расписание", en: "Timetable" },
    keywords: ["jadval", "расписание", "timetable", "schedule"],
  },
  {
    id: "sp-grades",
    app: "sp",
    path: "/grades/",
    url: "https://my.iht.test/grades/",
    title: { uz: "Baholar", ru: "Оценки", en: "Grades" },
    keywords: ["baho", "оценки", "grades", "marks"],
  },
  {
    id: "lms-courses",
    app: "lms",
    path: "/",
    url: "https://lms.iht.test/",
    title: { uz: "Kurslar", ru: "Курсы", en: "Courses" },
    keywords: ["kurs", "курсы", "courses", "lms"],
  },
  {
    id: "bot-today",
    app: "bot",
    path: "/today",
    url: null,
    title: { uz: "Bugun", ru: "Сегодня", en: "Today" },
    keywords: ["today", "сегодня", "bugun"],
  },
]
