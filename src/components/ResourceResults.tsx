import { formatNumber } from "../lib/format";
import { allocateResourceShares, wholeResourceTotal } from "../lib/resource-shares";
import type { CalculationResult, CalculatorInput } from "../types/calculator";
import { Icon } from "./Icon";

type Props = {
  input: CalculatorInput;
  result: CalculationResult;
  onSplitResourcesChange: (value: boolean) => void;
};

export const ResourceResults = ({ input, result, onSplitResourcesChange }: Props) => {
  const xpRequired = result.players.map((player) => player.xpRequired);
  const shares = result.resources.map(({ total }) => allocateResourceShares(total, xpRequired));
  return (
    <section
      className="resource-results resource-panel"
      aria-label="Blueprint resources"
      aria-live="polite"
    >
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
            Each player's share follows the XP needed from their current level to their target.
            Whole units add up to the party total; rounding ties follow player order.
          </>
        )}
        {input.grinding && (
          <> These are starting supplies; pool them at the stations and reuse refunds.</>
        )}
      </p>
      {input.splitResources ? (
        <div
          className="resource-table resource-share-table"
          role="table"
          aria-label="Equal resource shares"
        >
          <div className="resource-table-head" role="row">
            <span role="columnheader">Resource</span>
            <span role="columnheader">Each brings</span>
          </div>
          {result.resources.map((resource) => (
            <div className="resource-table-row" key={resource.name} role="row">
              <strong role="cell">{resource.name}</strong>
              <b role="cell">{formatNumber(resource.perPlayer)}</b>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="resource-player-grid"
          role="region"
          aria-label="Resources by player"
          tabIndex={0}
        >
          {result.players.map((player) => (
            <article
              className="resource-player-card"
              key={player.index}
              aria-label={`Resource contribution for Player ${player.index + 1}`}
            >
              <strong>{player.name}</strong>
              <p>
                Level {player.currentLevel} → {player.targetLevel} ·{" "}
                {formatNumber(player.xpRequired)} XP
              </p>
              <dl>
                {result.resources.map((resource, resourceIndex) => (
                  <div key={resource.name}>
                    <dt>{resource.name}</dt>
                    <dd>{formatNumber(shares[resourceIndex][player.index])}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
