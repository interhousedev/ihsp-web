"use client"

import type { MyTeacher } from "@ihsp/api"
import { Badge } from "@ihsp/ui"
import Link from "next/link"
import { teacherHref, teacherName } from "../utils/teacher-display"
import { ContactChips } from "./contact-chips"
import { TeacherStatusLine } from "./teacher-status"

/** One teacher in the list: name (opens the detail page), subjects, status and contact chips. */
export function TeacherCard({ teacher }: { teacher: MyTeacher }) {
  return (
    <article data-testid="teacher-card" className="bg-card flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">
          <Link href={teacherHref(teacher.id)} className="hover:underline">
            {teacherName(teacher)}
          </Link>
        </h2>
        <TeacherStatusLine teacher={teacher} />
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {teacher.subjects.map((subject) => (
          <li key={subject}>
            <Badge variant="secondary">{subject}</Badge>
          </li>
        ))}
      </ul>
      <ContactChips contacts={teacher.contacts} />
    </article>
  )
}
