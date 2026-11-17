
  test("a research stopped by a limit says why instead of the generic failure", async () => {
    serveUniChat(true)
    server.use(
      http.post(apiUrl("/v1/admission/uni-chats/u1/run-default"), () =>
        sse([["error", { type: "ai/limit-reached", title: "Limit reached", params: {} }]]),
      ),
    )
    renderAdmissionApp(<UniChatPanel match={match} />)
    expect(await screen.findByRole("alert")).toHaveTextContent("You reached the assistant limit")
  })

  test("the smart weekly limit gets the panel's own line", async () => {
    serveUniChat(true)
    server.use(
      http.post(apiUrl("/v1/admission/uni-chats/u1/run-default"), () =>
        sse([["error", { type: "ai/smart-weekly-limit", title: "Weekly limit", params: {} }]]),
      ),
    )
    renderAdmissionApp(<UniChatPanel match={match} />)
    expect(await screen.findByRole("alert")).toHaveTextContent("You used this week's advanced AI requests")
  })

  test("rate-limited suggestions show a friendly line instead of missing chips", async () => {
    serveUniChat(false)
    server.use(
      http.get(apiUrl("/v1/admission/uni-chats/u1/suggestions"), () =>
        HttpResponse.json(
          { type: "common/rate-limited", title: "Too many requests", status: 429 },
          { status: 429, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    renderAdmissionApp(<UniChatPanel match={match} />)
    expect(await screen.findByTestId("uni-chat-chips-limited")).toHaveTextContent(
      "Quick questions are not available right now",
    )
  })