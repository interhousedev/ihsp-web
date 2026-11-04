"use client"

import { CourseRoute } from "@/features/courses/components/course-route"

/** The shell of `/course/<id>/...`: nginx and the dev rewrite serve this file for ids in the path. */
export default function Page() {
  return <CourseRoute />
}
