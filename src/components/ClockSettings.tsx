import { clockModes } from "../data/crafting";
import type { CalculatorInput } from "../types/calculator";
import type { ClockMode } from "../types/crafting";
import { Icon } from "./Icon";

type Props = {
  input: CalculatorInput;
  onChange: (enabled: boolean, mode: ClockMode | "") => void;
};

export const ClockSettings = ({ input, onChange }: Props) => (
  <fieldset className="buff-fieldset settings-stack">
    <legend className="field-label">Clockface crafting speed</legend>
    <label className={`buff-option ${input.clockEnabled ? "selected" : ""}`}>
      <input checked={input.clockEnabled} onChange={(event) => onChange(event.target.checked, input.clockMode)} type="checkbox" />
      <span className="buff-check">{input.clockEnabled && <Icon name="check" size={14} />}</span>
      <span><strong>Enable Clockface boost</strong><small>Apply the active clock mode to this party's stations.</small></span>
    </label>
    {input.clockEnabled && (
      <label className="input-field">
        <span className="field-label">Clockface boost mode</span>
        <span className="input-shell select-shell">
          <select onChange={(event) => onChange(true, event.target.value as ClockMode | "")} value={input.clockMode}>
            <option value="">Select clock mode</option>
            {clockModes.map(({ id, label, bonusPercent }) => (
              <option key={id} value={id}>{label} · +{bonusPercent}% ({1 + bonusPercent / 100}× speed)</option>
            ))}
          </select>
        </span>
        <small className="crafting-help">Assumes every crafter's station remains under the selected boost for this estimate.</small>
      </label>
    )}
  </fieldset>
);
