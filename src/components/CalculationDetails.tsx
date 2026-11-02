import type { CalculationResult, CalculatorInput } from "../types/calculator";
import { ConsumableResults } from "./ConsumableResults";
import { PlayerResults } from "./PlayerResults";
import { ResourceResults } from "./ResourceResults";

type Props = {
  input: CalculatorInput;
  issues: string[];
  result: CalculationResult | null;
  onSplitResourcesChange: (value: boolean) => void;
};

export const CalculationDetails = ({ input, issues, result, onSplitResourcesChange }: Props) => (
  <section
    className="resource-panel calculation-details"
    aria-label="Live calculation details"
    aria-live="polite"
  >
    <div className="calculation-details-heading">
      <span className="status-dot" />
      <h2>Live calculation details</h2>
    </div>
    {result ? (
      <>
        <ResourceResults
          input={input}
          result={result}
          onSplitResourcesChange={onSplitResourcesChange}
        />
        <ConsumableResults input={input} result={result} />
        <PlayerResults result={result} />
      </>
    ) : (
      <div className="calculation-details-empty">
        <p>Complete the inputs to calculate resources, supplies, and player targets.</p>
        <ul>
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      </div>
    )}
  </section>
);
