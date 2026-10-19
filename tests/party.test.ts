import { testPlayers } from "./fixtures.ts";
import assert from "node:assert/strict";
import test from "node:test";
import { calculate, getInputIssues } from "../src/lib/calculator.ts";
import { withClock, withStation } from "../src/lib/blueprint.ts";
import { partySetup, restorePartyCounts } from "../src/lib/party.ts";
import type { CalculatorInput } from "../src/types/calculator.ts";

const levels = [{ level: 1, totalXp: 0 }, { level: 2, totalXp: 10000 }];
const input = (playerCount: number, stationCount: number): CalculatorInput => ({
  item: { name: "Rex Saddle", experience: 100, resources: ["Metal", "Wood"] },
  qualityId: "primitive", stationId: "smithy", craftSeconds: "12", craftTimeBasis: "station",
  clockEnabled: false, clockMode: "", serverRate: "1", currentLevel: "1", targetLevel: "2",
  playerCount, stationCount, players: testPlayers(playerCount), buffIds: [], tribeTowerBonus: "", grinding: false, recycler: false,
  splitResources: false, resources: [
    { id: "metal", name: "Metal", quantity: "100" },
    { id: "wood", name: "Wood", quantity: "7" },
  ],
});

test("one player runs 10 or 20 stations with full own XP from each station", () => {
  const solo = calculate(input(1, 1), levels)!;
  for (const stationCount of [10, 20]) {
    const plan = input(1, stationCount);
    const result = calculate(plan, levels)!;
    assert.deepEqual(partySetup(plan), {
      craftingPlayers: 1, sharingPlayers: 0,
      minStationsPerCrafter: stationCount, maxStationsPerCrafter: stationCount,
    });
    assert.equal(result.sharedXpPerRound, 0);
    assert.equal(result.craftsPerStation, 100 / stationCount);
    assert.equal(result.totalCrafts, 100);
    assert.equal(result.timing?.partySeconds, 1200 / stationCount);
    assert.deepEqual(result.resources, solo.resources);
  }
});

test("50 players and 10 stations wait for the 40 shared-only players", () => {
  const plan = input(50, 10);
  const result = calculate(plan, levels)!;
  assert.deepEqual(partySetup(plan), {
    craftingPlayers: 10, sharingPlayers: 40, minStationsPerCrafter: 1, maxStationsPerCrafter: 1,
  });
  assert.equal(result.crafterXpPerRound, 550);
  assert.equal(result.passiveXpPerRound, 500);
  assert.equal(result.xpPerPlayerPerRound, 500);
  assert.equal(result.craftsPerStation, 20);
  assert.equal(result.totalCrafts, 200);
  assert.equal(result.timing?.partySeconds, 240);
  assert.equal(result.resources[0].total, 20000);
  assert.equal(result.resources[0].perPlayer, 400);
  const moreSpectators = calculate(input(70, 10), levels)!;
  assert.equal(moreSpectators.craftsPerStation, result.craftsPerStation);
  assert.equal(moreSpectators.timing?.partySeconds, result.timing?.partySeconds);
  assert.equal(moreSpectators.resources[0].total, result.resources[0].total);
});

test("uneven station assignments use the slowest recipient's progress", () => {
  const plan = input(3, 20);
  const result = calculate(plan, levels)!;
  assert.deepEqual(partySetup(plan), {
    craftingPlayers: 3, sharingPlayers: 0, minStationsPerCrafter: 6, maxStationsPerCrafter: 7,
  });
  assert.equal(result.xpPerPlayerPerRound, 1300);
  assert.equal(result.craftsPerStation, 8);
  assert.equal(result.totalCrafts, 160);
  assert.equal(result.projectedXp, 10400);
  assert.equal(result.timing?.partySeconds, 96);
});

