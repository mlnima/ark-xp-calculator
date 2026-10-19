import assert from "node:assert/strict";
import test from "node:test";
import items from "../src/data/items.json" with { type: "json" };
import { emptyInput, hydrateInput } from "../src/lib/input-state.ts";
import { mergeSaved, parseBackup, serializeBackup } from "../src/lib/backup.ts";
import { resizeParty } from "../src/lib/players.ts";
import { withClock, withCraftingItem, withQuality, withStation } from "../src/lib/blueprint.ts";
import type { CalculatorBackup } from "../src/lib/backup.ts";

const snapshot = (): CalculatorBackup => {
  const item = items.find(({ name }) => name === "Shotgun")!;
  let input = withClock(withStation(withQuality(withCraftingItem(emptyInput(), item), "primitive"), "replicator"), true, "targeted");
  input.players[0] = { name: "Alice & Bob 🦖", currentLevel: "230", targetLevel: "245" };
  input = resizeParty(input, 3);
  input.players[1] = { name: "Bob", currentLevel: "200", targetLevel: "240" };
  input.players[2].name = "Charlie";
  input = { ...input, stationCount: 20, serverRate: "2.5", craftSeconds: "0.125", splitResources: true,
    buffIds: ["egg", "cake", "broth", "tower", "drakeling"], tribeTowerBonus: "17", grinding: true, recycler: true };
  input.resources[0].quantity = "777";
  return { input, saved: [{ id: "party-a", name: "Our party", input }], activeSavedId: "party-a", calculationName: "Our party edited" };
};

test("JSON round trip retains every setting, player, draft, saved plan, and active selection", () => {
  const backup = snapshot();
  assert.deepEqual(parseBackup(serializeBackup(backup), items), backup);
});

test("unfinished drafts and explicitly cleared fields survive JSON and local restoration", () => {
  const backup = snapshot();
  backup.input.craftSeconds = "";
  backup.input.resources[0].quantity = "";
  backup.input.players[0] = { name: "", currentLevel: "", targetLevel: "" };
  assert.deepEqual(parseBackup(serializeBackup(backup), items), backup);
  assert.deepEqual(hydrateInput(backup.input, items), backup.input);
  const empty = { input: emptyInput(), saved: [], activeSavedId: "", calculationName: "" };
  assert.deepEqual(parseBackup(serializeBackup(empty), items), empty);
});

test("inactive player rows survive export and import", () => {
  const backup = snapshot();
  backup.input = resizeParty(backup.input, 1);
  const restored = parseBackup(serializeBackup(backup), items);
  assert.equal(restored.input.playerCount, 1);
  assert.deepEqual(resizeParty(restored.input, 3).players, backup.input.players);
});

test("merging preserves existing plans and remaps colliding imported IDs", () => {
  const backup = snapshot();
  const existing = [{ ...backup.saved[0], name: "Existing party" }];
  const result = mergeSaved(existing, backup.saved, backup.activeSavedId);
  assert.deepEqual(result.saved[0], existing[0]);
  assert.equal(result.saved.length, 2);
  assert.notEqual(result.saved[1].id, existing[0].id);
  assert.equal(result.activeSavedId, result.saved[1].id);
  assert.deepEqual(result.saved[1].input, backup.input);
  const repeated = mergeSaved(result.saved, backup.saved, backup.activeSavedId);
  assert.equal(repeated.saved.length, 2);
  assert.equal(repeated.activeSavedId, result.activeSavedId);
});

test("re-importing matching saved plans does not duplicate them", () => {
  const backup = snapshot();
  const merged = mergeSaved(backup.saved, backup.saved, backup.activeSavedId);
  assert.deepEqual(merged, { saved: backup.saved, activeSavedId: backup.activeSavedId });
});

test("invalid JSON, unsupported backups, and malformed profiles are rejected", () => {
  assert.throws(() => parseBackup("{broken", items), /not valid JSON/);
  for (const value of [null, [], {}, { format: "other", version: 1 }, { format: "ark-crafting-xp", version: 2 }]) {
    assert.throws(() => parseBackup(JSON.stringify(value), items));
  }
  for (const change of [
    { playerCount: 0 }, { playerCount: 71 }, { stationCount: 0 }, { stationCount: 1.5 },
    { players: [] }, { players: [null, null, null] },
    { players: [{ name: "Alice", currentLevel: "999", targetLevel: "245" }] },
    { clockMode: "unknown" }, { buffIds: ["egg", "egg"] }, { buffIds: ["unknown"] },
    { serverRate: "Infinity" }, { resources: [] }, { item: { name: "Unknown item" } },
    { grinding: false, recycler: true },
  ]) {
    const backup = snapshot();
    assert.throws(() => parseBackup(serializeBackup({ ...backup, input: { ...backup.input, ...change } } as CalculatorBackup), items));
  }
});

test("invalid saved libraries and active selections are rejected before a backup is returned", () => {
  const backup = snapshot();
  for (const change of [
    { saved: null }, { saved: [{ ...backup.saved[0], input: null }] },
    { saved: [backup.saved[0], backup.saved[0]] }, { activeSavedId: "missing" },
    { saved: [{ ...backup.saved[0], name: "" }] }, { calculationName: null },
  ]) {
    assert.throws(() => parseBackup(JSON.stringify({ ...JSON.parse(serializeBackup(backup)), ...change }), items));
  }
});
