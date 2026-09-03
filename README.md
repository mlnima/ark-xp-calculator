# ARK Crafting XP

Unofficial local-first crafting experience and blueprint resource calculator for ARK: Survival Ascended. The TypeScript interface runs in a Tauri 2 shell for Windows, Android, and iOS. No application server, account, analytics, tracking, or remote calculation service is used.

## Features

- 762 searchable crafting items with names and crafting XP.
- Primitive through Ascendant crafting-XP multipliers.
- Custom server XP rate, temporary XP buffs, Drakeling Native Biome Boost, and variable Tribe Tower XP bonus.
- Simultaneous tribe crafting for 1–70 players with 50% shared XP from each nearby tribemate.
- Current and target level calculation through level 245 from bundled total-XP data.
- Wiki-provided resource types with per-craft quantity input, total crafts, and total resources.
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
```

The sync script reads crafting XP, level totals, and each item's ingredient names from the official wiki MediaWiki API. It retries rate-limited requests and validates minimum result counts before replacing the JSON snapshot. Calculation data is bundled with the app. The application does not store or request ARK item images.

Sources checked on 2026-08-21:

- [ARK crafting experience](https://ark.wiki.gg/wiki/Experience)
- [ARK level XP and experience boosts](https://ark.wiki.gg/wiki/Leveling)
- [Tribe Tower](https://ark.wiki.gg/wiki/Tribe_Tower)
- [Drakeling Native Biome Boost](https://ark.wiki.gg/wiki/Winter_Drakeling)
- [Tauri 2 project setup](https://v2.tauri.app/start/create-project/)
- [Tauri platform prerequisites](https://v2.tauri.app/start/prerequisites/)
- [Tauri distribution](https://v2.tauri.app/distribute/)

The wiki data snapshot is adapted under the [Creative Commons Attribution-Non-Commercial-ShareAlike 4.0 License](https://creativecommons.org/licenses/by-nc-sa/4.0). Confirm that the intended store distribution and monetization model complies with that non-commercial license or obtain separate permission before publication.
