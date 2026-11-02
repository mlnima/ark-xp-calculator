import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import levels from "../src/data/levels.json" with { type: "json" };
import { calculate, getInputIssues } from "../src/lib/calculator.ts";
import { defaultInput } from "../src/lib/input-state.ts";
import { resizeParty } from "../src/lib/players.ts";
import { formatDuration, formatNumber } from "../src/lib/format.ts";
import type { CalculationResult, CalculatorInput } from "../src/types/calculator.ts";

type ResultProps = {
  input: CalculatorInput;
  issues: string[];
  result: CalculationResult | null;
  onSplitResourcesChange: (value: boolean) => void;
};

let server: ViteDevServer;
let App: ComponentType;
let Panel: ComponentType<ResultProps>;

before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL("../", import.meta.url)),
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true, watch: null, hmr: false },
    appType: "custom",
  });
  App = (await server.ssrLoadModule("/src/App.tsx")).default;
  Panel = (await server.ssrLoadModule("/src/components/ResultsPanel.tsx")).ResultsPanel;
});

after(async () => {
  await server?.close();
});

const renderResults = (input: CalculatorInput) =>
  renderToStaticMarkup(
    createElement(Panel, {
      input,
      result: calculate(input, levels),
      issues: getInputIssues(input, levels),
      onSplitResourcesChange: () => undefined,
    }),
  );

const playerCard = (html: string, index: number) =>
  html.match(
    new RegExp(`<article[^>]*aria-label="Plan for Player ${index + 1}"[\\s\\S]*?</article>`),
  )?.[0] || "";

test("one bottom calculation preserves summaries, timing, supplies, and player targets", () => {
  const html = renderToStaticMarkup(createElement(App));
  const start = html.indexOf('aria-label="Live calculation"');
  assert.ok(start > html.indexOf('aria-label="Player levels"'));
  assert.equal(html.split("<h2>Live calculation</h2>").length - 1, 1);
  assert.ok(!html.includes("<aside"));
  assert.ok(!html.includes("Live calculation details"));
  assert.equal(html.split('class="player-plan-grid"').length - 1, 1);
  for (const feature of [
    "Crafting plan summary",
    "Estimated party time",
    "Station time comparison",
    "Own XP / craft",
    "Last player XP needed",
    "Crafter XP / round",
    "Last player XP / round",
    "Total blueprint resources",
    "Split resources across party",
    "Party XP consumables",
    "XP needed",
    "Rounds to target",
    "Time to target",
  ]) {
    assert.ok(html.slice(start).includes(feature), `Missing feature: ${feature}`);
  }
  const card = playerCard(html, 0);
  assert.ok(card.includes("Resources to bring"));
  assert.ok(card.includes("XP consumables needed"));
  assert.ok(card.includes("Broth of Enlightenment"));
});

test("both split modes show resources and consumables in the same player cards", () => {
  const plan = resizeParty(defaultInput(), 2);
  plan.players[1] = { ...plan.players[1], currentLevel: "100", targetLevel: "200" };
  for (const splitResources of [true, false]) {
    const input = { ...plan, splitResources };
    const html = renderResults(input);
    assert.equal(html.split('class="player-plan-grid"').length - 1, 1);
    const result = calculate(input, levels)!;
    for (const player of result.players) {
      const card = playerCard(html, player.index);
      assert.ok(card.includes("XP needed"));
      assert.ok(card.includes("Resources to bring"));
      assert.ok(card.includes("XP consumables needed"));
      result.timing!.consumables.forEach(({ label, perPlayer }) => {
        assert.ok(card.includes(label));
        assert.ok(card.includes(formatNumber(perPlayer)));
      });
      if (splitResources) {
        result.resources.forEach(({ perPlayer }) => {
          assert.ok(card.includes(formatNumber(perPlayer)));
        });
      }
    }
  }
});

test("current and target edits refresh a non-limiting player's card in either split mode", () => {
  for (const splitResources of [true, false]) {
    const input = { ...resizeParty(defaultInput(), 2), splitResources };
    const beforeHtml = renderResults(input);
    const edited = {
      ...input,
      players: [
        input.players[0],
        {
          ...input.players[1],
          currentLevel: "100",
          targetLevel: "200",
        },
      ],
    };
    const result = calculate(edited, levels)!;
    const afterHtml = renderResults(edited);
    assert.equal(result.totalCrafts, calculate(input, levels)!.totalCrafts);
    const card = playerCard(afterHtml, 1);
    assert.notEqual(card, playerCard(beforeHtml, 1));
    assert.ok(card.includes("Level 100 → 200"));
    assert.ok(card.includes(formatNumber(result.players[1].xpRequired)));
    assert.ok(card.includes(formatNumber(result.players[1].roundsToTarget)));
    assert.ok(card.includes(formatDuration(result.players[1].secondsToTarget!)));
  }
});

test("editing the limiting player's levels changes the party totals and finish player", () => {
  const input = resizeParty(defaultInput(), 2);
  input.players[1] = { ...input.players[1], currentLevel: "100", targetLevel: "200" };
  const original = calculate(input, levels)!;
  const edited = {
    ...input,
    players: [{ ...input.players[0], currentLevel: "180", targetLevel: "200" }, input.players[1]],
  };
  const updated = calculate(edited, levels)!;
  assert.equal(original.limitingPlayerIndex, 0);
  assert.equal(updated.limitingPlayerIndex, 1);
  assert.ok(updated.totalCrafts < original.totalCrafts);
  const html = renderResults(edited);
  assert.ok(playerCard(html, 0).includes("Level 180 → 200"));
  updated.resources.forEach(({ total }) => assert.ok(html.includes(formatNumber(total))));
});

test("cleared inputs keep the sole live section and recover without stale results", () => {
  const input = { ...defaultInput(), serverRate: "" };
  const html = renderResults(input);
  assert.ok(html.includes('aria-label="Live calculation"'));
  assert.ok(html.includes("Enter a server XP rate above zero"));
  assert.ok(!html.includes('aria-label="Total blueprint resources"'));
  assert.ok(!html.includes('class="player-plan-grid"'));
  assert.ok(
    renderResults({ ...input, serverRate: "2" }).includes('aria-label="Total blueprint resources"'),
  );
});

test("missing timing clears supply counts in both the party summary and player cards", () => {
  const html = renderResults({ ...defaultInput(), craftSeconds: "" });
  assert.ok(html.includes('aria-label="Total blueprint resources"'));
  assert.ok(html.includes("Enter a craft time above zero in seconds."));
  assert.ok(!html.includes('class="consumable-table"'));
  assert.ok(playerCard(html, 0).includes("Timing unavailable."));
});
