import { readFile, writeFile } from "node:fs/promises";
import { fetchSource, normalizeName, parseItemLinks, parsePageContext, parseWikiRecipe } from "./crafting-data.mjs";

const dataDirectory = new URL("../src/data/", import.meta.url);
const items = JSON.parse(await readFile(new URL("items.json", dataDirectory), "utf8"));
const recipes = {};
const itemClasses = new Map();
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const fetchBatch = async (batch) => {
  const params = new URLSearchParams({
    action: "query", prop: "revisions", rvprop: "content", rvslots: "main",
    formatversion: "2", format: "json", redirects: "1",
    titles: batch.map(({ name }) => name).join("|"),
  });
  const response = await fetchSource(`https://ark.wiki.gg/api.php?${params}`);
  const { query } = await response.json();
  if (!query?.pages) throw new Error("Crafting data response was incomplete");
  const aliases = new Map(batch.map(({ name }) => [name, [name]]));
  [...(query.normalized || []), ...(query.redirects || [])].forEach(({ from, to }) => {
    aliases.set(to, [...(aliases.get(to) || []), ...(aliases.get(from) || [])]);
  });
  query.pages.forEach((page) => {
    const content = page.revisions?.[0]?.slots?.main?.content || "";
    (aliases.get(page.title) || []).forEach((name) => {
      const { assetClass, ...recipe } = parseWikiRecipe(content, name);
      itemClasses.set(name, assetClass);
      recipes[name] = {
        ...recipe,
        sourceUrl: `https://ark.wiki.gg/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
      };
    });
  });
};

for (let offset = 0; offset < items.length; offset += 50) {
  await fetchBatch(items.slice(offset, offset + 50));
  process.stdout.write(`Checked wiki recipes: ${Math.min(offset + 50, items.length)}/${items.length}\n`);
  await pause(300);
}
if (Object.keys(recipes).length !== items.length) throw new Error("Crafting snapshot was incomplete");

const unityBaseUrl = "https://ark-unity.com/ark-survival-ascended/items/";
const fetchContext = async (url) => {
  const response = await fetchSource(url);
  const html = await response.text();
  const context = parsePageContext(html);
  if (!context?.pageProps) throw new Error(`ASA crafting data was incomplete: ${url}`);
  return { ...context.pageProps, itemLinks: parseItemLinks(html) };
};
const { itemsList, itemLinks } = await fetchContext(unityBaseUrl);
const matches = items.flatMap((item) => {
  const assetClass = itemClasses.get(item.name);
  const byClass = assetClass ? itemsList.filter(({ fullname }) => fullname?.split(" ")[0].replace(/_C$/, "") === assetClass) : [];
  const candidates = byClass.length ? byClass : itemsList.filter(({ name }) => normalizeName(name) === normalizeName(item.name));
  const source = candidates.length === 1 ? candidates[0] : null;
  const sourceUrl = source && itemLinks.get(normalizeName(source.name));
  return sourceUrl ? [{ item, source, sourceUrl }] : [];
});
for (let offset = 0; offset < matches.length; offset += 4) {
  await Promise.all(matches.slice(offset, offset + 4).map(async ({ item, source, sourceUrl }) => {
    const { item: data } = await fetchContext(sourceUrl);
    if (data?.fullname !== source.fullname) throw new Error(`ASA item mismatch: ${item.name}`);
    const seconds = data?.craft?.time_to_craft;
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    recipes[item.name] = { ...recipes[item.name], baseSeconds: seconds, timeSourceUrl: sourceUrl };
  }));
  process.stdout.write(`Checked ASA crafting times: ${Math.min(offset + 4, matches.length)}/${matches.length}\r`);
}
await writeFile(new URL("crafting.json", dataDirectory), `${JSON.stringify({
  checkedAt: new Date().toISOString().slice(0, 10),
  sourceUrl: "https://ark.wiki.gg/",
  timeSourceUrl: unityBaseUrl,
  recipes,
}, null, 2)}\n`, "utf8");
process.stdout.write(`Synced crafting times and stations for ${items.length} items.\n`);
