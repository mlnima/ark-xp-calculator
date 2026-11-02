import assert from "node:assert/strict";
import test from "node:test";
import items from "../src/data/items.json" with { type: "json" };
import levels from "../src/data/levels.json" with { type: "json" };
import { defaultInput, hydrateInput } from "../src/lib/input-state.ts";
import { calculate, getInputIssues } from "../src/lib/calculator.ts";
import { withCraftingItem } from "../src/lib/blueprint.ts";

test("a new plan has every requested default and real primitive recipe costs", () => {
  const input = hydrateInput({}, items);
  assert.equal(input.item?.name, "Bronto Platform Saddle");
  assert.equal(input.qualityId, "primitive");
  assert.equal(input.stationId, "replicator");
  assert.equal(input.clockEnabled, true);
  assert.equal(input.clockMode, "targeted");
  assert.equal(input.serverRate, "2");
  assert.equal(input.playerCount, 1);
  assert.equal(input.stationCount, 10);
  assert.deepEqual(input.buffIds, [
    "broth",
    "toilet",
    "egg",
    "note2",
    "note4",
    "tower",
    "drakeling",
  ]);
  assert.equal(input.tribeTowerBonus, "20");
  assert.deepEqual(input.players, [{ name: "Player 1", currentLevel: "1", targetLevel: "245" }]);
  assert.equal(input.craftSeconds, "0.3125");
  assert.deepEqual(
    input.resources.map(({ name, quantity }) => [name, quantity]),
    [
      ["Hide", "550"],
      ["Fiber", "325"],
      ["Metal Ingot or Scrap Metal Ingot", "90"],
      ["Silica Pearls or Silicate", "125"],
      ["Cementing Paste or Achatina Paste", "45"],
    ],
  );
  assert.deepEqual(input, defaultInput(items));
  assert.deepEqual(getInputIssues(input, levels), []);
  const result = calculate(input, levels)!;
  const xpPerCraft = 1848 * (2 * 1.5 * 1.33 * 1.1 * 2 * 4 * 1.2 * 1.1);
  assert.equal(result.ownXpPerCraft, xpPerCraft);
  assert.equal(result.xpRequired, 7975037952);
  assert.equal(result.craftsPerStation, Math.ceil(7975037952 / (xpPerCraft * 10)));
  assert.equal(result.totalCrafts, result.craftsPerStation * 10);
  assert.ok(result.projectedXp >= result.xpRequired);
  assert.ok((result.craftsPerStation - 1) * xpPerCraft * 10 < result.xpRequired);
  result.resources.forEach(({ perCraft, total }) => {
    assert.equal(total, perCraft * result.totalCrafts);
  });
});

test("missing and blank selections get defaults when a saved draft loads", () => {
  const restored = hydrateInput(
    {
      item: null,
      qualityId: "",
      serverRate: " ",
      tribeTowerBonus: "",
      clockMode: "",
      players: [{ name: "Player 1", currentLevel: "", targetLevel: "" }],
      resources: [],
    },
    items,
  );
  assert.deepEqual(restored, defaultInput(items));
});

test("existing choices, disabled boosts, and cleared blueprint fields survive loading", () => {
  const shotgun = items.find(({ name }) => name === "Shotgun")!;
  const stored = {
    ...withCraftingItem(defaultInput(items), shotgun),
    qualityId: "ascendant" as const,
    stationId: "smithy" as const,
    clockEnabled: false,
    clockMode: "area" as const,
    buffIds: [],
    serverRate: "3",
    tribeTowerBonus: "5",
    stationCount: 7,
    craftSeconds: "",
    players: [{ name: "Alice", currentLevel: "100", targetLevel: "200" }],
  };
  stored.resources[0].quantity = "777";
  stored.resources[1].quantity = "";
  assert.deepEqual(hydrateInput(stored, items), stored);
});

test("missing player levels and missing rows inherit from the preceding player", () => {
  const restored = hydrateInput(
    {
      playerCount: 4,
      players: [
        { name: "Alice", currentLevel: "100", targetLevel: "200" },
        { name: "Bob", currentLevel: "", targetLevel: "240" },
      ],
    },
    items,
  );
  assert.deepEqual(restored.players, [
    { name: "Alice", currentLevel: "100", targetLevel: "200" },
    { name: "Bob", currentLevel: "100", targetLevel: "240" },
    { name: "Player 3", currentLevel: "100", targetLevel: "240" },
    { name: "Player 4", currentLevel: "100", targetLevel: "240" },
  ]);
});

test("editing one plan does not mutate defaults used by another plan", () => {
  const input = defaultInput(items);
  input.buffIds.pop();
  input.players[0].targetLevel = "100";
  input.resources[0].quantity = "999";
  const next = defaultInput(items);
  assert.equal(next.buffIds.length, 7);
  assert.equal(next.players[0].targetLevel, "245");
  assert.equal(next.resources[0].quantity, "550");
});
