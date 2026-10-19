import { formatDuration, formatNumber } from "../lib/format";
import type { CalculationResult } from "../types/calculator";

export const PlayerResults = ({ result }: { result: CalculationResult }) => (
  <section className="resource-results player-results" aria-label="Player progress">
    <div className="resource-result-heading"><h3>Each player's target</h3></div>
    <p className="crafting-help">{result.players[result.limitingPlayerIndex].name} sets the party finish time. Crafters keep their stations running until everyone reaches their target.</p>
    <div className="player-result-list" role="region" aria-label="Individual player results" tabIndex={0}>
      {result.players.map((player) => (
        <article className="player-result-row" key={player.index} aria-label={`Progress for Player ${player.index + 1}`}>
          <div>
            <strong>{player.name}</strong>
            <p>Level {player.currentLevel} → {player.targetLevel} · {player.stations ? `${player.stations} ${player.stations === 1 ? "station" : "stations"}` : "Shared XP only"}</p>
          </div>
          <dl>
            <div><dt>XP needed</dt><dd>{formatNumber(player.xpRequired)}</dd></div>
            <div><dt>XP per round</dt><dd>{formatNumber(player.xpPerRound)}</dd></div>
            <div><dt>Rounds to target</dt><dd>{formatNumber(player.roundsToTarget)}</dd></div>
            <div><dt>Time to target</dt><dd>{player.secondsToTarget === null ? "Timing unavailable" : formatDuration(player.secondsToTarget)}</dd></div>
          </dl>
        </article>
      ))}
    </div>
  </section>
);
