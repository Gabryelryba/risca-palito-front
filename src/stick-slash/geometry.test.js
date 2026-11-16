import { describe, test, expect } from "vitest";
import { segmentsIntersect, computeLayout } from "./geometry.js";

describe("segmentsIntersect", () => {
  test("detects a clean X crossing", () => {
    const a1 = { x: 0, y: 0 };
    const a2 = { x: 10, y: 10 };
    const b1 = { x: 0, y: 10 };
    const b2 = { x: 10, y: 0 };
    expect(segmentsIntersect(a1, a2, b1, b2)).toBe(true);
  });

  test("returns false for segments that don't come near each other", () => {
    const a1 = { x: 0, y: 0 };
    const a2 = { x: 1, y: 1 };
    const b1 = { x: 100, y: 100 };
    const b2 = { x: 200, y: 200 };
    expect(segmentsIntersect(a1, a2, b1, b2)).toBe(false);
  });

  test("returns false for parallel non-overlapping segments", () => {
    const a1 = { x: 0, y: 0 };
    const a2 = { x: 10, y: 0 };
    const b1 = { x: 0, y: 5 };
    const b2 = { x: 10, y: 5 };
    expect(segmentsIntersect(a1, a2, b1, b2)).toBe(false);
  });

  test("detects a T-intersection (endpoint lands on the other segment's interior)", () => {
    const a1 = { x: 5, y: -5 };
    const a2 = { x: 5, y: 5 };
    const b1 = { x: 0, y: 0 };
    const b2 = { x: 10, y: 0 };
    expect(segmentsIntersect(a1, a2, b1, b2)).toBe(true);
  });

  test("a near-vertical drag through a near-vertical stick is detected in either direction", () => {
    // Regression test: exact coordinates from a manual drag that a prior,
    // sign-inverted implementation of this function reported as a miss.
    const dragPrev = { x: 392.3789173789174, y: 224.63271103896105 };
    const dragPoint = { x: 453.20512820512823, y: 268.94007034632034 };
    const stickTop = { x: 400.01356468573795, y: 178.25 };
    const stickBottom = { x: 391.98643531426205, y: 261.05 };

    expect(segmentsIntersect(dragPrev, dragPoint, stickTop, stickBottom)).toBe(true);
    // Must also hold with the two segments' argument order swapped.
    expect(segmentsIntersect(stickTop, stickBottom, dragPrev, dragPoint)).toBe(true);
  });

  test("is symmetric regardless of which segment is passed first", () => {
    const a1 = { x: 0, y: 0 };
    const a2 = { x: 10, y: 10 };
    const b1 = { x: 0, y: 10 };
    const b2 = { x: 10, y: 0 };
    expect(segmentsIntersect(a1, a2, b1, b2)).toBe(segmentsIntersect(b1, b2, a1, a2));
  });
});

describe("computeLayout", () => {
  const rows = [5, 3, 1];
  const WIDTH = 700;
  const HEIGHT = 460;

  test("produces one row per count, with that many sticks", () => {
    const layout = computeLayout(rows, WIDTH, HEIGHT);
    expect(layout.map((row) => row.length)).toEqual(rows);
  });

  test("tags every stick with its own row and index", () => {
    const layout = computeLayout(rows, WIDTH, HEIGHT);
    layout.forEach((row, rowIndex) => {
      row.forEach((stick, i) => {
        expect(stick.row).toBe(rowIndex);
        expect(stick.index).toBe(i);
      });
    });
  });

  test("is deterministic across calls (stable tilt per stick)", () => {
    const first = computeLayout(rows, WIDTH, HEIGHT);
    const second = computeLayout(rows, WIDTH, HEIGHT);
    expect(second).toEqual(first);
  });

  test("centers each row horizontally around the canvas midline", () => {
    const layout = computeLayout(rows, WIDTH, HEIGHT);
    for (const row of layout) {
      const midIndex = (row.length - 1) / 2;
      const centers = row.map((stick) => (stick.x1 + stick.x2) / 2);
      const rowMidpoint = (centers[0] + centers[centers.length - 1]) / 2;
      expect(rowMidpoint).toBeCloseTo(WIDTH / 2, 5);
      void midIndex;
    }
  });

  test("stacks rows top to bottom within the canvas height", () => {
    const layout = computeLayout(rows, WIDTH, HEIGHT);
    const rowTops = layout.map((row) => row[0].y1);
    for (let i = 1; i < rowTops.length; i++) {
      expect(rowTops[i]).toBeGreaterThan(rowTops[i - 1]);
    }
    for (const row of layout) {
      for (const stick of row) {
        expect(stick.y1).toBeGreaterThanOrEqual(0);
        expect(stick.y2).toBeLessThanOrEqual(HEIGHT);
      }
    }
  });
});
