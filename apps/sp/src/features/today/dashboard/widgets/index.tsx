"use client"

import type { DashboardWidgetKind } from "@ihsp/api"
import type { ComponentType } from "react"
import type { Widget } from "../model"
import { AlertsWidget } from "./alerts-widget"
import { AnnouncementsWidget } from "./announcements-widget"
import { AttendanceWidget } from "./attendance-widget"
import { ExamsWidget } from "./exams-widget"
import { FlashcardsDueWidget } from "./flashcards-widget"
import { GetStartedWidget } from "./get-started-widget"
import { HomeworkWidget } from "./homework-widget"
import { MarksWidget } from "./marks-widget"
import { NextLessonWidget } from "./next-lesson-widget"
import { NewMarksWidget } from "./new-marks-widget"
import { NotebookPromptWidget } from "./notebook-prompt-widget"
import { NowNextWidget } from "./now-next-widget"
import { SemesterSummaryWidget } from "./semester-summary-widget"
import { TodayLessonsWidget } from "./today-lessons-widget"
import { UpcomingControlsWidget } from "./upcoming-controls-widget"
import { TimetableWidget } from "./timetable-widget"

type WidgetView = ComponentType<{ widget: Widget; editing?: boolean }>

export const WIDGET_VIEWS: Record<DashboardWidgetKind, WidgetView> = {
  timetable: TimetableWidget,
  homework: HomeworkWidget,
  marks: MarksWidget,
  exams: ExamsWidget,
  flashcards_due: FlashcardsDueWidget,
  notebook_prompt: NotebookPromptWidget,
  attendance: AttendanceWidget,
  clock_next_lesson: NextLessonWidget,
  upcoming_controls: UpcomingControlsWidget,
  next_lesson: NowNextWidget,
  today_lessons: TodayLessonsWidget,
  semester_summary: SemesterSummaryWidget,
  announcements: AnnouncementsWidget,
  new_marks: NewMarksWidget,
  alerts: AlertsWidget,
  get_started: GetStartedWidget,
}
