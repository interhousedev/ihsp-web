"use client"

import type { ArtifactDetail } from "@ihsp/api"
import { CoursePlanViewer } from "../course/course-plan-viewer"
import { LessonDraftViewer } from "../course/lesson-draft-viewer"
import { DataTableViewer } from "../data-table-viewer"
import { ExerciseViewer } from "../exercise-viewer"
import { FlashcardsViewer } from "../flashcards-viewer"
import { InfographicViewer } from "../infographic-viewer"
import { MindMapViewer } from "../mind-map/mind-map-viewer"
import { QuizViewer } from "../quiz-viewer"
import { ReportViewer } from "../report-viewer"
import { SlidesViewer } from "../slides-viewer"

/** Picks the viewer by the kind of a ready artifact. The audio overview has no viewer in this phase. */
export function ViewerBody({ notebookId, artifact }: { notebookId: string; artifact: ArtifactDetail }) {
  switch (artifact.kind) {
    case "report":
      return <ReportViewer notebookId={notebookId} artifact={artifact} />
    case "mind_map":
      return <MindMapViewer notebookId={notebookId} artifact={artifact} />
    case "flashcards":
      return <FlashcardsViewer notebookId={notebookId} artifact={artifact} />
    case "quiz":
      return <QuizViewer notebookId={notebookId} artifact={artifact} />
    case "data_table":
      return <DataTableViewer notebookId={notebookId} artifact={artifact} />
    case "slides":
      return <SlidesViewer notebookId={notebookId} artifact={artifact} />
    case "infographic":
      return <InfographicViewer notebookId={notebookId} artifact={artifact} />
    case "exercise":
      return <ExerciseViewer notebookId={notebookId} artifact={artifact} />
    case "course_plan":
      return <CoursePlanViewer notebookId={notebookId} artifact={artifact} />
    case "lesson_draft":
      return <LessonDraftViewer notebookId={notebookId} artifact={artifact} />
  }
}
