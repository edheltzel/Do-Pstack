import { describe, expect, it } from "vitest";
import { pyFrontmatter } from "./py-ci.ts";

const cases: { name: string; text: string; fields: Record<string, string> | null }[] = [
  {
    name: "plain name and description",
    text: "---\nname: unslop\ndescription: Cut AI tells.\n---\n\n# body\n",
    fields: { name: "unslop", description: "Cut AI tells." },
  },
  {
    name: "quoted description",
    text: '---\nname: how\ndescription: "Use for how does X work"\n---\n',
    fields: { name: "how", description: "Use for how does X work" },
  },
  {
    name: "folded description",
    text: "---\nname: Make Bot UI\ndescription: >-\n  Use when building a UI\n  over a webhook.\n---\n",
    fields: { name: "Make Bot UI", description: "Use when building a UI over a webhook." },
  },
  {
    name: "command description only",
    text: "---\ndescription: Enable poteto-mode for this turn.\n---\n",
    fields: { description: "Enable poteto-mode for this turn." },
  },
  {
    name: "missing closing fence",
    text: "---\nname: x\ndescription: y\n",
    fields: null,
  },
  {
    name: "no frontmatter",
    text: "# just markdown\n",
    fields: null,
  },
];

describe("frontmatter_fields (ci_static.py)", () => {
  it.each(cases)("$name", ({ text, fields }) => {
    expect(pyFrontmatter(text)).toEqual(fields);
  });
});
