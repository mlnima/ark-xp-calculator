# ARK Crafting XP

Unofficial local-first crafting experience and blueprint resource calculator for ARK: Survival Ascended. The TypeScript interface runs in a Tauri 2 shell for Windows, Android, and iOS. No application server, account, analytics, tracking, or remote calculation service is used.

## Features

- 762 searchable crafting items with names and crafting XP.
- Primitive through Ascendant crafting-XP multipliers.
- Custom server XP rate, temporary XP buffs, Drakeling Native Biome Boost, and variable Tribe Tower XP bonus.
- Independent sliders for 1–70 party members and 1–100 active crafting stations, with 50% tribe XP sharing.
- Multiple stations per crafter and shared-only party members, with completion based on every player reaching the target.
- Smithy and Tek Replicator selection with recipe compatibility, per-craft time, and a party-time comparison.
- Golden Hesperornis Egg, Broth of Enlightenment, and EXP Cake Slice counts per player and for the whole party.
- Current and target level calculation through level 245 from bundled total-XP data.
- Wiki-provided resource types with per-craft quantity input, total crafts, and total resources.
- Primitive recipe costs fill empty resource fields while preserving user-entered amounts.
- Optional party resource split shows whole-unit supplies for each player alongside the party total.
- Optional Clockface speed boost: all nearby structures at +100% (2×), or the selected station type at +300% (4×).
- Optional grinding and max-rank Recycler to reduce starting materials, with first-batch and recraft counts.
- Automatic draft restore and locally saved calculations that can be loaded and updated.
- Responsive dark interface with wrapping desktop steps and a single-column mobile layout.
- Built-in attribution, privacy disclosure, and distinct unofficial app branding.

## Calculation

Each crafter receives full XP from their assigned stations plus 50% from the other stations. Shared-only players receive 50% from every active station. Stations are assigned evenly across as many players as possible: 10 stations and 50 players means 10 crafters and 40 shared-only players; 20 stations and one player means that player runs all 20. One round completes one craft at every station:

```text
own XP per craft = item XP × quality × server rate × active buff multipliers
fewest stations owned by a player = floor(active stations / party members)
lowest XP per player per round = own XP per craft × (active stations + fewest stations owned) / 2
crafts per station = ceil(required XP / lowest XP per player per round)
total items = crafts per station × active stations
```

The current level is treated as the beginning of that level. Resource totals cover every active station's crafts. When there are shared-only players, their lower XP determines the session length. With uneven station assignments, the crafter with the fewest stations determines completion. Other crafters can exceed the target. Everyone remains within tribe XP range and all stations continue running until everyone reaches the target. The [official wiki's experience rule](https://ark.wiki.gg/wiki/Experience) describes 50% tribe sharing. Levels 221–229 use the same XP increment as level 219–220.

Party time assumes everyone starts together, with the same blueprint, level, and boosts, and every active station runs in parallel: `crafts per station × craft seconds at the selected station`. This is the time until every party member reaches the target. Smithy speed is 1×; Tek Replicator speed is 12×. The editable time field already includes station speed, so it is not divided a second time. Fractional seconds retain full numeric precision for calculations; small durations display up to six decimal places. Quality and XP boosts affect the number of crafts required. All recrafts count toward crafting time when grinding is selected. Gathering, station loading, grinding/transfers, pauses, and fuel are excluded, so elapsed play time may be longer. Selected temporary effects must be maintained throughout the session.

Party size and station count are saved independently in drafts and named calculations. Saved plans without a station count retain one station per player. Changing party size does not change the number of active stations.

Recipe times, primitive ingredient quantities, source URLs, and station compatibility are bundled in `src/data/crafting.json`. ASA crafting times from ARK Unity's item data take priority over wiki times where available; wiki recipes provide ingredient quantities. For example, [Shotgun](https://ark-unity.com/ark-survival-ascended/items/primitive-shotgun/) takes 15 seconds before station speed and [Flak Chestpiece](https://ark-unity.com/ark-survival-ascended/items/primitive-flak-chestpiece/) takes 5 seconds. Each researched time populates the editable field automatically. Smithy is selected initially, both stations remain selectable, and changing station converts an entered override to the new station's speed. Incompatible recipes show a message instead of a false time estimate. A genuinely missing time stays empty for manual entry.

Selecting Primitive fills only empty resource fields with the published base costs. Entered amounts remain editable and survive quality changes. Selecting another item loads that item's recipe. With the resource split selected, each player brings `ceil(total party resources / players)` whole units. This allocation covers all party crafts, or all starting supplies when grinding is selected. The split changes how supplies are presented; XP, craft counts, timing, and consumables continue to use the complete party calculation.

Clockface starts disabled and requires a selected mode when enabled. The nearby-structures mode increases speed by 100% (2×); targeting the selected station type increases speed by 300% (4×), as confirmed by the user's in-game settings. This multiplies station speed, making the Tek Replicator 24× or 48× normal crafting speed. The editable craft-time field includes the clock effect. Enabling, disabling, or switching mode converts that time while preserving manual overrides. The clock changes elapsed crafting time and consumable coverage; XP per craft, craft counts, and resource totals stay unchanged. Estimates assume every party station stays boosted throughout; retarget the clock to the compared station type when using that mode. [Clockface](https://ark.wiki.gg/wiki/Clockface) documents the crafting-speed effect.

Consumable supplies cover the entire selected station's crafting session: `ceil(party seconds / buff duration)` per player, then multiply by party size. This includes the first dose and renewals at expiry, assuming no existing buff time and no spoilage. Only selected consumables are counted. Egg and EXP Cake Slice each grant +10% XP for 600 seconds; Broth grants +50% for 1,200 seconds. Cake duration was confirmed from the user's in-game timer; the cake wiki page documents the effect but omits its duration.

Mechanics checked on 2026-10-19: [Golden Hesperornis Egg](https://ark.wiki.gg/wiki/Golden_Hesperornis_Egg), [Broth of Enlightenment](https://ark.wiki.gg/wiki/Broth_of_Enlightenment), [EXP Cake Slice](https://ark.wiki.gg/wiki/EXP_Cake_Slice), [Smithy](https://ark.wiki.gg/wiki/Smithy), [Tek Replicator](https://ark.wiki.gg/wiki/Tek_Replicator), and [Crafting Skill](https://ark.wiki.gg/wiki/Crafting_Skill). Player Crafting Skill does not speed up station crafting.

With grinding enabled, each station reuses recovered ingredients between batches. For an ingredient costing `c` per item and `n` crafts per station, the starting requirement is `(c + (n - 1) × (c - refund)) × active stations`. This funds a first craft at every parallel station and excludes refunds from the final craft, which cannot fund earlier items. The first batch is limited by the ingredient that can fund the fewest complete recipes; subsequent crafts use refunds and remaining materials. Resource shares divide these starting supplies across all party members. Total crafting XP and total crafts to reach the target stay unchanged because grinding crafted items gives no XP.

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
