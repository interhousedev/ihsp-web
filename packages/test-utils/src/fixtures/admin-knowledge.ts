import type { KnowledgeEntry } from "@ihsp/api"
import { ids, uuid } from "./world"

const KIND = 91

export const knowledgeEntries: KnowledgeEntry[] = [
  {
    id: uuid(KIND, 1),
    key: "school-hours",
    title: "School hours",
    value: "Lessons run from 08:30 to 15:30, Monday to Friday.",
    tags: ["schedule", "general"],
    author_id: ids.student,
    created_at: "2026-09-01T08:00:00Z",
    updated_at: "2026-10-01T09:00:00Z",
    score: null,
  },
  {
    id: uuid(KIND, 2),
    key: "uniform",
    title: null,
    value: "Students wear the school uniform on weekdays.",
    tags: ["rules"],
    author_id: ids.student,
    created_at: "2026-09-02T08:00:00Z",
    updated_at: "2026-09-20T09:00:00Z",
    score: null,
  },
]
