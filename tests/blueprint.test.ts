import { testPlayers } from "./fixtures.ts";
import assert from "node:assert/strict";
import test from "node:test";
import items from "../src/data/items.json" with { type: "json" };
import { calculate } from "../src/lib/calculator.ts";
import { calculateTiming } from "../src/lib/crafting.ts";
import { defaultCraftSeconds, withCraftingItem, withQuality, withStation } from "../src/lib/blueprint.ts";
import { parseItemLinks, parseWikiRecipe } from "../scripts/crafting-data.mjs";
import type { CalculatorInput } from "../src/types/calculator.ts";

const input = (): CalculatorInput => ({
  item: null, qualityId: "", stationId: "smithy", craftSeconds: "", craftTimeBasis: "station", clockEnabled: false, clockMode: "",
  serverRate: "1", playerCount: 3, stationCount: 3, players: testPlayers(3), buffIds: [],
  tribeTowerBonus: "", grinding: false, recycler: false, splitResources: false, resources: [],
});
const shotgun = items.find(({ name }) => name === "Shotgun")!;
const rex = items.find(({ name }) => name === "Rex Saddle")!;
const ready = () => withQuality(withCraftingItem(input(), shotgun), "primitive");
const levels = [{ level: 1, totalXp: 0 }, { level: 2, totalXp: 10000 }];

test("selecting Primitive fills researched costs and a different quality leaves empty costs alone", () => {
  const selected = withCraftingItem(input(), shotgun);
  assert.equal(selected.stationId, "smithy");
  assert.equal(selected.craftSeconds, "15");
  assert.deepEqual(withQuality(selected, "ascendant").resources.map(({ quantity }) => quantity), ["", "", ""]);
  assert.deepEqual(withQuality(selected, "primitive").resources.map(({ name, quantity }) => [name, quantity]), [
    ["Metal Ingot or Scrap Metal Ingot", "80"], ["Wood or Fungal Wood", "20"], ["Hide", "25"],
  ]);
});

test("Primitive fills only empty fields and preserves user changes", () => {
  const selected = ready();
  selected.resources[0].quantity = "777";
  selected.resources[1].quantity = "";
  selected.resources[2].quantity = "0";
  const result = withQuality(withQuality(selected, "ascendant"), "primitive");
  assert.deepEqual(result.resources.map(({ quantity }) => quantity), ["777", "20", "0"]);
  assert.equal(withCraftingItem(result, shotgun), result);
});

test("choosing an item after Primitive fills its costs and resets the item-specific time", () => {
  const result = withCraftingItem(withQuality(input(), "primitive"), rex);
  assert.equal(result.craftSeconds, "10");
  assert.deepEqual(result.resources.map(({ quantity }) => quantity), ["380", "200", "50"]);
  const changed = withCraftingItem(withStation(result, "replicator"), shotgun);
  assert.equal(changed.craftSeconds, "1.25");
  assert.deepEqual(changed.resources.map(({ quantity }) => quantity), ["80", "20", "25"]);
});

test("station changes populate fractional seconds and convert user overrides once", () => {
  const result = withStation(ready(), "replicator");
  assert.equal(result.craftSeconds, "1.25");
  assert.equal(calculateTiming(result, 8)?.partySeconds, 10);
  const edited = { ...result, craftSeconds: "0.125" };
  assert.equal(calculateTiming(edited, 8)?.partySeconds, 1);
  assert.equal(withStation(edited, "smithy").craftSeconds, "1.5");
  assert.equal(defaultCraftSeconds(rex, "replicator"), String(10 / 12));
});

test("fractional craft times do not add an extra consumable at exact expiry", () => {
  const result = withStation({ ...ready(), craftSeconds: "1", buffIds: ["egg", "broth", "cake"] }, "replicator");
  assert.equal(result.craftSeconds, String(1 / 12));
  assert.equal(calculateTiming(result, 7200)?.partySeconds, 600);
  assert.deepEqual(calculateTiming(result, 7200)?.consumables.map(({ perPlayer }) => perPlayer), [1, 1, 1]);
  assert.deepEqual(calculateTiming(result, 14400)?.consumables.map(({ perPlayer }) => perPlayer), [1, 2, 2]);
  assert.deepEqual(calculateTiming(result, 7201)?.consumables.map(({ perPlayer }) => perPlayer), [1, 2, 2]);
});

test("party resource shares cover every craft without changing XP, timing, or supplies", () => {
  for (const playerCount of [1, 3, 70]) {
    for (const grinding of [false, true]) {
      const plan = { ...ready(), playerCount, players: testPlayers(playerCount), stationCount: playerCount, grinding, recycler: grinding, buffIds: ["egg" as const] };
      const result = calculate(plan, levels)!;
      const split = calculate({ ...plan, splitResources: true }, levels)!;
      assert.deepEqual(result, split);
      result.resources.forEach(({ perPlayer, total }) => {
        assert.equal(perPlayer, Math.ceil(total / playerCount));
        assert.ok(perPlayer * playerCount >= total);
      });
    }
  }
});

test("whole-unit shares round up fractional entered resource costs", () => {
  const plan = ready();
  plan.resources[0].quantity = "0.13";
  const result = calculate(plan, levels)!;
  const metal = result.resources.find(({ name }) => name.startsWith("Metal Ingot"))!;
  assert.equal(metal.perPlayer, Math.ceil(metal.total / 3));
});

test("wiki recipes extract exact quantities and ASA-specific costs", () => {
  const result = parseWikiRecipe(`{{Infobox weapon
| name = Shotgun
| blueprintpath = "Blueprint'/Game/PrimalEarth/CoreBlueprints/Weapons/PrimalItem_WeaponShotgun.PrimalItem_WeaponShotgun'"
| craftingtime = 15
| craftedin = Smithy
| quantity1 = 80
| ingredient1 = Metal Ingot or Scrap Metal Ingot
| quantity2 = 20
| ingredient2 = [[Wood or Fungal Wood]]
}}`);
  assert.equal(result.baseSeconds, 15);
  assert.equal(result.assetClass, "PrimalItem_WeaponShotgun");
  assert.deepEqual(result.ingredients, [
    { name: "Metal Ingot or Scrap Metal Ingot", quantity: 80 }, { name: "Wood or Fungal Wood", quantity: 20 },
  ]);
  const asa = parseWikiRecipe(`{{Infobox item
| ingredient1 = Wood
| quantity1 = 20
| ingredient1_ASA = Wood
| quantity1_ASA = 30
}}`);
  assert.deepEqual(asa.ingredients, [{ name: "Wood", quantity: 30 }]);
});

test("group wiki pages select the requested item's infobox", () => {
  const content = `{{Infobox structure
| name = Adobe Ceiling
| quantity1 = 10
| ingredient1 = Clay
}}
{{Infobox structure
| name = Adobe Wall
| quantity1 = 15
| ingredient1 = Clay
}}`;
  assert.deepEqual(parseWikiRecipe(content, "Adobe Ceiling").ingredients, [{ name: "Clay", quantity: 10 }]);
  assert.deepEqual(parseWikiRecipe(content, "Adobe Wall").ingredients, [{ name: "Clay", quantity: 15 }]);
  assert.deepEqual(parseWikiRecipe(content, "Adobe Door").ingredients, []);
});

test("ASA source links preserve the site's punctuation-dependent URLs", () => {
  const links = parseItemLinks('<a href="/ark-survival-ascended/items/primitive-m-d-s-m-/"><img alt="Primitive M.D.S.M." /></a>');
  assert.equal(links.get("mdsm"), "https://ark-unity.com/ark-survival-ascended/items/primitive-m-d-s-m-/");
});
