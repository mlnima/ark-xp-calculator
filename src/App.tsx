import { useMemo } from "react";
import itemsData from "./data/items.json";
import levelsData from "./data/levels.json";
import sourceData from "./data/source.json";
import { AppFooter } from "./components/AppFooter";
import { AppHeader } from "./components/AppHeader";
import { BlueprintForm } from "./components/BlueprintForm";
import { ExperienceSettings } from "./components/ExperienceSettings";
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
            <span>1–70 crafters</span>
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
                onChange={(qualityId) => setInput((current) => ({ ...current, qualityId }))}
                selected={input.qualityId}
              />
            </StepCard>
            <StepCard
              description="Apply the server rate, temporary buffs, and nearby tribe crafters."
              icon="boost"
              number="02"
              title="Rates, boosts & tribe"
            >
              <ExperienceSettings
                onBuffChange={toggleBuff}
                onPlayerCountChange={(playerCount) => setInput((current) => ({ ...current, playerCount }))}
                onServerRateChange={(serverRate) => setInput((current) => ({ ...current, serverRate }))}
                onTribeTowerBonusChange={(tribeTowerBonus) => setInput((current) => ({
                  ...current,
                  tribeTowerBonus,
                }))}
                playerCount={input.playerCount}
                selectedBuffs={input.buffIds}
                serverRate={input.serverRate}
                tribeTowerBonus={input.tribeTowerBonus}
              />
            </StepCard>
            <StepCard
              description="Select the level you are starting at and the level every crafter should reach."
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
              description="Resource types load from the selected item. Copy only each per-craft amount from your blueprint."
              icon="blueprint"
              number="04"
              title="Your blueprint"
            >
              <BlueprintForm
                itemSelected={Boolean(input.item)}
                onQuantityChange={state.updateResourceQuantity}
                resources={input.resources}
              />
            </StepCard>
          </div>
          <ResultsPanel input={input} issues={issues} result={result} />
        </div>
      </main>
      <AppFooter source={sourceData} />
    </div>
  );
};

export default App;
