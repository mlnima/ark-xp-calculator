import { qualities } from "../data/qualities";
import { formatCompact, formatNumber } from "../lib/format";
import { partySetup } from "../lib/party";
import type { CalculationResult, CalculatorInput } from "../types/calculator";
import { Icon } from "./Icon";
import { CraftingResults } from "./CraftingResults";

type Props = {
  input: CalculatorInput;
  issues: string[];
  result: CalculationResult | null;
  onSplitResourcesChange: (value: boolean) => void;
};

const Stat = ({ label, value, detail }: { label: string; value: string; detail: string }) => (
  <div className="result-stat">
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{detail}</small>
  </div>
);

export const ResultsPanel = ({ input, issues, result, onSplitResourcesChange }: Props) => {
  const quality = qualities.find(({ id }) => id === input.qualityId);
  const party = partySetup(input);
  return (
    <aside className="results-panel" aria-live="polite">
      <div className="results-topline">
        <span className="status-dot" />
        <span>Live calculation</span>
      </div>
      {!result ? (
        <div className="results-empty">
          <div className="empty-orbit"><Icon name="spark" size={30} /></div>
          <h2>Your crafting plan</h2>
          <p>Complete the blueprint details to see the exact craft and resource totals.</p>
          <div className="issue-list">
            {issues.map((issue) => (
              <div key={issue}><span /><span>{issue}</span></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="results-content">
          <div className="result-item">
            <div>
              <span className="eyebrow">Crafting plan</span>
              <h2>{input.item?.name}</h2>
              <p>{quality?.label}</p>
            </div>
          </div>
          <div className="craft-total">
            <span>{input.grinding ? "First batch to craft" : "Total items to craft"}</span>
            <strong>{formatNumber(result.initialCraftsPerStation * input.stationCount)}</strong>
            <p>{formatNumber(result.initialCraftsPerStation)} per station × {input.stationCount} active {input.stationCount === 1 ? "station" : "stations"}</p>
            <p>{party.craftingPlayers} crafting · {party.sharingPlayers} shared XP only</p>
          </div>
          {input.grinding && (
            <div className="shared-explanation">
              <Icon name="info" size={17} />
              <p>
                Then grind and recraft {formatNumber(result.recycledCraftsPerStation)} more per station
                using refunds and remaining materials across as many batches as needed.
                Total: {formatNumber(result.totalCrafts)} crafts ({formatNumber(result.craftsPerStation)} per station).
                Grinding items gives no XP; the total crafts needed for your target stays the same.
              </p>
            </div>
          )}
          <div className="result-stat-grid">
            <Stat
              detail="From selected level totals"
              label="XP needed / player"
              value={formatCompact(result.xpRequired)}
            />
            <Stat
              detail={`${formatNumber(result.combinedMultiplier)}× combined`}
              label="Own XP / craft"
              value={formatNumber(result.ownXpPerCraft)}
            />
            <Stat
              detail={`${party.minStationsPerCrafter} owned ${party.minStationsPerCrafter === 1 ? "station" : "stations"} plus tribe share; minimum`}
              label="Crafter XP / round"
              value={formatNumber(result.crafterXpPerRound)}
            />
            <Stat
              detail={`${formatNumber(result.xpOverTarget)} XP above target`}
              label="Lowest player XP / round"
              value={formatNumber(result.xpPerPlayerPerRound)}
            />
          </div>
          {party.sharingPlayers > 0 && (
            <p className="crafting-help">Shared-only player: {formatNumber(result.passiveXpPerRound)} XP per round from {input.stationCount} stations. Their progress determines when the party finishes.</p>
          )}
          <CraftingResults input={input} result={result} />
          <div className="resource-results">
            <div className="resource-result-heading">
              <div>
                <span className="eyebrow">Blueprint totals</span>
                <h3>{input.splitResources ? "Resources each player brings" : input.grinding ? "Starting resources needed" : "Resources needed"}</h3>
              </div>
              <Icon name="cube" />
            </div>
            <label className="resource-split-option">
              <input checked={input.splitResources} onChange={(event) => onSplitResourcesChange(event.target.checked)} type="checkbox" />
              Split resources across party
            </label>
            {input.splitResources && <p className="crafting-help">Equal shares across {input.playerCount} players, rounded up to whole units.{input.grinding ? " These are starting supplies; reuse grinding refunds." : ""}</p>}
            <div className="resource-table" role="table" aria-label="Total blueprint resources">
              <div className="resource-table-head" role="row">
                <span role="columnheader">Resource</span>
                <span role="columnheader">{input.splitResources ? "Party total" : "Each"}</span>
                <span role="columnheader">{input.splitResources ? "Each brings" : "Total"}</span>
              </div>
              {result.resources.map((resource) => (
                <div className="resource-table-row" key={resource.name} role="row">
                  <strong role="cell">{resource.name}</strong>
                  <span role="cell">{formatNumber(input.splitResources ? resource.total : resource.perCraft)}</span>
                  <b role="cell">{formatNumber(input.splitResources ? resource.perPlayer : resource.total)}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="shared-explanation">
            <Icon name="info" size={17} />
            <p>One round is one craft at every active station. Each crafter gets full XP from their assigned stations plus 50% from the others. Shared-only players get 50% from every station. Everyone remains in tribe XP range; all stations keep running until everyone reaches the target. Resource totals cover every station’s items.</p>
          </div>
        </div>
      )}
    </aside>
  );
};
