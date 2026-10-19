import { craftingCheckedAt, craftingStations } from "../data/crafting";
import { baseCraftSeconds, recipeForInput, stationsForInput } from "../lib/crafting";
import { formatDuration } from "../lib/format";
import type { CalculatorInput } from "../types/calculator";
import type { ClockMode, StationId } from "../types/crafting";
import { ClockSettings } from "./ClockSettings";
import { Icon } from "./Icon";

type Props = {
  input: CalculatorInput;
  onStationChange: (value: StationId) => void;
  onCraftSecondsChange: (value: string) => void;
  onClockChange: (enabled: boolean, mode: ClockMode | "") => void;
};

export const CraftingSettings = ({ input, onStationChange, onCraftSecondsChange, onClockChange }: Props) => {
  const recipe = recipeForInput(input);
  const available = stationsForInput(input);
  const seconds = baseCraftSeconds(input);
  return (
    <div className="crafting-settings settings-stack">
      <label className="input-field">
        <span className="field-label">Crafting station type</span>
        <span className="input-shell select-shell">
          <select
            onChange={(event) => onStationChange(event.target.value as StationId)}
            value={input.stationId}
          >
            {craftingStations.map(({ id, label, speed }) => (
              <option key={id} value={id}>
                {label} · {speed}× speed{seconds ? ` · ${formatDuration(seconds / speed)} / craft` : ""}
              </option>
            ))}
          </select>
        </span>
      </label>
      {input.item && (
        <label className="input-field">
          <span className="field-label">Craft time per item (seconds)</span>
          <span className="input-shell suffix-shell">
            <input
              inputMode="decimal"
              min="0"
              onChange={(event) => onCraftSecondsChange(event.target.value)}
              placeholder="Enter the time at the selected station"
              step="any"
              type="number"
              value={input.craftSeconds}
            />
            <span>s</span>
          </span>
          <small className="crafting-help">Includes station speed and the selected clock boost. Edit to match your blueprint or server.</small>
        </label>
      )}
      <ClockSettings input={input} onChange={onClockChange} />
      <div className="inline-note">
        <Icon name="info" size={17} />
        <span>
          {input.item && !available.some(({ id }) => id === input.stationId)
            ? `This recipe lists ${recipe?.stations.join(", ") || "no verified stations"}. Select a compatible station for time and supply totals.`
            : "Smithy: 1× speed. Tek Replicator: 12× speed for normal recipes. Set how many stations run in the party section."}
          {recipe?.sourceUrl && <> <a href={recipe.timeSourceUrl || recipe.sourceUrl} rel="noreferrer" target="_blank">Crafting time source</a> · checked {craftingCheckedAt}.</>}
        </span>
      </div>
    </div>
  );
};
