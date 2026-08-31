import { qualities } from "../data/qualities";
import type { QualityId } from "../types/calculator";
import { Icon } from "./Icon";

type Props = {
  selected: QualityId | "";
  onChange: (quality: QualityId) => void;
};

export const QualityPicker = ({ selected, onChange }: Props) => (
  <fieldset className="quality-fieldset">
    <legend className="field-label">Blueprint quality</legend>
    <div className="quality-grid">
      {qualities.map((quality) => (
        <button
          aria-pressed={selected === quality.id}
          className={`quality-option quality-${quality.id}`}
          key={quality.id}
          onClick={() => onChange(quality.id)}
          type="button"
        >
          <span className="quality-dot" />
          <span>{quality.label}</span>
          <strong>{quality.multiplier}×</strong>
          {selected === quality.id && <Icon name="check" size={16} />}
        </button>
      ))}
    </div>
  </fieldset>
);
