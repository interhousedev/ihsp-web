/** Hand-typed against GET /v1/me/rating (app/interfaces/http/v1/me_marks/handlers/get_overall_rating.py). */
export type RatingYear = { label: string; starts_on: string; ends_on: string }

export type RatingWeights = {
  base: number
  category_points: Record<string, number>
  level_points: Record<string, number>
  marks_threshold: number
  marks_points: number
  absence_points: number
  work_off_points: number
}

export type RatingCertificate = { name: string; category: string; level: string | null; points: number }

export type RatingBreakdown = {
  base: number
  certificates: RatingCertificate[]
  certificate_points: number
  mark_average: number | null
  mark_count: number
  marks_points: number
  absences: number
  absence_points: number
  work_offs: number
  work_off_points: number
}

export type RatingRow = {
  place: number
  student_id: string
  full_name: string
  group_name: string
  score: number
  photo_url: string | null
  is_me: boolean
}

export type MyRatingRow = RatingRow & { breakdown: RatingBreakdown }

export type OverallRating = {
  academic_year: RatingYear | null
  weights: RatingWeights
  total: number
  top: RatingRow[]
  me: MyRatingRow | null
}
