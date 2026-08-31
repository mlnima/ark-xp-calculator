import { qualities } from "../data/qualities";
import { formatCompact, formatNumber } from "../lib/format";
import type { CalculationResult, CalculatorInput } from "../types/calculator";
import { Icon } from "./Icon";

type Props = {
  input: CalculatorInput;
  issues: string[];
  result: CalculationResult | null;
};

const Stat = ({ label, value, detail }: { label: string; value: string; detail: string }) => (
  <div className="result-stat">
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{detail}</small>
  </div>
);

export const ResultsPanel = ({ input, issues, result }: Props) => {
  const quality = qualities.find(({ id }) => id === input.qualityId);
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
            <span>Total items to craft</span>
            <strong>{formatNumber(result.totalCrafts)}</strong>
            <p>{formatNumber(result.craftsPerPlayer)} per player × {input.playerCount} {input.playerCount === 1 ? "player" : "players"}</p>
          </div>
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
              detail={`${input.playerCount - 1} nearby crafters at 50%`}
              label="Shared XP / round"
              value={formatNumber(result.sharedXpPerRound)}
            />
            <Stat
              detail={`${formatNumber(result.xpOverTarget)} XP above target`}
              label="XP / player / round"
              value={formatNumber(result.xpPerPlayerPerRound)}
            />
          </div>
          <div className="resource-results">
            <div className="resource-result-heading">
              <div>
                <span className="eyebrow">Blueprint totals</span>
                <h3>Resources needed</h3>
              </div>
              <Icon name="cube" />
            </div>
            <div className="resource-table" role="table" aria-label="Total blueprint resources">
              <div className="resource-table-head" role="row">
                <span role="columnheader">Resource</span>
                <span role="columnheader">Each</span>
                <span role="columnheader">Total</span>
              </div>
              {result.resources.map((resource) => (
                <div className="resource-table-row" key={resource.name} role="row">
                  <strong role="cell">{resource.name}</strong>
                  <span role="cell">{formatNumber(resource.perCraft)}</span>
                  <b role="cell">{formatNumber(resource.total)}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="shared-explanation">
            <Icon name="info" size={17} />
            <p>Each player gets full XP from their own craft plus 50% of each nearby tribemate’s craft. Resource totals cover every player’s items.</p>
          </div>
        </div>
      )}
    </aside>
  );
};
