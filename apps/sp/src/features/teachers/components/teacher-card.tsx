"use client"

import type { MyTeacher } from "@ihsp/api"
import { TeacherAvatar } from "@ihsp/features-core"
import { Badge } from "@ihsp/ui"
import Link from "next/link"
import { subjectHref, teacherHref, teacherName } from "../utils/teacher-display"
import { ContactChips } from "./contact-chips"
import { NearestClass } from "./nearest-class"
import { UpcomingLessons } from "./upcoming-lessons"

/** One teacher in the list: photo and name (opens the profile), subjects, the nearest class, the next two weeks and contacts. */
export function TeacherCard({ teacher }: { teacher: MyTeacher }) {
  const name = teacherName(teacher)
  return (
    <article data-testid="teacher-card" className="bg-card flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <TeacherAvatar name={name} photoUrl={teacher.photo_url} />
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className="text-base font-semibold">
            <Link href={teacherHref(teacher.id)} className="hover:underline">
              {name}
            </Link>
          </h2>
          <ul className="flex flex-wrap gap-1.5">
            {teacher.subject_refs.map((subject) => (
              <li key={subject.id}>
                <Link href={subjectHref(subject.id)} className="rounded-full">
                  <Badge variant="secondary">{subject.name}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <NearestClass teacher={teacher} />
      <UpcomingLessons lessons={teacher.upcoming} />
      <ContactChips contacts={teacher.contacts} />
    </article>
  )
}
