import { describe, test, expect } from "vitest";
import { dictionaryEntries } from "arcade-hub-ui/i18n/index.svelte.js";
import messages from "./i18n.js";

// Every text of this game exists in both languages, with the same placeholders and plural forms.
describe("the game's texts match in both languages", () => {
  const placeholders = (value) =>
    [...new Set(JSON.stringify(value).match(/\{\w+\}/g) ?? [])].sort().join(",");

  const en = Object.fromEntries(dictionaryEntries(messages.en));
  const pt = Object.fromEntries(dictionaryEntries(messages["pt-BR"]));

  test("same keys", () => {
    expect(Object.keys(pt).sort()).toEqual(Object.keys(en).sort());
  });

  test("same placeholders and plural shape", () => {
    for (const [key, value] of Object.entries(en)) {
      expect(placeholders(pt[key]), key).toBe(placeholders(value));
      expect(typeof pt[key], key).toBe(typeof value);
    }
  });
});

describe("How to play", () => {
  test("3 or 4 steps in each language, each with a title and a text", () => {
    for (const lang of ["en", "pt-BR"]) {
      const steps = messages[lang].stickSlash.steps;
      expect(steps.length, lang).toBeGreaterThanOrEqual(3);
      expect(steps.length, lang).toBeLessThanOrEqual(4);
      for (const step of steps) {
        expect(step.title, lang).toBeTruthy();
        expect(step.text, lang).toBeTruthy();
      }
    }
    expect(messages.en.stickSlash.steps.length).toBe(messages["pt-BR"].stickSlash.steps.length);
  });
});
