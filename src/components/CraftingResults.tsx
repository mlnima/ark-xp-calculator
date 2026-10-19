import { getTimingIssues } from "../lib/crafting";
import { clockSpeed } from "../lib/blueprint";
import { clockModes } from "../data/crafting";
import { formatDuration, formatNumber } from "../lib/format";
import type { CalculationResult, CalculatorInput } from "../types/calculator";

type Props = { input: CalculatorInput; result: CalculationResult };

export const CraftingResults = ({ input, result }: Props) => {
  const timing = result.timing;
  return (
    <section className="crafting-results resource-results" aria-label="Crafting time and consumables">
      <span className="eyebrow">Time & supplies</span>
      <h3>Estimated party time</h3>
      {timing ? (
        <>
          <strong className="party-duration">{formatDuration(timing.partySeconds)}</strong>
          <p className="crafting-help">
            Average per player and whole party · {input.playerCount} parallel {input.playerCount === 1 ? "station" : "stations"}
            <br />{formatNumber(result.craftsPerPlayer)} crafts per player · {formatDuration(timing.secondsPerCraft)} per craft
            {input.clockEnabled && <><br />Clockface: {clockModes.find(({ id }) => id === input.clockMode)?.label} · {clockSpeed(input)}× speed</>}
          </p>
          <div className="station-comparison" aria-label="Station time comparison">
            {timing.stations.map((station) => (
              <div className={station.id === input.stationId ? "station-selected" : ""} key={station.id}>
                <strong>{station.label}{station.id === input.stationId ? " · selected" : ""}</strong>
                <span>{formatDuration(station.partySeconds)} for the party</span>
                <small>{formatDuration(station.secondsPerCraft)} per craft</small>
              </div>
            ))}
          </div>
          {input.clockEnabled && <p className="crafting-help">Clock speed applies throughout this estimate. Retarget the clock when comparing another station type.</p>}
          <h3>XP consumables needed</h3>
          {timing.consumables.length ? (
            <table className="consumable-table">
              <caption>Full buff coverage until the target level</caption>
              <thead><tr><th scope="col">Consumable</th><th scope="col">Per player</th><th scope="col">Party total</th></tr></thead>
              <tbody>
                {timing.consumables.map((consumable) => (
                  <tr key={consumable.id}>
                    <th scope="row">{consumable.label}<small>{formatDuration(consumable.durationSeconds)} per dose</small></th>
                    <td>{formatNumber(consumable.perPlayer)}</td><td>{formatNumber(consumable.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="crafting-help">Select Golden Hesperornis Egg, Broth of Enlightenment, or EXP Cake Slice to include supplies.</p>}
          <p className="crafting-help">
            Everyone starts together at the same level with the same blueprint and boosts.
            Quality, XP rate, and boosts affect the crafts needed; station speed sets the craft time.
            Reapply selected boosts throughout. Supplies include the first dose and renewals, rounded up per player.
            Gathering, loading, pauses, and {input.grinding ? "grinding/transfer time are excluded; every recraft is included." : "fuel are excluded."}
          </p>
        </>
      ) : <p className="crafting-help">{getTimingIssues(input).join(" ")}</p>}
    </section>
  );
};
