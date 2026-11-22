import { HttpResponse, http } from "msw"
import { apiUrl } from "./utils"

const A = "/v1/admission"

export type ProjectsRun = {
  id: string
  created_at: string
  search_used: boolean
  brief: Record<string, unknown>
  projects: Record<string, unknown>[]
}

export type ProjectsHelper = {
  id: string
  kind: "person" | "organization"
  name: string
  description: { en: string; ru: string; uz: string }
  tags: string[]
  help_types: string[]
  expertise_areas: string[]
  contacts: { email: string; phone: string; telegram: string; website: string }
  city: string
  active: boolean
}

const seedHelper: ProjectsHelper = {
  id: "h1",
  kind: "organization",
  name: "Makers Hub",
  description: {
    en: "A workshop for student builders",
    ru: "Мастерская для школьников",
    uz: "Maktab o'quvchilari ustaxonasi",
  },
  tags: ["product_dev"],
  help_types: ["equipment_space"],
  expertise_areas: ["Electronics"],
  contacts: {
    email: "hub@example.org",
    phone: "+998 90 000 00 00",
    telegram: "@makers_hub",
    website: "https://hub.example.org",
  },
  city: "Tashkent",
  active: true,
}

export const projectsRunFixture: ProjectsRun = {
  id: "r1",
  created_at: "2026-01-01T10:00:00Z",
  search_used: true,
  brief: {},
  projects: [
    {
      key: "p1",
      title: "Water quality tracker",
      summary: "A cheap sensor kit that maps river quality.",
      analogs: [
        { name: "River Watch", where: "abroad", url: "https://riverwatch.example.org" },
        { name: "Suv Nazorat", where: "uzbekistan", url: null },
      ],
      challenges: ["Calibrating the sensor"],
      application_effect: "Shows initiative in environmental engineering.",
      first_steps: ["Buy a turbidity sensor"],
      help_tags: ["product_dev"],
    },
  ],
}

let runs: ProjectsRun[] = []
let helpers: ProjectsHelper[] = [seedHelper]
let seq = 0

/** Empties the in-memory runs and restores the single seeded helper. Call it in `afterEach`/`beforeEach`. */
export function resetProjectsHandlers() {
  runs = []
  helpers = [{ ...seedHelper }]
  seq = 0
}

export const projectsHandlers = [
  http.get(apiUrl(`${A}/projects/ideas`), () =>
    HttpResponse.json({
      latest: runs[0] ?? null,
      history: runs.map((r) => ({ id: r.id, created_at: r.created_at, count: r.projects.length })),
    }),
  ),
  http.post(apiUrl(`${A}/projects/ideas`), async ({ request }) => {
    const brief = (await request.json()) as Record<string, unknown>
    const run = { ...projectsRunFixture, id: `r${++seq}`, brief }
    runs = [run, ...runs]
    return HttpResponse.json(run, { status: 201 })
  }),
  http.get(apiUrl(`${A}/projects/ideas/:id`), ({ params }) => {
    const run = runs.find((r) => r.id === params.id)
    return run
      ? HttpResponse.json(run)
      : HttpResponse.json({ type: "not-found", title: "Not found", status: 404 }, { status: 404 })
  }),
  http.get(apiUrl(`${A}/projects/helpers`), ({ request }) => {
    const tags = new URL(request.url).searchParams.getAll("tag")
    return HttpResponse.json({
      items: helpers.filter((h) => h.active && (tags.length === 0 || h.tags.some((t) => tags.includes(t)))),
    })
  }),
  http.get(apiUrl(`${A}/staff/project-helpers`), () => HttpResponse.json({ items: helpers })),
  http.post(apiUrl(`${A}/staff/project-helpers`), async ({ request }) => {
    const body = (await request.json()) as Omit<ProjectsHelper, "id">
    const created = { ...body, id: `h${helpers.length + 1}` }
    helpers = [...helpers, created]
    return HttpResponse.json(created, { status: 201 })
  }),
  http.put(apiUrl(`${A}/staff/project-helpers/:id`), async ({ request, params }) => {
    const body = (await request.json()) as Omit<ProjectsHelper, "id">
    helpers = helpers.map((h) => (h.id === params.id ? { ...body, id: h.id } : h))
    return HttpResponse.json(helpers.find((h) => h.id === params.id))
  }),
  http.delete(apiUrl(`${A}/staff/project-helpers/:id`), ({ params }) => {
    helpers = helpers.filter((h) => h.id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),
]
