import { HttpResponse, http } from "msw"
import { apiUrl } from "./utils"

/** `GET /v1/admission/country-facts` answers one verified country (FR) with a cost fact and an opportunities fact. */
export const countriesHandlers = [
  http.get(apiUrl("/v1/admission/country-facts"), () =>
    HttpResponse.json({
      highlight: ["cs_it"],
      items: [
        {
          country: "FR",
          as_of: "2026-11",
          status: "verified",
          verified: true,
          updated_at: null,
          facts: {
            cost_of_living: {
              score: 3,
              values: {},
              text: { en: "Moderate costs" },
              sources: ["https://example.org/cost"],
            },
            opportunities: {
              score: null,
              values: { cs_it: 5, engineering: 3 },
              text: {},
              sources: ["https://example.org/jobs"],
            },
          },
        },
      ],
    }),
  ),
]
