import { describe, test, expect } from "vitest";
import messages from "./i18n.js";

describe("How to play", () => {
  test("3 or 4 steps, each with a title and a text", () => {
    const steps = messages.stickSlash.steps;
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps.length).toBeLessThanOrEqual(4);
    for (const step of steps) {
      expect(step.title).toBeTruthy();
      expect(step.text).toBeTruthy();
    }
  });
});
