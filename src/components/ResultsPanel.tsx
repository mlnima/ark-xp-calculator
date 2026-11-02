import type { CalculationResult, CalculatorInput } from "../types/calculator";
import { CalculationSummary } from "./CalculationSummary";
import { CraftingResults } from "./CraftingResults";
import { PlayerResults } from "./PlayerResults";
import { ResourceResults } from "./ResourceResults";
import { Icon } from "./Icon";

type Props = {
  input: CalculatorInput;
  issues: string[];
  result: CalculationResult | null;
  onSplitResourcesChange: (value: boolean) => void;
};

export const ResultsPanel = ({ input, issues, result, onSplitResourcesChange }: Props) => (
  <section className="results-panel" aria-label="Live calculation" aria-live="polite">
    <header className="results-topline">
      <span className="status-dot" />
      <h2>Live calculation</h2>
      <span className="results-live-label">Updates as you edit</span>
    </header>
    <div className="results-content">
      {result ? (
        <>
          <div className="live-overview">
            <CalculationSummary input={input} result={result} />
            <CraftingResults input={input} result={result} />
          </div>
          <ResourceResults
            input={input}
            result={result}
            onSplitResourcesChange={onSplitResourcesChange}
          />
          <PlayerResults input={input} result={result} />
          <div className="shared-explanation">
            <Icon name="info" size={17} />
            <p>
              One round is one craft at every active station. Each crafter gets full XP from their
              assigned stations plus 50% from the others. Shared-only players get 50% from every
              station. Everyone remains in tribe XP range; all stations keep running until everyone
              reaches the target. Resource totals cover every station’s items.
            </p>
          </div>
        </>
      ) : (
        <div className="live-results-empty">
          <h3>Complete your crafting plan</h3>
          <p>Resources, supplies, and player targets update when the inputs are complete.</p>
          <ul>
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </section>
);
