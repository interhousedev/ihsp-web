import type { Honours } from "@ihsp/api"

/** A student who is blocked from the red diploma by two fours and has a certificate serial. */
export const honoursBlocked: Honours = {
  school_certificate_serial: "AB 1234567",
  awards: [
    {
      kind: "red_diploma",
      eligible: false,
      rules: [
        {
          rule: "red_diploma_max_fours",
          passed: false,
          blocking: [
            { subject_id: "s-math", subject_name: "Mathematics", semester: 3, type: "semester", value: 4 },
            { subject_id: "s-phys", subject_name: "Physics", semester: 4, type: "midterm", value: 4 },
          ],
        },
        { rule: "medal_certificate", passed: true, blocking: [] },
      ],
    },
    {
      kind: "gold_medal",
      eligible: false,
      rules: [
        {
          rule: "gold_controls_all_five",
          passed: false,
          blocking: [{ subject_id: "s-hist", subject_name: "History", semester: 2, type: "final", value: 4 }],
        },
        { rule: "gold_semester_all_five", passed: true, blocking: [] },
      ],
    },
    {
      kind: "silver_medal",
      eligible: true,
      rules: [
        { rule: "silver_controls_all_five", passed: true, blocking: [] },
        { rule: "silver_semester_max_fours", passed: true, blocking: [] },
      ],
    },
  ],
}

/** Every award is open and the certificate serial is not in EMIS. */
export const honoursEligible: Honours = {
  school_certificate_serial: null,
  awards: [
    { kind: "red_diploma", eligible: true, rules: [{ rule: "red_diploma_max_fours", passed: true, blocking: [] }] },
    { kind: "gold_medal", eligible: true, rules: [{ rule: "gold_controls_all_five", passed: true, blocking: [] }] },
    {
      kind: "silver_medal",
      eligible: true,
      rules: [{ rule: "silver_semester_max_fours", passed: true, blocking: [] }],
    },
  ],
}
