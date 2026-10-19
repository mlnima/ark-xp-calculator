import { readFile, writeFile } from "node:fs/promises";

const dataDirectory = new URL("../src/data/", import.meta.url);
const items = JSON.parse(await readFile(new URL("items.json", dataDirectory), "utf8"));
const recipes = {};
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const fetchBatch = async (batch) => {
  const params = new URLSearchParams({
    action: "query", prop: "revisions", rvprop: "content", rvslots: "main",
    formatversion: "2", format: "json", redirects: "1",
    titles: batch.map(({ name }) => name).join("|"),
  });
  const response = await fetch(`https://ark.wiki.gg/api.php?${params}`, {
    headers: { "User-Agent": "ARKCraftingXP/0.1 data-sync" },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Crafting data request failed: ${response.status}`);
  const { query } = await response.json();
  if (!query?.pages) throw new Error("Crafting data response was incomplete");
  const aliases = new Map(batch.map(({ name }) => [name, [name]]));
  [...(query.normalized || []), ...(query.redirects || [])].forEach(({ from, to }) => {
    aliases.set(to, [...(aliases.get(to) || []), ...(aliases.get(from) || [])]);
  });
  query.pages.forEach((page) => {
    const content = page.revisions?.[0]?.slots?.main?.content || "";
    const seconds = Number(content.match(/\|\s*craftingtime\s*=\s*([\d.]+)/i)?.[1]);
    const stations = [...content.matchAll(/\|\s*craftedin\d*\s*=\s*([^|\n}]+)/gi)]
      .map((match) => match[1].replace(/\[\[|\]\]/g, "").trim()).filter(Boolean);
    (aliases.get(page.title) || []).forEach((name) => {
      recipes[name] = {
        baseSeconds: seconds > 0 && Number.isFinite(seconds) ? seconds : null,
        stations: [...new Set(stations)],
      };
    });
  });
};

for (let offset = 0; offset < items.length; offset += 50) {
  await fetchBatch(items.slice(offset, offset + 50));
  await pause(300);
}
if (Object.keys(recipes).length !== items.length) throw new Error("Crafting snapshot was incomplete");
await writeFile(new URL("crafting.json", dataDirectory), `${JSON.stringify({
  checkedAt: new Date().toISOString().slice(0, 10),
  sourceUrl: "https://ark.wiki.gg/",
  recipes,
}, null, 2)}\n`, "utf8");
process.stdout.write(`Synced crafting times and stations for ${items.length} items.\n`);
