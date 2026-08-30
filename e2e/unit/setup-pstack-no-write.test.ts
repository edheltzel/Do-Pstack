import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { repoDir } from "./py-ci.ts";

const MODELS_JSON = "~/.omp/agent/pstack/models.json";
const CONFIG_YML = "~/.omp/agent/config.yml";
const WRITE_TARGETS = [MODELS_JSON, CONFIG_YML] as const;
const WRITE_VERB = /\b(write|writes|writing|edit|edits|create|creates|save|saves|overwrite|overwrites|touch|touches)\b/i;
const NEGATED =
  /do not (write|edit|create|save|overwrite|touch)|don't (write|edit)|writes no|not omp routing|ignore it|\*\*not\*\*/i;

function skillText(): string {
  return readFileSync(join(repoDir(), "skills/setup-pstack/SKILL.md"), "utf8");
}

function commandText(): string {
  return readFileSync(join(repoDir(), "commands/setup-pstack.md"), "utf8");
}

function mentionsTarget(line: string, target: string): boolean {
  const base = target.split("/").pop() ?? target;
  return line.includes(target) || line.includes(base);
}

/** True when a line names a routing file as a write target without a Do-not-write hedge. */
export function instructsWriteTarget(text: string, target: string): boolean {
  for (const line of text.split(/\r?\n/)) {
    if (!mentionsTarget(line, target)) continue;
    if (WRITE_VERB.test(line) && !NEGATED.test(line)) return true;
  }
  return false;
}

function hasNoWriteContract(text: string): boolean {
  const lower = text.toLowerCase();
  const hedge = lower.includes("do not write") || lower.includes("do not edit") || lower.includes("writes no");
  return hedge && text.includes("models.json") && text.includes("config.yml");
}

describe("setup-pstack no-write contract", () => {
  it("skill markdown forbids writing models.json and config.yml", () => {
    const skill = skillText();
    expect(hasNoWriteContract(skill)).toBe(true);
    expect(skill).toContain(MODELS_JSON);
    expect(skill).toContain(CONFIG_YML);
    expect(skill).toMatch(/do not write/i);
  });

  it("command markdown loads the skill and does not name those files as write targets", () => {
    const command = commandText();
    expect(command).toMatch(/skill:\/\/setup-pstack/);
    for (const target of WRITE_TARGETS) {
      expect(instructsWriteTarget(command, target)).toBe(false);
    }
  });

  it("fails if skill or command instructs writing the routing files", () => {
    const skill = skillText();
    const command = commandText();
    for (const target of WRITE_TARGETS) {
      expect(instructsWriteTarget(skill, target)).toBe(false);
      expect(instructsWriteTarget(command, target)).toBe(false);
    }
  });

  it("detector treats an affirmative write as a hole and a Do-not-write line as ok", () => {
    expect(instructsWriteTarget(`Write ${MODELS_JSON} after listing roles.`, MODELS_JSON)).toBe(true);
    expect(instructsWriteTarget(`Create ${CONFIG_YML} if missing.`, CONFIG_YML)).toBe(true);
    expect(instructsWriteTarget(`Do not write ${MODELS_JSON}`, MODELS_JSON)).toBe(false);
    expect(instructsWriteTarget(`Do not edit ${CONFIG_YML} by hand unless the user asks.`, CONFIG_YML)).toBe(
      false,
    );
  });
});
