import { describe, expect, it } from "vitest";
import { braceBalance, PSTACK_MAX_BYTES, sizeAndParse, sizeAndParseMissing } from "./static-checks.ts";
import { pyBraceBalance, repoDir, runCiStatic } from "./py-ci.ts";

const encoder = new TextEncoder();

describe("size/parse", () => {
  it("accepts a small exported factory", () => {
    const src = "export default function pstack() { return 1; }\n";
    const results = sizeAndParse(encoder.encode(src));
    expect(results.every((r) => r.ok)).toBe(true);
    expect(pyBraceBalance(src)).toBe(true);
  });

  it("rejects a huge file", () => {
    const raw = encoder.encode(`export default function pstack() {${"x".repeat(PSTACK_MAX_BYTES)}}`);
    const results = sizeAndParse(raw);
    expect(results.find((r) => r.name === "pstack_size")?.ok).toBe(false);
  });

  it("rejects NUL and missing export default", () => {
    expect(sizeAndParse(Uint8Array.from([0x65, 0x00])).find((r) => r.name === "pstack_parse")?.ok).toBe(
      false,
    );
    expect(sizeAndParse(encoder.encode("const x = 1;")).find((r) => r.name === "pstack_parse")?.ok).toBe(
      false,
    );
  });

  it("brace balance skips strings and comments", () => {
    const src = 'export default function pstack() { const s = "{"; /* } */ // }\n }\n';
    expect(braceBalance(src)).toBe(true);
    expect(pyBraceBalance(src)).toBe(true);
    expect(braceBalance("export default function pstack() {")).toBe(false);
    expect(pyBraceBalance("export default function pstack() {")).toBe(false);
    expect(sizeAndParseMissing().ok).toBe(false);
  });

  it("passes size/parse on this repo via ci_static.py --perf", () => {
    const { status, summary } = runCiStatic(["--perf"], repoDir());
    expect(status).toBe(0);
    expect(summary.failed).toEqual([]);
    expect(summary.ok).toBe(true);
  });
});
