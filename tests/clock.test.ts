import { testPlayers } from "./fixtures.ts";
import assert from "node:assert/strict";
import test from "node:test";
import { calculate } from "../src/lib/calculator.ts";
import { calculateTiming, getTimingIssues } from "../src/lib/crafting.ts";
import { clockSpeed, withClock, withCraftingItem, withStation } from "../src/lib/blueprint.ts";
import type { CalculatorInput } from "../src/types/calculator.ts";

const levels = [{ level: 1, totalXp: 0 }, { level: 2, totalXp: 12000 }];
const input = (): CalculatorInput => ({
  item: { name: "Rex Saddle", experience: 100, resources: ["Metal Ingot"] },
  qualityId: "primitive", stationId: "smithy", craftSeconds: "24", craftTimeBasis: "station",
  clockEnabled: false, clockMode: "", serverRate: "1", currentLevel: "1", targetLevel: "2",
  playerCount: 1, stationCount: 1, players: testPlayers(1), buffIds: ["broth", "egg", "cake"], tribeTowerBonus: "", grinding: false,
  recycler: false, splitResources: true, resources: [{ id: "metal", name: "Metal Ingot", quantity: "100" }],
});

test("area and targeted clock modes give 2x and 4x speed without changing XP or resources", () => {
  const plan = input();
  const normal = calculate(plan, levels)!;
  const area = calculate(withClock(plan, true, "area"), levels)!;
  const targeted = calculate(withClock(plan, true, "targeted"), levels)!;
  assert.equal(normal.craftsPerStation, 67);
  assert.deepEqual([normal, area, targeted].map(({ timing }) => timing?.secondsPerCraft), [24, 12, 6]);
  assert.deepEqual([normal, area, targeted].map(({ timing }) => timing?.partySeconds), [1608, 804, 402]);
  assert.deepEqual([normal, area, targeted].map(({ timing }) => timing?.consumables.map(({ perPlayer }) => perPlayer)),
    [[2, 3, 3], [1, 2, 2], [1, 1, 1]]);
  for (const result of [area, targeted]) {
    assert.equal(result.combinedMultiplier, normal.combinedMultiplier);
    assert.equal(result.ownXpPerCraft, normal.ownXpPerCraft);
    assert.equal(result.craftsPerStation, normal.craftsPerStation);
    assert.deepEqual(result.resources, normal.resources);
  }
});

test("the clock composes with Tek Replicator and item defaults exactly once", () => {
  const tek = withStation(input(), "replicator");
  assert.equal(tek.craftSeconds, "2");
  assert.equal(withClock(tek, true, "area").craftSeconds, "1");
  const targeted = withClock(tek, true, "targeted");
  assert.equal(targeted.craftSeconds, "0.5");
  const shotgun = withCraftingItem(targeted, { name: "Shotgun", experience: 423.2, resources: [] });
  assert.equal(shotgun.craftSeconds, "0.3125");
  assert.equal(withStation(shotgun, "smithy").craftSeconds, "3.75");
});

test("disabling the clock and changing its mode preserve an edited craft time", () => {
  const targeted = { ...withClock(withStation(input(), "replicator"), true, "targeted"), craftSeconds: "0.125" };
  assert.equal(calculateTiming(targeted, 8)?.partySeconds, 1);
  const area = withClock(targeted, true, "area");
  assert.equal(area.craftSeconds, "0.25");
  const disabled = withClock(area, false, "area");
  assert.equal(disabled.craftSeconds, "0.5");
  assert.equal(clockSpeed(disabled), 1);
  assert.equal(withClock(disabled, true, "targeted").craftSeconds, "0.125");
});

test("an enabled clock needs an explicit mode and empty times remain empty", () => {
  const pending = withClock(input(), true, "");
  assert.ok(getTimingIssues(pending).includes("Select the active Clockface boost mode."));
  assert.equal(calculateTiming(pending, 10), null);
  assert.ok(calculateTiming(withClock(pending, false, ""), 10));
  assert.equal(withClock({ ...input(), craftSeconds: "" }, true, "area").craftSeconds, "");
});

test("clock speed and rounding stay consistent across party sizes, stations, and grinding", () => {
  for (const playerCount of [1, 3, 70]) {
    for (const stationId of ["smithy", "replicator"] as const) {
      for (const grinding of [false, true]) {
        const plan = withStation({ ...input(), playerCount, players: testPlayers(playerCount), stationCount: playerCount, grinding, recycler: grinding }, stationId);
        const normal = calculate(plan, levels)!;
        for (const mode of ["area", "targeted"] as const) {
          const result = calculate(withClock(plan, true, mode), levels)!;
          const factor = mode === "area" ? 2 : 4;
          assert.equal(result.timing!.partySeconds, normal.timing!.partySeconds / factor);
          assert.equal(result.totalCrafts, normal.totalCrafts);
          assert.deepEqual(result.resources, normal.resources);
          result.timing!.consumables.forEach(({ perPlayer, total }) => assert.equal(total, perPlayer * playerCount));
        }
      }
    }
  }
});

test("a fractional clock-boosted session renews supplies only after exact expiry", () => {
  const plan = withClock({ ...input(), craftSeconds: "0.1" }, true, "targeted");
  assert.equal(plan.craftSeconds, "0.025");
  assert.equal(calculateTiming(plan, 24000)?.partySeconds, 600);
  assert.deepEqual(calculateTiming(plan, 24000)?.consumables.map(({ perPlayer }) => perPlayer), [1, 1, 1]);
  assert.deepEqual(calculateTiming(plan, 24001)?.consumables.map(({ perPlayer }) => perPlayer), [1, 2, 2]);
});
