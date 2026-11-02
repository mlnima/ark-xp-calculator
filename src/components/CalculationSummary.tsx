import { qualities } from "../data/qualities";
import { formatCompact, formatNumber } from "../lib/format";
import { partySetup } from "../lib/party";
import type { CalculationResult, CalculatorInput } from "../types/calculator";

type Props = { input: CalculatorInput; result: CalculationResult };

const Stat = ({ label, value, detail }: { label: string; value: string; detail: string }) => (
  <div className="result-stat">
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{detail}</small>
  </div>
);

export const CalculationSummary = ({ input, result }: Props) => {
  const quality = qualities.find(({ id }) => id === input.qualityId);
  const party = partySetup(input);
  return (
    <section className="calculation-summary" aria-label="Crafting plan summary">
      <div className="result-item">
        <div>
          <span className="eyebrow">Crafting plan</span>
          <h3>{input.item?.name}</h3>
          <p>{quality?.label}</p>
        </div>
      </div>
      <div className="craft-total">
        <span>{input.grinding ? "First batch to craft" : "Total items to craft"}</span>
        <strong>{formatNumber(result.initialCraftsPerStation * input.stationCount)}</strong>
        <p>
          {formatNumber(result.initialCraftsPerStation)} per station × {input.stationCount} active
          {input.stationCount === 1 ? " station" : " stations"}
        </p>
        <p>
          {party.craftingPlayers} crafting · {party.sharingPlayers} shared XP only
        </p>
      </div>
      {input.grinding && (
        <p className="crafting-help">
          Then grind and recraft {formatNumber(result.recycledCraftsPerStation)} more per station
          using refunds and remaining materials across as many batches as needed. Total:{" "}
          {formatNumber(result.totalCrafts)} crafts ({formatNumber(result.craftsPerStation)}
          {" per station). Grinding items gives no XP; the target craft count stays the same."}
        </p>
      )}
      <div className="result-stat-grid">
        <Stat
          label="Last player XP needed"
          value={formatCompact(result.xpRequired)}
          detail={result.players[result.limitingPlayerIndex].name}
        />
        <Stat
          label="Own XP / craft"
          value={formatNumber(result.ownXpPerCraft)}
          detail={`${formatNumber(result.combinedMultiplier)}× combined`}
        />
        <Stat
          label="Crafter XP / round"
          value={formatNumber(result.crafterXpPerRound)}
          detail={
            `${party.minStationsPerCrafter} owned ` +
            `${party.minStationsPerCrafter === 1 ? "station" : "stations"}` +
            " plus tribe share; minimum"
          }
        />
        <Stat
          label="Last player XP / round"
          value={formatNumber(result.xpPerPlayerPerRound)}
          detail={`${formatNumber(result.xpOverTarget)} XP above target`}
        />
      </div>
      {party.sharingPlayers > 0 && (
        <p className="crafting-help">
          {"Shared-only players receive "}
          {formatNumber(result.passiveXpPerRound)} XP per round from {input.stationCount} stations.
          Each player's levels determine their rounds to target.
        </p>
      )}
    </section>
  );
};
