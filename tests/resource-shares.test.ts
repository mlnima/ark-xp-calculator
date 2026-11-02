import assert from "node:assert/strict";
import test from "node:test";
import { calculate } from "../src/lib/calculator.ts";
import { emptyInput, hydrateInput } from "../src/lib/input-state.ts";
import { resizeParty } from "../src/lib/players.ts";
import { allocateResourceShares, wholeResourceTotal } from "../src/lib/resource-shares.ts";

const levels = [
  { level: 1, totalXp: 0 },
  { level: 2, totalXp: 1000 },
  { level: 3, totalXp: 10000 },
  { level: 4, totalXp: 15000 },
];

const input = () => ({
  ...emptyInput(),
  item: { name: "Rex Saddle", experience: 100, resources: ["Metal", "Wood"] },
  qualityId: "primitive" as const,
  serverRate: "1",
  playerCount: 3,
  stationCount: 2,
  players: [
    { name: "Alice", currentLevel: "1", targetLevel: "2" },
    { name: "Bob", currentLevel: "2", targetLevel: "3" },
    { name: "Charlie", currentLevel: "1", targetLevel: "4" },
  ],
  resources: [
    { id: "metal", name: "Metal", quantity: "100" },
    { id: "wood", name: "Wood", quantity: "7" },
  ],
});

test("individual contributions follow XP gaps rather than level counts or stations", () => {
  const result = calculate(input(), levels)!;
  const xpRequired = result.players.map((player) => player.xpRequired);
  assert.deepEqual(xpRequired, [1000, 9000, 15000]);
  assert.equal(result.players[2].stations, 0);
  assert.deepEqual(
    result.resources.map(({ total }) => total),
    [30000, 2100],
  );
  assert.deepEqual(
    result.resources.map(({ total }) => allocateResourceShares(total, xpRequired)),
    [
      [1200, 10800, 18000],
      [84, 756, 1260],
    ],
  );
});

test("whole-unit rounding preserves the total and awards the largest remainders first", () => {
  assert.deepEqual(allocateResourceShares(11, [1, 2, 3]), [2, 4, 5]);
  assert.deepEqual(allocateResourceShares(2, [1, 1, 1]), [1, 1, 0]);
  assert.deepEqual(allocateResourceShares(1, [1, 1, 1]), [1, 0, 0]);
  assert.deepEqual(allocateResourceShares(101, [1]), [101]);
  assert.deepEqual(allocateResourceShares(0, [1, 2]), [0, 0]);
  assert.deepEqual(allocateResourceShares(550, [450, 1450, 4350]), [40, 127, 383]);
});

test("players needing no additional XP receive zero shares, including a zero-XP party", () => {
  assert.deepEqual(allocateResourceShares(10, [0, 1, 3]), [0, 3, 7]);
  const plan = input();
  plan.players = plan.players.map((player) => ({
    ...player,
    currentLevel: "4",
    targetLevel: "5",
  }));
  const sameXpLevels = [...levels, { level: 5, totalXp: 15000 }];
  for (const grinding of [false, true]) {
    const result = calculate({ ...plan, grinding }, sameXpLevels)!;
    assert.equal(result.totalCrafts, 0);
    result.resources.forEach(({ total, perPlayer }) => {
      assert.equal(total, 0);
      assert.equal(perPlayer, 0);
      assert.deepEqual(allocateResourceShares(total, [0, 0, 0]), [0, 0, 0]);
    });
  }
});

test("fractional totals round up once without adding a unit for floating point noise", () => {
  assert.equal(wholeResourceTotal(0.07 * 100), 7);
  assert.equal(wholeResourceTotal(7.01), 8);
  assert.deepEqual(allocateResourceShares(7.01, [1, 3]), [2, 6]);
  assert.deepEqual(allocateResourceShares(0.5, [1, 3]), [0, 1]);
  const plan = resizeParty(input(), 1);
  plan.stationCount = 1;
  plan.resources = [{ id: "metal", name: "Metal", quantity: "0.07" }];
  plan.players[0].targetLevel = "3";
  const result = calculate(plan, levels)!;
  assert.equal(result.totalCrafts, 100);
  assert.equal(result.resources[0].perPlayer, 7);
});

test("grinding shares fund starting supplies with and without Recycler", () => {
  const expected = [
    [
      [842, 7582, 12636],
      [48, 434, 724],
    ],
    [
      [735, 6616, 11027],
      [48, 434, 724],
    ],
  ];
  [false, true].forEach((recycler, index) => {
    const result = calculate({ ...input(), grinding: true, recycler }, levels)!;
    const xpRequired = result.players.map((player) => player.xpRequired);
    assert.equal(result.totalCrafts, 300);
    assert.deepEqual(
      result.resources.map(({ total }) => allocateResourceShares(total, xpRequired)),
      expected[index],
    );
  });
});

test("level and active-party changes recalculate shares using only participating players", () => {
  const plan = input();
  plan.players[1].currentLevel = "1";
  let result = calculate(plan, levels)!;
  let xpRequired = result.players.map((player) => player.xpRequired);
  assert.deepEqual(
    allocateResourceShares(result.resources[0].total, xpRequired),
    [1154, 11538, 17308],
  );
  result = calculate(resizeParty(plan, 1), levels)!;
  xpRequired = result.players.map((player) => player.xpRequired);
  assert.equal(xpRequired.length, 1);
  assert.deepEqual(allocateResourceShares(result.resources[0].total, xpRequired), [1000]);
});

test("allocations cover the exact total within one unit of each player's XP proportion", () => {
  const parties = [
    [1],
    [1, 1, 1],
    [1000, 9000, 15000],
    Array.from({ length: 70 }, (_, index) => (index + 1) ** 3),
    Array.from({ length: 70 }, () => 7975037952),
  ];
  for (const xpRequired of parties) {
    const totalXp = xpRequired.reduce((sum, xp) => sum + xp, 0);
    for (const total of [0, 1, 2, 7, 11, 69, 70, 71, 100.5, 21060, 700000000000]) {
      const shares = allocateResourceShares(total, xpRequired);
      const units = wholeResourceTotal(total);
      assert.equal(
        shares.reduce((sum, quantity) => sum + quantity, 0),
        units,
      );
      shares.forEach((quantity, index) => {
        assert.ok(Number.isSafeInteger(quantity) && quantity >= 0);
        assert.ok(Math.abs(quantity - units * (xpRequired[index] / totalXp)) < 1);
      });
    }
  }
});

test("allocation mode leaves XP, crafts, timing, and resource totals unchanged", () => {
  const plan = input();
  assert.deepEqual(
    calculate({ ...plan, splitResources: false }, levels),
    calculate({ ...plan, splitResources: true }, levels),
  );
});

test("equal allocation is the default and stored allocation choices survive restoration", () => {
  assert.equal(emptyInput().splitResources, true);
  assert.equal(hydrateInput({}, []).splitResources, true);
  assert.equal(hydrateInput({ splitResources: true }, []).splitResources, true);
  assert.equal(hydrateInput({ splitResources: false }, []).splitResources, false);
});
