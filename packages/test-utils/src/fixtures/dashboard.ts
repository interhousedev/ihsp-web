import type { Dashboard } from "@ihsp/api"

/** A saved dashboard at version 3: next lesson, homework, marks and an exams tile. */
export const dashboardLayout: Dashboard = {
  version: 3,
  widgets: [
    {
      id: "0000000d-0000-4000-8000-000000000001",
      kind: "clock_next_lesson",
      size: "2x1",
      x: 0,
      y: 0,
      color: null,
      config: {},
      text_color: null,
    },
    {
      id: "0000000d-0000-4000-8000-000000000002",
      kind: "homework",
      size: "1x1",
      x: 2,
      y: 0,
      color: "#000000",
      config: {},
      text_color: "#FFFFFF",
    },
    {
      id: "0000000d-0000-4000-8000-000000000003",
      kind: "marks",
      size: "1x1",
      x: 3,
      y: 0,
      color: null,
      config: {},
      text_color: null,
    },
  ],
}
