import { getTimingIssues } from "../lib/crafting";
import { clockSpeed } from "../lib/blueprint";
import { clockModes } from "../data/crafting";
import { formatDuration, formatNumber } from "../lib/format";
import type { CalculationResult, CalculatorInput } from "../types/calculator";

type Props = { input: CalculatorInput; result: CalculationResult };

export const CraftingResults = ({ input, result }: Props) => {
  const timing = result.timing;
  return (
    <section className="crafting-results resource-results" aria-label="Crafting time">
      <span className="eyebrow">Crafting time</span>
      <h3>Estimated party time</h3>
      {timing ? (
        <>
          <strong className="party-duration">{formatDuration(timing.partySeconds)}</strong>
          <p className="crafting-help">
            Time until every player reaches the target · {input.stationCount} parallel{" "}
            {input.stationCount === 1 ? "station" : "stations"}
            <br />
            {formatNumber(result.craftsPerStation)} crafts per station ·{" "}
            {formatDuration(timing.secondsPerCraft)} per craft
            {input.clockEnabled && (
              <>
                <br />
                Clockface: {clockModes.find(({ id }) => id === input.clockMode)?.label} ·{" "}
                {clockSpeed(input)}× speed
              </>
            )}
          </p>
          <div className="station-comparison" aria-label="Station time comparison">
            {timing.stations.map((station) => (
              <div
                className={station.id === input.stationId ? "station-selected" : ""}
                key={station.id}
              >
                <strong>
                  {station.label}
                  {station.id === input.stationId ? " · selected" : ""}
                </strong>
                <span>{formatDuration(station.partySeconds)} for the party</span>
                <small>{formatDuration(station.secondsPerCraft)} per craft</small>
              </div>
            ))}
          </div>
          {input.clockEnabled && (
            <p className="crafting-help">
              Clock speed applies throughout this estimate. Retarget the clock when comparing
              another station type.
            </p>
          )}
          <p className="crafting-help">
            Everyone starts together with their own levels and the same blueprint and boosts. All
            active stations run in parallel. Quality, XP rate, and boosts affect the crafts needed;
            station speed sets the craft time. Gathering, loading, pauses, and{" "}
            {input.grinding
              ? "grinding/transfer time are excluded; every recraft is included."
              : "fuel are excluded."}
          </p>
        </>
      ) : (
        <p className="crafting-help">{getTimingIssues(input).join(" ")}</p>
      )}
    </section>
  );
};
