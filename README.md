# ARK Crafting XP

Unofficial local-first crafting experience and blueprint resource calculator for ARK: Survival Ascended. The TypeScript interface runs in a Tauri 2 shell for Windows, Android, and iOS. No application server, account, analytics, tracking, or remote calculation service is used.

## Features

- 762 searchable crafting items with names and crafting XP.
- Primitive through Ascendant crafting-XP multipliers.
- Custom server XP rate, temporary XP buffs, Drakeling Native Biome Boost, and variable Tribe Tower XP bonus.
- Simultaneous tribe crafting for 1–70 players with 50% shared XP from each nearby tribemate.
- Smithy and Tek Replicator selection with recipe compatibility, per-craft time, and a party-time comparison.
- Golden Hesperornis Egg, Broth of Enlightenment, and EXP Cake Slice counts per player and for the whole party.
- Current and target level calculation through level 245 from bundled total-XP data.
- Wiki-provided resource types with per-craft quantity input, total crafts, and total resources.
- Optional grinding and max-rank Recycler to reduce starting materials, with first-batch and recraft counts.
- Automatic draft restore and locally saved calculations that can be loaded and updated.
- Responsive dark interface with wrapping desktop steps and a single-column mobile layout.
- Built-in attribution, privacy disclosure, and distinct unofficial app branding.

## Calculation

Each player receives their full crafting XP plus 50% of the crafting XP earned by every other nearby crafter:

```text
own XP = item XP × quality × server rate × active buff multipliers
shared XP per round = own XP × 0.5 × (players - 1)
XP per player per round = own XP + shared XP per round
crafts per player = ceil(required XP / XP per player per round)
total items = crafts per player × players
```

The current level is treated as the beginning of that level. Resource totals cover every item crafted by every participating player. Levels 221–229 use the same XP increment as level 219–220.

Party time assumes everyone starts together, with the same blueprint, level, and boosts, using one independent station per player. It is also the average time per player in this model: `crafts per player × base craft seconds ÷ station speed`. Smithy speed is 1×; Tek Replicator speed is 12×. Quality and XP boosts affect the number of crafts required. All recrafts count toward crafting time when grinding is selected. Gathering, station loading, grinding/transfers, pauses, and fuel are excluded, so elapsed play time may be longer. Selected temporary effects must be maintained throughout the session.

Recipe times and station compatibility are bundled separately in `src/data/crafting.json`. A missing published time requires an explicit blueprint time; no estimated default is supplied. The optional base-time override is measured before station speed and can reflect the actual blueprint/server. Items whose wiki recipes do not support either station keep their XP/resource calculation, with timing marked unavailable.

Consumable supplies cover the entire selected station's crafting session: `ceil(party seconds / buff duration)` per player, then multiply by party size. This includes the first dose and renewals at expiry, assuming no existing buff time and no spoilage. Only selected consumables are counted. Egg and EXP Cake Slice each grant +10% XP for 600 seconds; Broth grants +50% for 1,200 seconds. Cake duration was confirmed from the user's in-game timer; the cake wiki page documents the effect but omits its duration.

Mechanics checked on 2026-10-19: [Golden Hesperornis Egg](https://ark.wiki.gg/wiki/Golden_Hesperornis_Egg), [Broth of Enlightenment](https://ark.wiki.gg/wiki/Broth_of_Enlightenment), [EXP Cake Slice](https://ark.wiki.gg/wiki/EXP_Cake_Slice), [Smithy](https://ark.wiki.gg/wiki/Smithy), [Tek Replicator](https://ark.wiki.gg/wiki/Tek_Replicator), and [Crafting Skill](https://ark.wiki.gg/wiki/Crafting_Skill). Player Crafting Skill does not speed up station crafting.

With grinding enabled, each player reuses recovered ingredients between batches. For an ingredient costing `c` per item and `n` crafts per player, the starting requirement is `(c + (n - 1) × (c - refund)) × players`. This funds the first craft and excludes refunds from the final craft, which cannot fund earlier items. The first batch is limited by the ingredient that can fund the fewest complete recipes; subsequent crafts use refunds and remaining materials. Total crafting XP and total crafts to reach the target stay unchanged because grinding crafted items gives no XP.

Grinding uses the current English wiki's Ascended return of 30%, rounded up per ingredient per item. The model interprets max-rank Recycler's “30% more” as a relative bonus to that rate (39% before rounding). Both options start unchecked. Only enable grinding for items and ingredients the grinder accepts. The model assumes all listed ingredients can be reused, no spoilage, and all refunds are produced by a player with Recycler when it is selected. Polymer comes back as Organic Polymer. Fuel and the grinder's construction cost are excluded.

Grinding sources checked on 2026-09-12: [Industrial Grinder](https://ark.wiki.gg/wiki/Industrial_Grinder) and [Recycler in the Skill Tree](https://ark.wiki.gg/wiki/Skills). The current English grinder page omits a refund cap; this calculation follows that page's uncapped rate. Localized/older pages list a 150-per-ingredient cap, so capped or modified servers may require more materials.

## Development

```shell
npm install
npm run dev
npm test
npm run build
```

Run the Windows desktop shell:

```shell
npm run tauri dev
```

Build the Windows executable or installers:

```shell
npx tauri build --no-bundle
npx tauri build
```

## Web

The same responsive React interface builds as a static site with no backend:

```shell
npm run build
npm run preview
```

Pushes to `main` deploy the `dist` output to GitHub Pages through the included workflow.
The published project URL is `https://mlnima.github.io/ark-xp-calculator/`.

## Android and iOS

Install the platform prerequisites from the official Tauri guide before initializing a mobile target.

Android:

```shell
npx tauri android init
npx tauri android build --aab
```

iOS initialization and builds must run on macOS with Xcode:

```shell
npx tauri ios init
npx tauri ios build
```

Store signing identities, provisioning profiles, bundle registration, store listings, and developer accounts remain publisher-owned secrets and are intentionally not stored in the repository.

## Wiki data

Refresh the bundled item and level snapshot:

```shell
npm run data:sync
npm run data:crafting
```

The sync scripts read crafting XP, level totals, each item's ingredient names, and recipe crafting times/stations from the official wiki MediaWiki API. The XP sync retries rate-limited requests; both scripts validate completeness before replacing their JSON snapshots. Calculation data is bundled with the app. The application does not store or request ARK item images.

Sources checked on 2026-08-21:

- [ARK crafting experience](https://ark.wiki.gg/wiki/Experience)
- [ARK level XP and experience boosts](https://ark.wiki.gg/wiki/Leveling)
- [Tribe Tower](https://ark.wiki.gg/wiki/Tribe_Tower)
- [Drakeling Native Biome Boost](https://ark.wiki.gg/wiki/Winter_Drakeling)
- [Tauri 2 project setup](https://v2.tauri.app/start/create-project/)
- [Tauri platform prerequisites](https://v2.tauri.app/start/prerequisites/)
- [Tauri distribution](https://v2.tauri.app/distribute/)

The wiki data snapshot is adapted under the [Creative Commons Attribution-Non-Commercial-ShareAlike 4.0 License](https://creativecommons.org/licenses/by-nc-sa/4.0). Confirm that the intended store distribution and monetization model complies with that non-commercial license or obtain separate permission before publication.
