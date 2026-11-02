import { formatNumber } from "../lib/format";
import { wholeResourceTotal } from "../lib/resource-shares";
import type { CalculationResult, CalculatorInput } from "../types/calculator";
import { ConsumableResults } from "./ConsumableResults";
import { Icon } from "./Icon";

type Props = {
  input: CalculatorInput;
  result: CalculationResult;
  onSplitResourcesChange: (value: boolean) => void;
};

export const ResourceResults = ({ input, result, onSplitResourcesChange }: Props) => (
  <div className="resource-overview">
    <section className="resource-results blueprint-results" aria-label="Blueprint resources">
      <div className="resource-result-heading">
        <div>
          <span className="eyebrow">Blueprint totals</span>
          <h3>{input.grinding ? "Starting resources needed" : "Resources needed"}</h3>
        </div>
        <Icon name="cube" />
      </div>
      <div className="resource-table" role="table" aria-label="Total blueprint resources">
        <div className="resource-table-head" role="row">
          <span role="columnheader">Resource</span>
          <span role="columnheader">Per craft</span>
          <span role="columnheader">Party total</span>
        </div>
        {result.resources.map((resource) => (
          <div className="resource-table-row" key={resource.name} role="row">
            <strong role="cell">{resource.name}</strong>
            <span role="cell">{formatNumber(resource.perCraft)}</span>
            <b role="cell">{formatNumber(wholeResourceTotal(resource.total))}</b>
          </div>
        ))}
      </div>
    </section>
    <section className="allocation-panel" aria-label="Resource allocation">
      <span className="eyebrow">Player contributions</span>
      <button
        aria-checked={input.splitResources}
        aria-describedby="resource-allocation-help"
        aria-label="Split resources across party"
        className="resource-allocation-toggle"
        onClick={() => onSplitResourcesChange(!input.splitResources)}
        role="switch"
        type="button"
      >
        <span>
          <strong>
            {input.splitResources ? "Split resources across party" : "Split by XP needed"}
          </strong>
          <small>{input.splitResources ? "Equal contributions" : "Individual contributions"}</small>
        </span>
        <span className="resource-toggle-track" aria-hidden="true">
          <span />
        </span>
      </button>
      <p className="crafting-help" id="resource-allocation-help">
        {input.splitResources ? (
          <>
            Equal shares across {input.playerCount} players, rounded up to whole units. Rounding may
            leave a small surplus.
          </>
        ) : (
          <>
            Shares follow the XP needed from each player's current level to their target. Whole
            units add up to the party total; rounding ties follow player order.
          </>
        )}
        {input.grinding && <> Pool these starting supplies at the stations and reuse refunds.</>}
      </p>
      <ConsumableResults input={input} result={result} />
    </section>
  </div>
);
