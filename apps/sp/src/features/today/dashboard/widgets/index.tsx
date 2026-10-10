"use client";

import type { DashboardWidgetKind } from "@ihsp/api";
import type { ComponentType } from "react";
import type { Widget } from "../model";
import { AttendanceWidget } from "./attendance-widget";
import { ExamsWidget } from "./exams-widget";
import { FlashcardsDueWidget } from "./flashcards-widget";
import { HomeworkWidget } from "./homework-widget";
import { MarksWidget } from "./marks-widget";
import { NextLessonWidget } from "./next-lesson-widget";
import { NotebookPromptWidget } from "./notebook-prompt-widget";
import { TimetableWidget } from "./timetable-widget";

type WidgetView = ComponentType<{ widget: Widget; editing?: boolean }>;

export const WIDGET_VIEWS: Record<DashboardWidgetKind, WidgetView> = {
  timetable: TimetableWidget,
  homework: HomeworkWidget,
  marks: MarksWidget,
  exams: ExamsWidget,
  flashcards_due: FlashcardsDueWidget,
  notebook_prompt: NotebookPromptWidget,
  attendance: AttendanceWidget,
  clock_next_lesson: NextLessonWidget,
};
