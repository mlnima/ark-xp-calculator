import assert from "node:assert/strict";
import test from "node:test";
import { calculate, getInputIssues } from "../src/lib/calculator.ts";
import { emptyInput, hydrateInput } from "../src/lib/input-state.ts";
import { newPlayer, resizeParty } from "../src/lib/players.ts";
import { withClock, withStation } from "../src/lib/blueprint.ts";
import { testPlayers } from "./fixtures.ts";

const levels = [
  { level: 1, totalXp: 0 }, { level: 2, totalXp: 1000 },
  { level: 3, totalXp: 10000 }, { level: 4, totalXp: 15000 },
];
const input = () => ({
  ...emptyInput(), item: { name: "Rex Saddle", experience: 100, resources: ["Metal"] },
  qualityId: "primitive" as const, serverRate: "1", craftSeconds: "12", playerCount: 3, stationCount: 2,
  players: [
    { name: "Alice", currentLevel: "1", targetLevel: "2" },
    { name: "Bob", currentLevel: "2", targetLevel: "3" },
    { name: "Charlie", currentLevel: "1", targetLevel: "4" },
  ],
  resources: [{ id: "metal", name: "Metal", quantity: "100" }],
});

test("new players get numbered names and copy both levels from Player 1", () => {
  const first = { ...emptyInput(), players: [{ name: "Alice", currentLevel: "230", targetLevel: "245" }] };
  const result = resizeParty(first, 10);
  assert.equal(result.playerCount, 10);
  assert.equal(result.players[0].name, "Alice");
  assert.deepEqual(result.players.slice(1), Array.from({ length: 9 }, (_, index) => ({
    name: `Player ${index + 2}`, currentLevel: "230", targetLevel: "245",
  })));
  assert.deepEqual(newPlayer(0), { name: "Player 1", currentLevel: "", targetLevel: "" });
});

test("shrinking and expanding keeps renamed and edited rows; only new rows inherit", () => {
  const original = input();
  const smaller = resizeParty(original, 1);
  smaller.players = [{ name: "Changed", currentLevel: "3", targetLevel: "4" }, ...smaller.players.slice(1)];
  const expanded = resizeParty(smaller, 4);
  assert.deepEqual(expanded.players[1], original.players[1]);
  assert.deepEqual(expanded.players[2], original.players[2]);
  assert.deepEqual(expanded.players[3], { name: "Player 4", currentLevel: "3", targetLevel: "4" });
});

test("each player's levels and station ownership determine their XP and finish time", () => {
  const result = calculate(input(), levels)!;
  assert.deepEqual(result.players.map(({ name, stations, xpRequired, xpPerRound, roundsToTarget, secondsToTarget }) =>
    [name, stations, xpRequired, xpPerRound, roundsToTarget, secondsToTarget]), [
    ["Alice", 1, 1000, 150, 7, 84], ["Bob", 1, 9000, 150, 60, 720], ["Charlie", 0, 15000, 100, 150, 1800],
  ]);
  assert.equal(result.limitingPlayerIndex, 2);
  assert.equal(result.craftsPerStation, 150);
  assert.equal(result.totalCrafts, 300);
  assert.equal(result.resources[0].total, 30000);
  assert.equal(result.resources[0].perPlayer, 10000);
  assert.equal(result.timing?.partySeconds, 1800);
});

test("a crafter with a larger target can determine completion ahead of a shared-only player", () => {
  const plan = input();
  plan.players[2].targetLevel = "2";
  const result = calculate(plan, levels)!;
  assert.equal(result.limitingPlayerIndex, 1);
  assert.equal(result.craftsPerStation, 60);
  assert.equal(result.players[2].roundsToTarget, 10);
  assert.equal(result.timing?.partySeconds, 720);
});

test("simulated XP events match every individual's target round and the party stop round", () => {
  for (const stationCount of [1, 2, 3, 5, 20]) {
    const plan = { ...input(), stationCount };
    const result = calculate(plan, levels)!;
    const xp = [0, 0, 0];
    const finished = [0, 0, 0];
    for (let round = 1; round <= result.craftsPerStation; round += 1) {
      for (let station = 0; station < stationCount; station += 1) {
        xp.forEach((value, player) => { xp[player] = value + (station % 3 === player ? 100 : 50); });
      }
      xp.forEach((value, player) => {
        finished[player] ||= value >= result.players[player].xpRequired ? round : 0;
      });
    }
    assert.deepEqual(finished, result.players.map(({ roundsToTarget }) => roundsToTarget));
    assert.deepEqual(xp, result.players.map(({ projectedXp }) => projectedXp));
    assert.equal(Math.max(...finished), result.craftsPerStation);
    assert.ok(result.players.every(({ xpOverTarget }) => xpOverTarget >= 0));
  }
});

test("station speed and clock change individual times without changing XP or resource totals", () => {
  const normal = calculate(input(), levels)!;
  const boosted = calculate(withClock(withStation(input(), "replicator"), true, "targeted"), levels)!;
  normal.players.forEach((player, index) => {
    assert.equal(boosted.players[index].secondsToTarget, player.secondsToTarget! / 48);
    assert.equal(boosted.players[index].roundsToTarget, player.roundsToTarget);
  });
  assert.deepEqual(normal.resources, boosted.resources);
  assert.equal(boosted.totalCrafts, normal.totalCrafts);
});

test("incomplete rows identify the player and inactive rows do not block the active party", () => {
  const plan = input();
  plan.players[1].targetLevel = "1";
  assert.ok(getInputIssues(plan, levels).includes("Bob: Target level must be higher than current level"));
  assert.equal(calculate(plan, levels), null);
  assert.ok(calculate(resizeParty(plan, 1), levels));
  const missing = { ...input(), players: testPlayers(1) };
  assert.equal(calculate(missing, levels), null);
});

test("existing saved shared levels become named rows without losing the selected levels", () => {
  const stored = { ...emptyInput(), playerCount: 3, currentLevel: "200", targetLevel: "245", players: undefined };
  const restored = hydrateInput(stored, []);
  assert.deepEqual(restored.players, testPlayers(3, "200", "245"));
});
