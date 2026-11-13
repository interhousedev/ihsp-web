// Honours (red diploma, gold and silver medals) and the EMIS rating book of the student.

export type HonourAwardKind = "red_diploma" | "gold_medal" | "silver_medal"

export type HonourRuleId =
  | "red_diploma_max_fours"
  | "medal_certificate"
  | "gold_controls_all_five"
  | "gold_semester_all_five"
  | "silver_controls_all_five"
  | "silver_semester_max_fours"

/** A mark that keeps a rule from passing. */
export type HonourBlocking = {
  subject_id: string
  subject_name: string
  semester: number
  type: "semester" | "midterm" | "final"
  value: number
}

export type HonourRule = { rule: string; passed: boolean; blocking: HonourBlocking[] }

export type HonourAward = { kind: HonourAwardKind; eligible: boolean; rules: HonourRule[] }

/** GET /v1/me/honours. `school_certificate_serial` is null when EMIS has no certificate serial. */
export type Honours = { awards: HonourAward[]; school_certificate_serial: string | null }

/** GET /v1/me/emis/rating-book. */
export type EmisRatingBook = { url: string }
