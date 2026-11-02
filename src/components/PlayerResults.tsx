import { formatDuration, formatNumber } from "../lib/format";
import { allocateResourceShares } from "../lib/resource-shares";
import type { CalculationResult, CalculatorInput } from "../types/calculator";

type Props = { input: CalculatorInput; result: CalculationResult };

export const PlayerResults = ({ input, result }: Props) => {
  const xpRequired = result.players.map((player) => player.xpRequired);
  const shares = result.resources.map(({ total }) => allocateResourceShares(total, xpRequired));
  return (
    <section className="player-results" aria-label="Player requirements">
      <div className="player-results-heading">
        <div>
          <span className="eyebrow">Supplies & targets</span>
          <h3>Player plans</h3>
        </div>
        <span className="allocation-mode">
          {input.splitResources ? "Equal split" : "Split by XP needed"}
        </span>
      </div>
      <p className="crafting-help">
        {result.players[result.limitingPlayerIndex].name} sets the party finish time. Crafters keep
        their stations running until everyone reaches their target. Selected consumables cover that
        full party session.
      </p>
      <div className="player-plan-grid" role="list" aria-label="Player plans">
        {result.players.map((player) => (
          <article
            className="player-plan-card"
            key={player.index}
            role="listitem"
            aria-label={`Plan for Player ${player.index + 1}`}
          >
            <header className="player-plan-heading">
              <div>
                <h4>{player.name}</h4>
                <p>
                  Level {player.currentLevel} → {player.targetLevel}
                </p>
              </div>
              <span>
                {player.stations
                  ? `${player.stations} ${player.stations === 1 ? "station" : "stations"}`
                  : "Shared XP only"}
              </span>
            </header>
            <dl className="player-progress-stats">
              <div>
                <dt>XP needed</dt>
                <dd>{formatNumber(player.xpRequired)}</dd>
              </div>
              <div>
                <dt>XP per round</dt>
                <dd>{formatNumber(player.xpPerRound)}</dd>
              </div>
              <div>
                <dt>Rounds to target</dt>
                <dd>{formatNumber(player.roundsToTarget)}</dd>
              </div>
              <div>
                <dt>Time to target</dt>
                <dd>
                  {player.secondsToTarget === null
                    ? "Timing unavailable"
                    : formatDuration(player.secondsToTarget)}
                </dd>
              </div>
            </dl>
            <section
              className="player-supplies"
              aria-label={`Resources for Player ${player.index + 1}`}
            >
              <h5>Resources to bring</h5>
              <dl className="player-supply-list">
                {result.resources.map((resource, index) => (
                  <div key={resource.name}>
                    <dt>{resource.name}</dt>
                    <dd>
                      {formatNumber(
                        input.splitResources ? resource.perPlayer : shares[index][player.index],
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
            <section
              className="player-supplies"
              aria-label={`XP consumables for Player ${player.index + 1}`}
            >
              <h5>XP consumables needed</h5>
              {result.timing ? (
                result.timing.consumables.length ? (
                  <dl className="player-supply-list">
                    {result.timing.consumables.map((consumable) => (
                      <div key={consumable.id}>
                        <dt>{consumable.label}</dt>
                        <dd>{formatNumber(consumable.perPlayer)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p>No consumable boosts selected.</p>
                )
              ) : (
                <p>Timing unavailable.</p>
              )}
            </section>
          </article>
        ))}
      </div>
    </section>
  );
};
