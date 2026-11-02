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
import { formatNumber } from "../src/lib/format.ts";
import type { CalculationResult, CalculatorInput } from "../src/types/calculator.ts";

type DetailProps = {
  input: CalculatorInput;
  issues: string[];
  result: CalculationResult | null;
  onSplitResourcesChange: (value: boolean) => void;
};

let server: ViteDevServer;
let App: ComponentType;
let Details: ComponentType<DetailProps>;

before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL("../", import.meta.url)),
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true, watch: null, hmr: false },
    appType: "custom",
  });
  App = (await server.ssrLoadModule("/src/App.tsx")).default;
  Details = (await server.ssrLoadModule("/src/components/CalculationDetails.tsx"))
    .CalculationDetails;
});

after(async () => {
  await server?.close();
});

const renderDetails = (input: CalculatorInput) =>
  renderToStaticMarkup(
    createElement(Details, {
      input,
      result: calculate(input, levels),
      issues: getInputIssues(input, levels),
      onSplitResourcesChange: () => undefined,
    }),
  );

test("consumables and player targets occur once, inside the bottom live results", () => {
  const html = renderToStaticMarkup(createElement(App));
  const sidebar = html.match(/<aside[\s\S]*?<\/aside>/)?.[0] || "";
  const bottom = html.slice(html.indexOf('aria-label="Live calculation details"'));
  assert.ok(sidebar.includes("Live calculation"));
  assert.ok(sidebar.includes("Estimated party time"));
  assert.ok(!sidebar.includes("XP consumables needed"));
  assert.ok(!sidebar.includes("Each player&#x27;s target"));
  for (const heading of [
    "XP consumables needed",
    "Each player&#x27;s target",
    "Resources needed",
  ]) {
    assert.equal(html.split(heading).length - 1, 1);
    assert.ok(bottom.includes(heading));
  }
});

test("bottom live results replace totals and contributions when current inputs change", () => {
  const input = resizeParty(defaultInput(), 2);
  input.splitResources = false;
  const before = renderDetails(input);
  const changed = {
    ...input,
    serverRate: "4",
    players: [input.players[0], { ...input.players[1], targetLevel: "200" }],
    resources: input.resources.map((resource) => ({ ...resource, quantity: "123" })),
  };
  const after = renderDetails(changed);
  assert.notEqual(after, before);
  assert.ok(after.includes("Level 1 → 200"));
  assert.ok(!after.includes("Timing unavailable"));
  calculate(changed, levels)!.resources.forEach(({ total }) => {
    assert.ok(after.includes(formatNumber(total)));
  });
  assert.ok(!after.includes('aria-label="Equal resource shares"'));
  assert.ok(
    renderDetails({ ...changed, splitResources: true }).includes(
      'aria-label="Equal resource shares"',
    ),
  );
});

test("cleared inputs retain the live section and show current errors without stale totals", () => {
  const input = { ...defaultInput(), serverRate: "" };
  const html = renderDetails(input);
  assert.ok(html.includes('aria-label="Live calculation details"'));
  assert.ok(html.includes("Enter a server XP rate above zero"));
  assert.ok(!html.includes('aria-label="Total blueprint resources"'));
  assert.ok(!html.includes('aria-label="XP consumables"'));
  assert.ok(
    renderDetails({ ...input, serverRate: "2" }).includes('aria-label="Total blueprint resources"'),
  );
});

test("unavailable timing clears consumable counts while resource totals remain available", () => {
  const html = renderDetails({ ...defaultInput(), craftSeconds: "" });
  assert.ok(html.includes('aria-label="Total blueprint resources"'));
  assert.ok(html.includes("Enter a craft time above zero in seconds."));
  assert.ok(!html.includes('class="consumable-table"'));
});
