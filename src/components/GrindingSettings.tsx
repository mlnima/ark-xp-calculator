import { grindingRules } from "../data/grinding";
import { Icon } from "./Icon";

type Props = {
  grinding: boolean;
  recycler: boolean;
  onGrindingChange: (checked: boolean) => void;
  onRecyclerChange: (checked: boolean) => void;
};

export const GrindingSettings = ({
  grinding,
  recycler,
  onGrindingChange,
  onRecyclerChange,
}: Props) => (
  <fieldset className="buff-fieldset grinding-settings">
    <legend className="field-label">Grind & recraft</legend>
    <label className={`buff-option ${grinding ? "selected" : ""}`}>
      <input
        checked={grinding}
        onChange={(event) => onGrindingChange(event.target.checked)}
        type="checkbox"
      />
      <span className="buff-check">{grinding && <Icon name="check" size={14} />}</span>
      <span>
        <strong>Grind crafted items</strong>
        <small>Recover {grindingRules.returnPercent}% of each ingredient, rounded up per item.</small>
      </span>
    </label>
    {grinding && (
      <div className="recycler-option">
        <label className={`buff-option ${recycler ? "selected" : ""}`}>
          <input
            checked={recycler}
            onChange={(event) => onRecyclerChange(event.target.checked)}
            type="checkbox"
          />
          <span className="buff-check">{recycler && <Icon name="check" size={14} />}</span>
          <span>
            <strong>Recycler skill</strong>
            <small>Max rank: {grindingRules.recyclerBonusPercent}% more recovered resources.</small>
          </span>
        </label>
      </div>
    )}
    <p className="grinding-note">
      Assumes an uncapped grinder and recyclable items and ingredients. Reuse refunds between
      crafting rounds. Polymer returns as Organic Polymer; grinder fuel is not included.
    </p>
  </fieldset>
);
