import { useMemo } from "react";
import itemsData from "./data/items.json";
import levelsData from "./data/levels.json";
import sourceData from "./data/source.json";
import { AppFooter } from "./components/AppFooter";
import { AppHeader } from "./components/AppHeader";
import { BlueprintForm } from "./components/BlueprintForm";
import { CraftingSettings } from "./components/CraftingSettings";
import { ExperienceSettings } from "./components/ExperienceSettings";
import { GrindingSettings } from "./components/GrindingSettings";
import { ItemPicker } from "./components/ItemPicker";
import { LevelSelector } from "./components/LevelSelector";
import { QualityPicker } from "./components/QualityPicker";
import { ResultsPanel } from "./components/ResultsPanel";
import { SavedCalculations } from "./components/SavedCalculations";
import { StepCard } from "./components/StepCard";
import { useCalculatorState } from "./hooks/useCalculatorState";
import { calculate, getInputIssues } from "./lib/calculator";
import type { BuffId, CraftingItem, LevelEntry } from "./types/calculator";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/forms.css";
import "./styles/blueprint.css";
import "./styles/picker.css";
import "./styles/results.css";
import "./styles/crafting.css";
import "./styles/saved.css";
import "./styles/responsive.css";

const items = itemsData as CraftingItem[];
const levels = levelsData as LevelEntry[];

const App = () => {
  const state = useCalculatorState(items);
  const { input, setInput } = state;
  const issues = useMemo(() => getInputIssues(input, levels), [input]);
  const result = useMemo(() => calculate(input, levels), [input]);
  const toggleBuff = (id: BuffId) => setInput((current) => ({
    ...current,
    buffIds: current.buffIds.includes(id)
      ? current.buffIds.filter((buffId) => buffId !== id)
      : [...current.buffIds, id],
    tribeTowerBonus: id === "tower" && current.buffIds.includes(id) ? "" : current.tribeTowerBonus,
  }));

  return (
    <div className="app-shell">
      <AppHeader itemCount={items.length} />
      <main>
        <section className="hero">
          <span className="hero-kicker">Craft smarter · level together</span>
          <h1>Plan the exact path to your <em>target level.</em></h1>
          <p>Choose your blueprint, tribe setup, and active boosts. The plan updates instantly with per-player XP and the full resource haul.</p>
          <div className="hero-pills">
            <span>50% tribe share</span>
            <span>1–70 players</span>
            <span>Primitive–Ascendant</span>
          </div>
        </section>
        <SavedCalculations
          activeId={state.activeSavedId}
          calculationName={state.calculationName}
          calculations={state.saved}
          canSave={Boolean(result)}
          onCalculationNameChange={state.setCalculationName}
          onLoad={state.loadCalculation}
          onSaveNew={state.saveNew}
          onUpdate={state.updateSaved}
        />
        <div className="calculator-layout">
          <div className="form-column">
            <StepCard
              description="Pick the crafted item and the quality shown on your blueprint."
              icon="item"
              number="01"
              title="Item & quality"
            >
              <ItemPicker
                items={items}
                onSelect={state.selectItem}
                selected={input.item}
              />
              <QualityPicker
                onChange={state.selectQuality}
                selected={input.qualityId}
              />
              <CraftingSettings
                input={input}
                onStationChange={state.selectStation}
                onCraftSecondsChange={(craftSeconds) => setInput((current) => ({ ...current, craftSeconds }))}
                onClockChange={state.updateClock}
              />
            </StepCard>
            <StepCard
              description="Set the party size, active stations, server rate, and temporary buffs."
              icon="boost"
              number="02"
              title="Rates, boosts & tribe"
            >
              <ExperienceSettings
                onBuffChange={toggleBuff}
                onPlayerCountChange={(playerCount) => setInput((current) => ({ ...current, playerCount }))}
                onStationCountChange={(stationCount) => setInput((current) => ({ ...current, stationCount }))}
                onServerRateChange={(serverRate) => setInput((current) => ({ ...current, serverRate }))}
                onTribeTowerBonusChange={(tribeTowerBonus) => setInput((current) => ({
                  ...current,
                  tribeTowerBonus,
                }))}
                playerCount={input.playerCount}
                stationCount={input.stationCount}
                selectedBuffs={input.buffIds}
                serverRate={input.serverRate}
                tribeTowerBonus={input.tribeTowerBonus}
              />
            </StepCard>
            <StepCard
              description="Select the starting level and the target every party member should reach."
              icon="levels"
              number="03"
              title="Current & target level"
            >
              <LevelSelector
                currentLevel={input.currentLevel}
                levels={levels}
                onCurrentChange={(currentLevel) => setInput((current) => ({ ...current, currentLevel }))}
                onTargetChange={(targetLevel) => setInput((current) => ({ ...current, targetLevel }))}
                targetLevel={input.targetLevel}
              />
            </StepCard>
            <StepCard
              description="Primitive costs fill empty fields automatically. You can edit every amount to match your blueprint."
              icon="blueprint"
              number="04"
              title="Your blueprint"
            >
              <BlueprintForm
                itemSelected={Boolean(input.item)}
                onQuantityChange={state.updateResourceQuantity}
                resources={input.resources}
              />
              <GrindingSettings
                grinding={input.grinding}
                recycler={input.recycler}
                onGrindingChange={(grinding) => setInput((current) => ({
                  ...current,
                  grinding,
                  recycler: grinding && current.recycler,
                }))}
                onRecyclerChange={(recycler) => setInput((current) => ({ ...current, recycler }))}
              />
            </StepCard>
          </div>
          <ResultsPanel
            input={input}
            issues={issues}
            result={result}
            onSplitResourcesChange={(splitResources) => setInput((current) => ({ ...current, splitResources }))}
          />
        </div>
      </main>
      <AppFooter source={sourceData} />
    </div>
  );
};

export default App;