test("simulated crafting events reach every player's target in exactly the planned rounds", () => {
  for (const [players, stations] of [[1, 20], [50, 10], [3, 20], [2, 3], [70, 1], [70, 100], [70, 70]]) {
    const plan = input(players, stations);
    const result = calculate(plan, levels)!;
    const xp = Array.from({ length: players }, () => 0);
    let previousMinimum = 0;
    for (let round = 0; round < result.craftsPerStation; round += 1) {
      previousMinimum = Math.min(...xp);
      for (let station = 0; station < stations; station += 1) {
        xp.forEach((value, player) => { xp[player] = value + (player === station % players ? 100 : 50); });
      }
    }
    assert.ok(xp.every((value) => value >= 10000), `${players} players, ${stations} stations`);
    assert.ok(previousMinimum < 10000);
    assert.equal(Math.min(...xp), result.projectedXp);
    assert.equal(result.totalCrafts, stations * result.craftsPerStation);
  }
});

test("clock, station speed, party supplies, and resource shares use the independent counts", () => {
  const plan = { ...input(50, 10), buffIds: ["egg", "broth", "cake"] as CalculatorInput["buffIds"] };
  const normal = calculate(plan, levels)!;
  const tek = calculate(withStation(plan, "replicator"), levels)!;
  assert.equal(tek.timing!.partySeconds, normal.timing!.partySeconds / 12);
  for (const mode of ["area", "targeted"] as const) {
    const result = calculate(withClock(withStation(plan, "replicator"), true, mode), levels)!;
    assert.equal(result.timing!.partySeconds, tek.timing!.partySeconds / (mode === "area" ? 2 : 4));
    assert.deepEqual(result.resources, normal.resources);
    assert.equal(result.totalCrafts, normal.totalCrafts);
    result.timing!.consumables.forEach(({ perPlayer, total, durationSeconds }) => {
      assert.equal(perPlayer, Math.ceil(result.timing!.partySeconds / durationSeconds));
      assert.equal(total, perPlayer * 50);
    });
  }
  assert.deepEqual(calculate({ ...plan, splitResources: true }, levels), normal);
});

test("recycling funds every parallel station and resource shares cover starting supplies", () => {
  for (const [players, stations] of [[1, 20], [50, 10], [3, 20]]) {
    for (const recycler of [false, true]) {
      const plan = { ...input(players, stations), grinding: true, recycler };
      const result = calculate(plan, levels)!;
      const costs = [100, 7];
      const refunds = [recycler ? 39 : 30, 3];
      const inventory = result.resources.map(({ total }) => total / stations);
      for (let round = 0; round < result.craftsPerStation; round += 1) {
        inventory.forEach((value, index) => {
          assert.ok(value >= costs[index], "each station must be able to fund its next craft");
          inventory[index] = value - costs[index] + refunds[index];
        });
      }
      result.resources.forEach(({ total, perPlayer }) => assert.ok(perPlayer * players >= total));
      assert.equal(result.initialCraftsPerStation + result.recycledCraftsPerStation, result.craftsPerStation);
      assert.equal(result.timing!.partySeconds, result.craftsPerStation * 12);
    }
  }
});

test("stored party counts preserve existing station assumptions and explicit independent counts", () => {
  assert.deepEqual(restorePartyCounts({ playerCount: 50 }), { playerCount: 50, stationCount: 50 });
  assert.deepEqual(restorePartyCounts({ playerCount: 1, stationCount: 20 }), { playerCount: 1, stationCount: 20 });
  assert.deepEqual(restorePartyCounts({ playerCount: 50, stationCount: 10 }), { playerCount: 50, stationCount: 10 });
  assert.deepEqual(restorePartyCounts({ playerCount: 2.7, stationCount: 3.8 }), { playerCount: 2, stationCount: 3 });
  assert.deepEqual(restorePartyCounts({ playerCount: NaN, stationCount: Infinity }), { playerCount: 1, stationCount: 1 });
});

test("invalid player and station counts cannot produce misleading totals", () => {
  for (const count of [0, -1, 1.5, NaN, Infinity, 101]) {
    assert.equal(calculate(input(1, count), levels), null);
    assert.ok(getInputIssues(input(1, count), levels).some((issue) => issue.includes("active stations")));
  }
  assert.equal(calculate(input(71, 1), levels), null);
});
