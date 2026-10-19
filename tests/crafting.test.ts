import assert from "node:assert/strict";
import test from "node:test";
import { calculate } from "../src/lib/calculator.ts";
import { calculateTiming, getTimingIssues, stationsForInput } from "../src/lib/crafting.ts";
import { formatDuration } from "../src/lib/format.ts";
import { defaultCraftSeconds, withStation } from "../src/lib/blueprint.ts";
import type { CalculatorInput } from "../src/types/calculator.ts";

const levels = [{ level: 1, totalXp: 0 }, { level: 2, totalXp: 10000 }];
const input = (changes: Partial<CalculatorInput> = {}): CalculatorInput => ({
  item: { name: "Rex Saddle", experience: 100, resources: ["Metal Ingot"] },
  qualityId: "primitive",
  stationId: "smithy",
  craftSeconds: "12",
  craftTimeBasis: "station",
  clockEnabled: false,
  clockMode: "",
  splitResources: false,
  serverRate: "1",
  currentLevel: "1",
  targetLevel: "2",
  playerCount: 1,
  buffIds: [],
  tribeTowerBonus: "",
  grinding: false,
  recycler: false,
  resources: [{ id: "metal", name: "Metal Ingot", quantity: "100" }],
  ...changes,
  stationCount: changes.stationCount ?? changes.playerCount ?? 1,
});

test("uses the published recipe time and compares both station queues", () => {
  const plan = input();
  plan.craftSeconds = defaultCraftSeconds(plan.item, plan.stationId);
  const result = calculate(plan, levels)!;
  assert.equal(result.craftsPerStation, 100);
  assert.equal(result.timing?.partySeconds, 1000);
  assert.deepEqual(result.timing?.stations.map(({ secondsPerCraft, partySeconds }) =>
    [secondsPerCraft, partySeconds]), [[10, 1000], [10 / 12, 100 * (10 / 12)]]);
  assert.equal(calculate(withStation(plan, "replicator"), levels)?.timing?.partySeconds, 100 * (10 / 12));
});

test("cake adds ten percent XP and stacks with the selected egg and broth", () => {
  const result = calculate(input({ buffIds: ["broth", "egg", "cake"] }), levels)!;
  assert.equal(result.combinedMultiplier, 1.5 * 1.1 * 1.1);
  assert.equal(result.craftsPerStation, 56);
  assert.equal(result.timing?.partySeconds, 672);
  assert.deepEqual(result.timing?.consumables.map(({ id, perPlayer, total }) =>
    [id, perPlayer, total]), [["broth", 1, 1], ["egg", 2, 2], ["cake", 2, 2]]);
});

test("counts initial doses and renewals at each exact buff boundary", () => {
  const plan = input({ craftSeconds: "1", buffIds: ["egg", "broth", "cake"] });
  for (const [seconds, broth, egg, cake] of [
    [1, 1, 1, 1], [599, 1, 1, 1], [600, 1, 1, 1], [601, 1, 2, 2],
    [1200, 1, 2, 2], [1201, 2, 3, 3], [2400, 2, 4, 4],
  ]) {
    assert.deepEqual(calculateTiming(plan, seconds)?.consumables.map(({ perPlayer }) => perPlayer),
      [broth, egg, cake], `coverage for ${seconds} seconds`);
  }
});

test("party time uses parallel crafting and rounds doses per player before multiplying", () => {
  const plan = input({ playerCount: 2, buffIds: ["egg", "broth", "cake"] });
  const result = calculate(plan, levels)!;
  assert.equal(result.craftsPerStation, 37);
  assert.equal(result.totalCrafts, 74);
  assert.equal(result.timing?.partySeconds, 444);
  assert.deepEqual(result.timing?.consumables.map(({ perPlayer, total }) => [perPlayer, total]),
    [[1, 2], [1, 2], [1, 2]]);
  const longPlan = calculateTiming(plan, 101)!;
  assert.equal(longPlan.partySeconds, 1212);
  assert.deepEqual(longPlan.consumables.map(({ perPlayer, total }) => [perPlayer, total]),
    [[2, 4], [3, 6], [3, 6]]);
});

