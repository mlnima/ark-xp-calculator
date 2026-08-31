import assert from "node:assert/strict";
import test from "node:test";
import { calculate, getInputIssues } from "../src/lib/calculator.ts";
import type { CalculatorInput, CraftingItem, LevelEntry } from "../src/types/calculator.ts";

const shotgun: CraftingItem = {
  name: "Shotgun",
  experience: 423.2,
  resources: ["Metal Ingot", "Hide", "Wood"],
};

const levels: LevelEntry[] = [
  { level: 1, totalXp: 0 },
  { level: 10, totalXp: 450 },
  { level: 20, totalXp: 1900 },
];

const input = (changes: Partial<CalculatorInput> = {}): CalculatorInput => ({
  item: shotgun,
  qualityId: "ramshackle",
  serverRate: "1",
  currentLevel: "1",
  targetLevel: "20",
  playerCount: 1,
  buffIds: [],
  tribeTowerBonus: "",
  resources: [
    { id: "metal", name: "Metal Ingot", quantity: "160" },
    { id: "hide", name: "Hide", quantity: "50" },
    { id: "wood", name: "Wood", quantity: "40" },
  ],
  ...changes,
});

test("calculates the supplied ramshackle shotgun blueprint for solo crafting", () => {
  const result = calculate(input(), levels);
  assert.ok(result);
  assert.equal(result.ownXpPerCraft, 846.4);
  assert.equal(result.craftsPerPlayer, 3);
  assert.equal(result.totalCrafts, 3);
  assert.deepEqual(result.resources.map(({ name, total }) => [name, total]), [
    ["Hide", 150],
    ["Metal Ingot", 480],
    ["Wood", 120],
  ]);
});

test("adds 50 percent shared XP from every other simultaneous crafter", () => {
  const result = calculate(input({ playerCount: 2 }), levels);
  assert.ok(result);
  assert.equal(result.sharedXpPerRound, 423.2);
  assert.equal(result.xpPerPlayerPerRound, 1269.6);
  assert.equal(result.craftsPerPlayer, 2);
  assert.equal(result.totalCrafts, 4);
  assert.equal(result.resources.find(({ name }) => name === "Metal Ingot")?.total, 640);
});

test("supports the full 70-player range", () => {
  const result = calculate(input({ playerCount: 70 }), levels);
  assert.ok(result);
  assert.equal(result.sharedXpPerRound, result.ownXpPerCraft * 34.5);
  assert.equal(result.totalCrafts, result.craftsPerPlayer * 70);
});

test("multiplies quality, rate, and compatible active buffs", () => {
  const result = calculate(input({
    qualityId: "ascendant",
    serverRate: "2",
    buffIds: ["broth", "toilet", "egg", "note2", "note4"],
  }), levels);
  assert.ok(result);
  assert.equal(result.combinedMultiplier, 6 * 2 * 1.5 * 1.33 * 1.1 * 2 * 4);
});

test("applies the entered Tribe Tower bonus and Drakeling Native Biome boost", () => {
  const result = calculate(input({
    buffIds: ["tower", "drakeling"],
    tribeTowerBonus: "17",
  }), levels);
  assert.ok(result);
  assert.equal(result.combinedMultiplier, 2 * 1.17 * 1.1);
});

test("combines duplicate blueprint resource names", () => {
  const result = calculate(input({
    resources: [
      { id: "one", name: "Wood", quantity: "30" },
      { id: "two", name: "wood", quantity: "10" },
    ],
  }), levels);
  assert.ok(result);
  assert.equal(result.resources[0].perCraft, 40);
  assert.equal(result.resources[0].total, 120);
});

test("rejects incomplete levels and blueprint quantities", () => {
  const issues = getInputIssues(input({
    targetLevel: "1",
    resources: [{ id: "metal", name: "Metal Ingot", quantity: "" }],
  }), levels);
  assert.ok(issues.includes("Target level must be higher than current level"));
  assert.ok(issues.includes("Enter a valid quantity for Metal Ingot"));
  assert.equal(calculate(input({ targetLevel: "1" }), levels), null);
});
