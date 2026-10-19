export const normalizeName = (value) => value.replace(/^Primitive /i, "").toLowerCase().replace(/[^a-z0-9]/g, "");

const cleanName = (value) => value
  .replace(/<!--.*?-->/gs, "")
  .replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, "$1")
  .replace(/&amp;/g, "&").replace(/&#39;/g, "'").trim();

export const parseItemLinks = (html) => new Map(
  [...html.matchAll(/<a href="(\/ark-survival-ascended\/items\/[^\"]+)"[^>]*>(.*?)<\/a>/gs)]
    .map((match) => [normalizeName(cleanName(match[2].match(/alt="([^\"]+)"/)?.[1] || "")), `https://ark-unity.com${match[1]}`])
    .filter(([name]) => name),
);

const itemInfobox = (content, name) => {
  const boxes = [...content.matchAll(/\{\{\s*infobox\s+\w+/gi)].map((match) => {
    const tokens = /\{\{|\}\}/g;
    let depth = 0;
    for (const token of content.slice(match.index).matchAll(tokens)) {
      depth += token[0] === "{{" ? 1 : -1;
      if (depth === 0) return content.slice(match.index, match.index + token.index + 2);
    }
    return "";
  }).filter(Boolean);
  return boxes.length === 1 ? boxes[0] : boxes.find((box) =>
    normalizeName(cleanName(box.match(/\|\s*name\s*=\s*([^\n|}]+)/i)?.[1] || "")) === normalizeName(name)) || "";
};

export const parseWikiRecipe = (content, name = "") => {
  const box = itemInfobox(content, name);
  const fields = new Map([...box.matchAll(/\|\s*(blueprintpath|craftingtime|quantity\d+(?:_ASA)?|ingredient\d+(?:_ASA)?|craftedin\d*)\s*=\s*(.*?)(?=\r?\n|\s*\}\}|\|\s*[a-z]\w*\s*=)/gi)]
    .map((match) => [match[1].toLowerCase(), cleanName(match[2])]));
  const seconds = Number(fields.get("craftingtime"));
  const asaIngredients = [...fields.keys()].some((key) => /^ingredient\d+_asa$/.test(key) && fields.get(key));
  const suffix = asaIngredients ? "_asa" : "";
  const ingredients = [...fields.entries()].flatMap(([key, name]) => {
    const number = key.match(new RegExp(`^ingredient(\\d+)${suffix}$`))?.[1];
    const quantity = Number(fields.get(`quantity${number}${suffix}`));
    return number && name && Number.isFinite(quantity) && quantity > 0 ? [{ name, quantity }] : [];
  });
  return {
    assetClass: fields.get("blueprintpath")?.match(/([a-z0-9_]+)['"]*$/i)?.[1] || "",
    baseSeconds: Number.isFinite(seconds) && seconds > 0 ? seconds : null,
    stations: [...new Set([...fields.entries()].filter(([key]) => /^craftedin\d*$/.test(key)).map(([, value]) => value).filter(Boolean))],
    ingredients,
  };
};

export const parsePageContext = (html) => JSON.parse(
  html.match(/<script id="vike_pageContext" type="application\/json">(.*?)<\/script>/s)?.[1] || "null",
);

export const fetchSource = async (url, attempt = 0) => {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "ARKCraftingXP/0.1 data-sync" },
      signal: AbortSignal.timeout(30000),
    });
    if (response.ok) return response;
    if (response.status !== 429 && response.status < 500) throw new Error(`Source request failed: ${response.status} ${url}`);
    throw new TypeError(`Source temporarily unavailable: ${response.status}`);
  } catch (error) {
    if (!(error instanceof TypeError) || attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
    return fetchSource(url, attempt + 1);
  }
};
