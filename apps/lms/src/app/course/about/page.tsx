"use client"

import { CourseRoute } from "@/features/courses/components/course-route"

/** The old `/course/about/?slug=` links: redirects to the address in the path. */
export default function Page() {
  return <CourseRoute />
}
