/** The dashboard model: allowed sizes, packing, moving, colours with readable text. */
import { describe, expect, test } from "bun:test";
import {
  PALETTE,
  WIDGET_SIZES,
  addWidget,
  colorWidget,
  contrastRatio,
  moveWidget,
  inOrder,
  removeWidget,
  resizeWidget,
  textOn,
} from "../features/today/dashboard/model";

describe("dashboard model", () => {
  test("adding gives the first allowed size and packs without overlaps", () => {
    let widgets = addWidget([], "timetable");
    widgets = addWidget(widgets, "homework");
    widgets = addWidget(widgets, "marks");

    expect(widgets.map((w) => w.size)).toEqual(["2x1", "1x1", "1x1"]);
    expect(widgets.map((w) => [w.x, w.y])).toEqual([
      [0, 0],
      [2, 0],
      [3, 0],
    ]);
  });

  test("resizing only accepts sizes the kind allows", () => {
    const [timetable] = addWidget([], "timetable");
    expect(WIDGET_SIZES.timetable).not.toContain("1x1");

    expect(resizeWidget([timetable!], timetable!.id, "1x1")[0]?.size).toBe(
      "2x1",
    );
    expect(resizeWidget([timetable!], timetable!.id, "2x4")[0]?.size).toBe(
      "2x4",
    );
  });

  test("a wider tile pushes the next one to the next row", () => {
    let widgets = addWidget(addWidget([], "homework"), "marks");
    widgets = resizeWidget(widgets, widgets[0]!.id, "2x2");
    widgets = addWidget(widgets, "exams");

    expect(widgets.map((w) => [w.x, w.y])).toEqual([
      [0, 0],
      [2, 0],
      [3, 0],
    ]);
  });

  test("moving reorders and removing closes the gap", () => {
    const widgets = addWidget(
      addWidget(addWidget([], "homework"), "marks"),
      "exams",
    );
    const [a, b, c] = widgets;
    const moved = moveWidget(widgets, c!.id, 0);

    expect(inOrder(moved).map((w) => w.id)).toEqual([c!.id, a!.id, b!.id]);
    expect(removeWidget(moved, a!.id).map((w) => w.id)).toEqual([c!.id, b!.id]);
  });

  test("text is white on black, black on white and readable on every palette colour", () => {
    expect(textOn("#000000")).toBe("#FFFFFF");
    expect(textOn("#FFFFFF")).toBe("#000000");
    for (const color of PALETTE)
      expect(contrastRatio(color, textOn(color))).toBeGreaterThanOrEqual(4.5);
  });

  test("colouring a widget sets its text colour and clearing removes both", () => {
    const widgets = addWidget([], "homework");
    const id = widgets[0]!.id;

    const dark = colorWidget(widgets, id, "#000000");
    expect(dark[0]).toMatchObject({ color: "#000000", text_color: "#FFFFFF" });
    expect(colorWidget(dark, id, null)[0]).toMatchObject({
      color: null,
      text_color: null,
    });
  });
});
