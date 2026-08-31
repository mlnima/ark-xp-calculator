import { mkdir, writeFile } from "node:fs/promises";

const apiUrl = "https://ark.wiki.gg/api.php";
const wikiUrl = "https://ark.wiki.gg";
const outputDirectory = new URL("../src/data/", import.meta.url);
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const decodeEntities = (value) =>
  value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;|&#160;/g, " ");

const stripMarkup = (value) => decodeEntities(value.replace(/<[^>]+>/g, "").trim());

const fetchPageHtml = async (page) => {
  const params = new URLSearchParams({
    action: "parse",
    page,
    prop: "text",
    format: "json",
    origin: "*",
  });
  const payload = await fetchWikiJson(`${apiUrl}?${params}`);
  return payload.parse.text["*"];
};

const fetchRights = async () => {
  const params = new URLSearchParams({
    action: "query",
    meta: "siteinfo",
    siprop: "rightsinfo",
    format: "json",
    origin: "*",
  });
  return (await fetchWikiJson(`${apiUrl}?${params}`)).query.rightsinfo;
};

const parseItems = (html) => {
  const heading = html.indexOf("Experience for Item Crafting");
  const start = html.indexOf('<table class="wikitable sortable"', heading);
  const end = html.indexOf("</table>", start);
  const table = html.slice(start, end);
  const rowPattern = /<tr>\s*<td>.*?<img[^>]+src="[^"]+".*?<\/span><a[^>]+title="(?<name>[^"]+)"[^>]*>.*?<\/a>\s*<\/td><td[^>]*>\s*(?<xp>[\d.,]+)\s*<\/td>\s*<\/tr>/gs;
  return [...table.matchAll(rowPattern)].map(({ groups }) => ({
    name: decodeEntities(groups.name),
    experience: Number(groups.xp.replaceAll(",", "")),
  }));
};

const parseIngredients = (wikitext) =>
  [...wikitext.matchAll(/^\|[ \t]*ingredient\d+[ \t]*=[ \t]*(.*?)[ \t]*$/gim)]
    .map((match) => decodeEntities(match[1]
      .replace(/<!--.*?-->/g, "")
      .replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, "$1")
      .replace(/\}\}+$/g, "")
      .replace(/''+/g, "")
      .trim()))
    .filter(Boolean);

const resourceOverrides = {
  "Kibble (Oviraptor Egg)": ["Oviraptor Egg", "Longrass", "Prime Meat Jerky", "Mejoberry", "Fiber", "Water"],
  "Kibble (Pelagornis Egg)": ["Pelagornis Egg", "Citronal", "Chitin", "Mejoberry", "Fiber", "Water"],
  "Kibble (Tapejara Egg)": ["Tapejara Egg", "Rockarrot", "Cooked Prime Meat", "Mejoberry", "Fiber", "Water"],
};

const moveTitles = (titles, mappings = []) => mappings.forEach(({ from, to }) => {
  const originals = titles.get(from) || [];
  titles.set(to, [...(titles.get(to) || []), ...originals]);
});

const fetchWikiJson = async (url, attempt = 0) => {
  const response = await fetch(url, { headers: { "User-Agent": "ARKCraftingXP/0.1 data-sync" } });
  if (response.status === 429 && attempt < 5) {
    const seconds = Number(response.headers.get("retry-after")) || 2 ** attempt;
    await wait(seconds * 1000);
    return fetchWikiJson(url, attempt + 1);
  }
  if (!response.ok) throw new Error(`Wiki request failed: ${response.status}`);
  return response.json();
};

const fetchItemResources = async (items) => {
  const resources = new Map();
  for (let offset = 0; offset < items.length; offset += 50) {
    const batch = items.slice(offset, offset + 50);
    const params = new URLSearchParams({
      action: "query",
      prop: "revisions",
      rvprop: "content",
      rvslots: "main",
      formatversion: "2",
      redirects: "1",
      titles: batch.map(({ name }) => name).join("|"),
      format: "json",
      origin: "*",
    });
    const query = (await fetchWikiJson(`${apiUrl}?${params}`)).query;
    const titles = new Map(batch.map(({ name }) => [name, [name]]));
    moveTitles(titles, query.normalized);
    moveTitles(titles, query.redirects);
    query.pages.forEach((page) => {
      const ingredients = parseIngredients(page.revisions?.[0]?.slots?.main?.content || "");
      (titles.get(page.title) || []).forEach((name) => resources.set(name, ingredients));
    });
    await wait(250);
  }
  return items.map((item) => ({
    ...item,
    resources: resources.get(item.name)?.length
      ? resources.get(item.name)
      : resourceOverrides[item.name] || [],
  }));
};

const parseLevels = (html) => {
  const header = html.indexOf('<th rowspan="2">Level');
  const start = html.lastIndexOf("<table", header);
  const end = html.indexOf("</table>", header);
  const table = html.slice(start, end);
  return [...table.matchAll(/<tr>(.*?)<\/tr>/gs)]
    .map((row) => [...row[1].matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map((cell) => stripMarkup(cell[1])))
    .filter((cells) => cells.length === 9 && /^\d+$/.test(cells[0]))
    .map((cells) => ({
      level: Number(cells[0]),
      totalXp: Number(cells[2].replaceAll(",", "")),
    }));
};

const parseMaximumLevel = (html) => Number(html.match(/maximum player level is\s*(\d+)/i)?.[1] || 230);

const extendLevels = (levels, maximumLevel) => {
  const increment = levels.at(-1).totalXp - levels.at(-2).totalXp;
  const extended = [...levels];
  for (let level = levels.at(-1).level + 1; level <= maximumLevel; level += 1) {
    extended.push({ level, totalXp: extended.at(-1).totalXp + increment });
  }
  return extended;
};

const writeJson = async (fileName, value) =>
  writeFile(new URL(fileName, outputDirectory), `${JSON.stringify(value, null, 2)}\n`, "utf8");

const main = async () => {
  const [experienceHtml, levelingHtml, rights] = await Promise.all([
    fetchPageHtml("Experience"),
    fetchPageHtml("Leveling"),
    fetchRights(),
  ]);
  const parsedItems = parseItems(experienceHtml);
  const items = await fetchItemResources(parsedItems);
  const publishedLevels = parseLevels(levelingHtml);
  const levels = extendLevels(publishedLevels, parseMaximumLevel(levelingHtml));
  if (items.length < 100 || publishedLevels.length < 100) throw new Error("Wiki data was incomplete");
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeJson("items.json", items),
    writeJson("levels.json", levels),
    writeJson("source.json", {
      checkedAt: new Date().toISOString().slice(0, 10),
      experienceUrl: `${wikiUrl}/wiki/Experience`,
      levelingUrl: `${wikiUrl}/wiki/Leveling`,
      itemCount: items.length,
      maximumLevelWithPublishedXpData: publishedLevels.at(-1).level,
      maximumLevelWithXpData: levels.at(-1).level,
      extrapolatedXpPerLevel: publishedLevels.at(-1).totalXp - publishedLevels.at(-2).totalXp,
      licenseName: rights.text,
      licenseUrl: rights.url,
    }),
  ]);
  process.stdout.write(`Synced ${items.length} items and ${levels.length} levels.\n`);
};

await main();
