import { craftingCheckedAt, craftingStations } from "../data/crafting";
import { baseCraftSeconds, recipeForInput, stationsForInput } from "../lib/crafting";
import { formatDuration } from "../lib/format";
import type { CalculatorInput } from "../types/calculator";
import type { StationId } from "../types/crafting";
import { Icon } from "./Icon";

type Props = {
  input: CalculatorInput;
  onStationChange: (value: StationId | "") => void;
  onCraftSecondsChange: (value: string) => void;
};

export const CraftingSettings = ({ input, onStationChange, onCraftSecondsChange }: Props) => {
  const recipe = recipeForInput(input);
  const available = stationsForInput(input);
  const seconds = baseCraftSeconds(input);
  return (
    <div className="crafting-settings settings-stack">
      <label className="input-field">
        <span className="field-label">Crafting station per player</span>
        <span className="input-shell select-shell">
          <select
            disabled={!input.item || !available.length}
            onChange={(event) => onStationChange(event.target.value as StationId | "")}
            value={input.stationId}
          >
            <option value="">Select station</option>
            {craftingStations.map(({ id, label, speed }) => (
              <option disabled={!available.some((station) => station.id === id)} key={id} value={id}>
                {label} · {speed}× speed{seconds ? ` · ${formatDuration(seconds / speed)} / craft` : ""}
              </option>
            ))}
          </select>
        </span>
      </label>
      {Boolean(available.length) && (
        <label className="input-field">
          <span className="field-label">Base craft time (seconds){recipe?.baseSeconds ? " · optional override" : ""}</span>
          <span className="input-shell suffix-shell">
            <input
              inputMode="decimal"
              min="0.01"
              onChange={(event) => onCraftSecondsChange(event.target.value)}
              placeholder={recipe?.baseSeconds ? `Wiki: ${recipe.baseSeconds} seconds` : "Enter your blueprint's base time"}
              step="any"
              type="number"
              value={input.craftSeconds}
            />
            <span>s</span>
          </span>
          <small className="crafting-help">Before station speed. Use your blueprint's actual time if it differs from the wiki.</small>
        </label>
      )}
      <div className="inline-note">
        <Icon name="info" size={17} />
        <span>
          {input.item && !available.length
            ? `This recipe lists ${recipe?.stations.join(", ") || "no verified stations"}. Smithy/Tek Replicator timing is unavailable.`
            : "Smithy: 1× speed. Tek Replicator: 12× speed for normal recipes. Each player uses a separate station."}
          {input.item && <> <a href={`https://ark.wiki.gg/wiki/${encodeURIComponent(input.item.name.replace(/ /g, "_"))}`} rel="noreferrer" target="_blank">Recipe source</a> · checked {craftingCheckedAt}.</>}
        </span>
      </div>
    </div>
  );
};