test("a faster station reduces supplies without changing crafts or XP", () => {
  const plan = input({ buffIds: ["egg", "broth", "cake"] });
  const smithy = calculate(plan, levels)!;
  const replicator = calculate(withStation(plan, "replicator"), levels)!;
  assert.equal(smithy.totalCrafts, replicator.totalCrafts);
  assert.equal(smithy.projectedXp, replicator.projectedXp);
  assert.equal(replicator.timing?.partySeconds, 56);
  assert.deepEqual(replicator.timing?.consumables.map(({ perPlayer }) => perPlayer), [1, 1, 1]);
});

test("quality, XP rate, buffs, and party size affect the time to target", () => {
  for (const changes of [
    { qualityId: "ascendant" as const }, { serverRate: "2" },
    { buffIds: ["cake" as const] }, { playerCount: 70 },
  ]) {
    const result = calculate(input(changes), levels)!;
    assert.ok(result.timing!.partySeconds < 1200);
    assert.equal(result.timing!.partySeconds, result.craftsPerStation * 12);
    assert.ok(result.projectedXp >= result.xpRequired);
  }
});

test("grinding time includes every recraft instead of just the first batch", () => {
  const result = calculate(input({ grinding: true, recycler: true, buffIds: ["cake"] }), levels)!;
  assert.ok(result.initialCraftsPerStation < result.craftsPerStation);
  assert.equal(result.timing?.partySeconds, result.craftsPerStation * 12);
  assert.equal(result.timing?.consumables[0].perPlayer, 2);
});

test("only selected consumables are counted, including one per member of a short 70-player party", () => {
  assert.deepEqual(calculate(input(), levels)?.timing?.consumables, []);
  const result = calculate(input({ playerCount: 70, buffIds: ["cake", "toilet", "note2"] }), levels)!;
  assert.deepEqual(result.timing?.consumables.map(({ id, perPlayer, total }) => [id, perPlayer, total]),
    [["cake", 1, 70]]);
});

test("empty and invalid times never invent a timing estimate", () => {
  for (const craftSeconds of ["", "0", "-1", "NaN", "Infinity", "1e309"]) {
    const plan = input({ craftSeconds });
    assert.ok(getTimingIssues(plan).length);
    assert.equal(calculate(plan, levels)?.timing, null);
  }
});

test("researched times populate automatically and accept an explicit override", () => {
  const item = { name: "Shotgun", experience: 100, resources: [] };
  const plan = input({ item, craftSeconds: defaultCraftSeconds(item, "smithy") });
  assert.equal(calculateTiming(plan, 10)?.partySeconds, 150);
  assert.equal(calculateTiming({ ...plan, craftSeconds: "0.05" }, 10)?.partySeconds, 0.5);
  assert.equal(calculateTiming(input({ craftSeconds: "24" }), 10)?.partySeconds, 240);
});

test("incompatible and unknown recipes cannot produce a station estimate", () => {
  const plan = input({ item: { name: "Pump-Action Shotgun", experience: 100, resources: [] }, craftSeconds: "15" });
  assert.deepEqual(stationsForInput(plan).map(({ id }) => id), ["replicator"]);
  assert.equal(calculateTiming(plan, 10), null);
  assert.equal(calculateTiming(withStation(plan, "replicator"), 10)?.partySeconds, 12.5);
  for (const name of ["Wooden Foundation", "Unknown recipe"]) {
    assert.equal(calculateTiming(input({ item: { name, experience: 100, resources: [] }, craftSeconds: "5" }), 10), null);
  }
});

test("duration formatting preserves subsecond crafts and long party sessions", () => {
  assert.equal(formatDuration(0.5), "0.5 s");
  assert.equal(formatDuration(1.25), "1.25 s");
  assert.equal(formatDuration(0.001), "0.001 s");
  assert.equal(formatDuration(1 / 12), "0.083333 s");
  assert.equal(formatDuration(60), "1m");
  assert.equal(formatDuration(3600.1), "1h 1s");
  assert.equal(formatDuration(90061), "1d 1h 1m 1s");
});
