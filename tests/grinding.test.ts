import assert from "node:assert/strict";
import test from "node:test";
import { calculate, getInputIssues } from "../src/lib/calculator.ts";
import type { CalculatorInput } from "../src/types/calculator.ts";

const levels = [{ level: 1, totalXp: 0 }, { level: 2, totalXp: 10000 }];
const input = (changes: Partial<CalculatorInput> = {}): CalculatorInput => ({
  item: { name: "Test recipe", experience: 100, resources: ["Metal Ingot"] },
  qualityId: "primitive",
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
});

test("grinding and Recycler lower starting resources and the first craft batch", () => {
  const normal = calculate(input(), levels)!;
  const grinding = calculate(input({ grinding: true }), levels)!;
  const recycler = calculate(input({ grinding: true, recycler: true }), levels)!;
  assert.deepEqual([normal, grinding, recycler].map((result) => result.resources[0].total), [10000, 7030, 6139]);
  assert.deepEqual([normal, grinding, recycler].map((result) => result.initialCraftsPerPlayer), [100, 70, 61]);
  assert.deepEqual([normal, grinding, recycler].map((result) => result.recycledCraftsPerPlayer), [0, 30, 39]);
  for (const result of [normal, grinding, recycler]) {
    assert.equal(result.totalCrafts, 100);
    assert.equal(result.projectedXp, 10000);
    assert.equal(result.ownXpPerCraft, 100);
  }
});

test("Recycler has no effect when grinding is off", () => {
  assert.deepEqual(calculate(input({ recycler: true }), levels), calculate(input(), levels));
});

test("each tribe crafter retains materials to fund their first craft", () => {
  const grinding = calculate(input({ grinding: true, playerCount: 2 }), levels)!;
  const recycler = calculate(input({ grinding: true, recycler: true, playerCount: 2 }), levels)!;
  assert.equal(grinding.craftsPerPlayer, 67);
  assert.equal(grinding.totalCrafts, 134);
  assert.equal(grinding.resources[0].total, 9440);
  assert.equal(recycler.resources[0].total, 8252);
  assert.equal(grinding.initialCraftsPerPlayer, 47);
  assert.equal(recycler.initialCraftsPerPlayer, 41);
  assert.ok(grinding.projectedXp >= grinding.xpRequired);
  assert.ok(recycler.projectedXp >= recycler.xpRequired);
});

test("one craft per player still needs the full recipe before any refunds exist", () => {
  for (const recycler of [false, true]) {
    const result = calculate(input({ grinding: true, recycler, playerCount: 70, serverRate: "100" }), levels)!;
    assert.equal(result.craftsPerPlayer, 1);
    assert.equal(result.initialCraftsPerPlayer, 1);
    assert.equal(result.recycledCraftsPerPlayer, 0);
    assert.equal(result.resources[0].total, 7000);
  }
});

test("rounds each ingredient refund per item and handles complete recovery of small quantities", () => {
  const recipe = input({
    grinding: true,
    resources: [
      { id: "one", name: "One", quantity: "1" },
      { id: "three", name: "Three", quantity: "3" },
      { id: "seven", name: "Seven", quantity: "7" },
    ],
  });
  const normal = calculate(recipe, levels)!;
  const recycler = calculate({ ...recipe, recycler: true }, levels)!;
  assert.deepEqual(normal.resources.map(({ total }) => total), [1, 403, 201]);
  assert.deepEqual(recycler.resources.map(({ total }) => total), [1, 403, 102]);
  assert.equal(normal.initialCraftsPerPlayer, 1);
  assert.equal(recycler.initialCraftsPerPlayer, 1);
});

test("rejects missing and fractional blueprint costs when grinding", () => {
  assert.equal(calculate(input({ grinding: true, resources: [] }), levels), null);
  const recipe = input({
    grinding: true,
    resources: [{ id: "metal", name: "Metal Ingot", quantity: "0.5" }],
  });
  assert.ok(getInputIssues(recipe, levels).includes("Enter a whole-number quantity for Metal Ingot when grinding"));
  assert.equal(calculate(recipe, levels), null);
});

test("initial inventories reach the XP target through repeated batch crafting and recycling", () => {
  for (const recycler of [false, true]) {
    for (const playerCount of [1, 2, 70]) {
      const result = calculate(input({
        grinding: true,
        recycler,
        playerCount,
        resources: [
          { id: "metal", name: "Metal", quantity: "100" },
          { id: "wood", name: "Wood", quantity: "7" },
        ],
      }), levels)!;
      const costs = [100, 7];
      const refunds = [recycler ? 39 : 30, 3];
      const inventory = result.resources.map(({ total }) => total / playerCount);
      let completed = 0;
      let batches = 0;
      while (completed < result.craftsPerPlayer) {
        const batch = Math.min(
          result.craftsPerPlayer - completed,
          ...inventory.map((quantity, index) => Math.floor(quantity / costs[index])),
        );
        assert.ok(batch > 0, "must be able to craft the next batch without gathering more resources");
        completed += batch;
        batches += 1;
        inventory.forEach((quantity, index) => {
          inventory[index] = quantity - batch * costs[index] + batch * refunds[index];
        });
      }
      assert.equal(completed, result.craftsPerPlayer);
      assert.ok(batches > 1);
      assert.ok(completed * result.xpPerPlayerPerRound >= result.xpRequired);
    }
  }
});
