/** The Today dashboard: add from the catalogue, resize, colour with readable text, save with the version. */
import { describe, expect, test } from "bun:test";
import { apiUrl, dashboardLayout, problem, server } from "@ihsp/test-utils";
import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { Dashboard } from "../features/today/dashboard/dashboard";
import { configureTests, renderSp } from "./helpers";

configureTests();

function tile(kind: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(
    `[data-widget-kind="${kind}"]`,
  );
  if (!found) throw new Error(`no ${kind} tile`);
  return found;
}

describe("Dashboard widgets", () => {
  test("shows the saved widgets with their colours and readable text", async () => {
    renderSp(<Dashboard />);

    await screen.findByRole("heading", { name: "My widgets" });
    expect(tile("clock_next_lesson")).toHaveAttribute(
      "data-widget-size",
      "2x1",
    );
    expect(tile("homework")).toHaveAttribute("data-text-color", "#FFFFFF");
  });

  test("adds a widget from the catalogue, resizes it, colours it and saves", async () => {
    const bodies: { version: number; widgets: Record<string, unknown>[] }[] =
      [];
    server.use(
      http.put(apiUrl("/v1/me/dashboard"), async ({ request }) => {
        const body = (await request.json()) as (typeof bodies)[number];
        bodies.push(body);
        return HttpResponse.json({
          version: body.version + 1,
          widgets: body.widgets,
        });
      }),
    );
    const { user } = renderSp(<Dashboard />);

    await user.click(await screen.findByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Add widget" }));
    await user.click(
      within(screen.getByRole("list", { name: "Widget catalogue" })).getByText(
        "Schedule",
      ),
    );
    expect(tile("timetable")).toHaveAttribute("data-widget-size", "2x1");

    await user.click(screen.getByRole("button", { name: "Select Schedule" }));
    const editor = screen.getByRole("region", { name: "Widget settings" });
    expect(within(editor).queryByRole("button", { name: "1x1" })).toBeNull();
    await user.click(within(editor).getByRole("button", { name: "2x2" }));
    expect(tile("timetable")).toHaveAttribute("data-widget-size", "2x2");

    await user.click(within(editor).getByRole("button", { name: "#FFCC00" }));
    expect(tile("timetable")).toHaveAttribute("data-text-color", "#000000");
    await user.click(within(editor).getByRole("button", { name: "#1C1C1E" }));
    expect(tile("timetable")).toHaveAttribute("data-text-color", "#FFFFFF");

    await user.click(screen.getByRole("button", { name: "Done" }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]?.version).toBe(dashboardLayout.version);
    const saved = bodies[0]?.widgets ?? [];
    expect(saved).toHaveLength(dashboardLayout.widgets.length + 1);
    expect(saved.find((w) => w.kind === "timetable")).toMatchObject({
      size: "2x2",
      color: "#1C1C1E",
    });
    expect(saved.every((w) => !("text_color" in w))).toBe(true);
    await screen.findByRole("button", { name: "Edit" });
  });

  test("deletes a widget", async () => {
    const { user } = renderSp(<Dashboard />);

    await user.click(await screen.findByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Select Marks" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(document.querySelector('[data-widget-kind="marks"]')).toBeNull();
  });

  test("a stale version shows the conflict message", async () => {
    server.use(
      http.put(apiUrl("/v1/me/dashboard"), () =>
        problem(409, "dashboard/version-conflict", "Conflict"),
      ),
    );
    const { user } = renderSp(<Dashboard />);

    await user.click(await screen.findByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "changed on another device",
    );
  });

  test("the study idea widget picks one of the templates and links to a notebook", async () => {
    const { user } = renderSp(<Dashboard />);
    await user.click(await screen.findByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Add widget" }));
    await user.click(
      within(screen.getByRole("list", { name: "Widget catalogue" })).getByText(
        "Study idea",
      ),
    );

    expect(
      (await screen.findByTestId("notebook-prompt")).textContent?.length,
    ).toBeGreaterThan(10);
  });
});
