import { describe, expect, it } from "vitest";
import { VIDEO_SEEDS } from "@/data/seed/video";
import type { Seed } from "@/data/seed/shared";

// A dish rewritten from a video plays one part of the video on the "Chuẩn bị nguyên liệu" screen
// and one part in each step. What she hears there has to agree with what the screen lists:
// channels usually name every ingredient and amount first and only then start working, so a
// part cut by the work alone can drop the sentence with the amount, or open on the amounts of
// another step. These rules make the build fail when that happens.
//
// Every dish in data/seed/video.ts is under these rules.

type Span = { from: number; to: number };
type Said = Span & { slot: string };

const spoken = (seed: Seed): Said[] =>
  seed.ingredients.flatMap((i) => (i.amountSource && i.amountSource !== "description" ? [{ slot: i.slot, from: i.amountSource.saidFrom, to: i.amountSource.saidTo }] : []));
const ingredientsPart = (seed: Seed): Span | null =>
  seed.source.ingredientsVideoStartSeconds == null ? null : { from: seed.source.ingredientsVideoStartSeconds, to: seed.source.ingredientsVideoEndSeconds! };
const stepPart = (st: Seed["steps"][number]): Span => ({ from: st.videoStartSeconds!, to: st.videoEndSeconds! });
const holds = (part: Span, s: Span) => part.from <= s.from && s.to <= part.to;
const time = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const show = (s: Said) => `${s.slot} (${time(s.from)}–${time(s.to)})`;

/** Every way a dish breaks the rules, in words; empty when it is fine. */
export function problems(seed: Seed): string[] {
  const out: string[] = [];
  const list = ingredientsPart(seed);
  const said = spoken(seed);

  // 1. Every number says where it comes from.
  for (const i of seed.ingredients) if (i.quantity != null && !i.amountSource) out.push(`${i.slot}: the amount has no source (DESC or said)`);

  if (list && list.to <= list.from) out.push("the ingredients part ends before it starts");
  for (const s of said) {
    if (s.to <= s.from) out.push(`${show(s)}: ends before it starts`);
    const users = seed.steps.filter((st) => st.uses.some((u) => u.slot === s.slot));

    // 2. A spoken amount can be heard: in the ingredients part, or in a step that uses it.
    const inList = list != null && holds(list, s);
    const inStep = users.some((st) => holds(stepPart(st), s));
    if (!inList && !inStep) out.push(`${show(s)}: said outside the ingredients part and outside every step that uses it`);

    // 3. No part starts or ends while an amount is being said.
    const edges = [...(list ? [["the ingredients part", list] as const] : []), ...seed.steps.map((st) => [`step ${st.no}`, stepPart(st)] as const)];
    for (const [name, part] of edges) for (const edge of [part.from, part.to]) if (s.from < edge && edge < s.to) out.push(`${show(s)}: ${name} is cut at ${time(edge)}, in the middle of this amount`);

    // 4. A step's part does not carry the amount of something the step does not use.
    for (const st of seed.steps) if (holds(stepPart(st), s) && !users.includes(st)) out.push(`${show(s)}: heard in step ${st.no}, which does not use it`);

    // 5. An amount said just before or after a step that uses it belongs in that step's part.
    if (!inStep) {
      for (const st of users) {
        const part = stepPart(st);
        const gap = s.to <= part.from ? part.from - s.to : s.from >= part.to ? s.from - part.to : 0;
        if (gap < NEAR) out.push(`${show(s)}: only ${gap} s from step ${st.no} (${time(part.from)}–${time(part.to)}), which uses it — widen the step's part`);
      }
    }
  }
  return out;
}
const NEAR = 10;

const byId = (id: string) => VIDEO_SEEDS.find((s) => s.seedId === id)!;

describe("the parts of the video agree with what the screen lists", () => {
  it("covers all thirty-nine dishes", () => {
    expect(VIDEO_SEEDS).toHaveLength(39);
  });

  for (const seed of VIDEO_SEEDS) {
    it(`${seed.name}: every amount has a source and can be heard where it is used`, () => {
      expect(problems(seed)).toEqual([]);
    });
  }

  // The two faults the owner found by trying the dishes, as they were — the rules must catch both.
  it("catches a step that starts after the amount it uses has been said (canh hẹ, step 1 at 0:57)", () => {
    const seed = structuredClone(byId("video-canh-he-dau-hu-thit-bam-tu-le"));
    seed.steps[0].videoStartSeconds = 57;
    expect(problems(seed).join("\n")).toMatch(/thit \(0:55–0:57\): only 0 s from step 1/);
  });
  it("catches a step that opens on the amounts of another step (canh mướp, step 2 at 2:01)", () => {
    const seed = structuredClone(byId("video-canh-muop-thit-bam-tu-le"));
    seed.steps[1].videoStartSeconds = 121;
    const found = problems(seed).join("\n");
    expect(found).toMatch(/duong \(2:00–2:02\): step 2 is cut at 2:01, in the middle of this amount/);
    expect(found).toMatch(/tom_kho \(2:02–2:05\): heard in step 2, which does not use it/);
  });
  it("catches an amount with no source, and one said where nothing plays", () => {
    const seed = structuredClone(byId("video-canh-he-dau-hu-thit-bam-tu-le"));
    delete seed.ingredients.find((i) => i.slot === "he")!.amountSource;
    delete seed.source.ingredientsVideoStartSeconds;
    delete seed.source.ingredientsVideoEndSeconds;
    const found = problems(seed).join("\n");
    expect(found).toMatch(/he: the amount has no source/);
    expect(found).toMatch(/muoi \(2:02–2:04\): said outside the ingredients part and outside every step that uses it/);
  });

  it("marks the steps whose part of the video does not say the amounts they use", () => {
    const soup = byId("video-canh-he-dau-hu-thit-bam-tu-le");
    // Step 1 hears its amounts; step 3 adds seasonings the channel only measured at the start.
    expect(soup.steps.map((s) => s.videoOmitsAmounts ?? false)).toEqual([false, true, true, false]);
  });

  it("the phone does not store where an amount comes from", async () => {
    const { BepNhaDB, setDbForTests } = await import("@/data/db");
    const repo = await import("@/data/repo");
    setDbForTests(new BepNhaDB("test-video-seeds"));
    await repo.ensureSeeded();
    const dish = (await repo.listRecipes()).find((r) => r.name === "Canh hẹ đậu hũ non thịt bằm (Tú Lê)")!;
    const bundle = (await repo.getRecipeBundle(dish.id))!;
    expect(bundle.recipe.source.ingredientsVideoStartSeconds).toBe(31);
    expect(bundle.recipe.source.ingredientsVideoEndSeconds).toBe(127);
    for (const i of bundle.original.ingredients) expect(i).not.toHaveProperty("amountSource");
  });
});
