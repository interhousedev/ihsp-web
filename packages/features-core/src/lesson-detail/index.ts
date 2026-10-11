// The lesson page shared by the staff app and the admin app: sections, hooks and the
// attendance helpers other staff screens (the curator's excuse dialog) use.
export { AttendanceSheetView } from "./components/attendance-sheet"
export { LessonDetail } from "./components/lesson-detail"
export { useStaffLesson } from "./hooks/use-staff-lesson"
export { scrollToHash } from "./utils/scroll-to-hash"
export { applyAttendanceSheet } from "./utils/cache"
export { conflictingSheet } from "./utils/conflict"
export {
  buildSubmitBody,
  everyonePresent,
  initialMarks,
  rosterOf,
  rosterSections,
  type SheetRosterItem,
} from "./utils/marks"
