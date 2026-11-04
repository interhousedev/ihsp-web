import type { GroupRatingRow } from "@ihsp/api"

/** `GET /v1/me/group/rating`: the group by GPA; the demo student (`is_me`) is in the middle. */
export const groupRatingRows: GroupRatingRow[] = [
  { name: "Aziza Karimova", gpa: 4.8, emis_rating: 96, rank: 1, is_me: false },
  { name: "Demo Student", gpa: 4.1, emis_rating: 88, rank: 2, is_me: true },
  { name: "Bobur Usmonov", gpa: 3.6, emis_rating: null, rank: 3, is_me: false },
  { name: "Dilnoza Rahimova", gpa: null, emis_rating: null, rank: null, is_me: false },
]
