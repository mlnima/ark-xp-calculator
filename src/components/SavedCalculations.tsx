import type { SavedCalculation } from "../types/calculator";

type Props = {
  calculations: SavedCalculation[];
  activeId: string;
  calculationName: string;
  canSave: boolean;
  onCalculationNameChange: (value: string) => void;
  onLoad: (id: string) => void;
  onSaveNew: () => void;
  onUpdate: () => void;
};

export const SavedCalculations = ({
  calculations,
  activeId,
  calculationName,
  canSave,
  onCalculationNameChange,
  onLoad,
  onSaveNew,
  onUpdate,
}: Props) => {
  const named = Boolean(calculationName.trim());
  return (
    <section className="saved-panel" aria-labelledby="saved-title">
      <div className="saved-heading">
        <div>
          <span className="eyebrow">Local plans</span>
          <h2 id="saved-title">Saved calculations</h2>
          <p>Your current form is remembered automatically on this device.</p>
        </div>
        <div className="saved-actions">
          <label className="input-shell">
            <input
              aria-label="Calculation name"
              onChange={(event) => onCalculationNameChange(event.target.value)}
              placeholder="Calculation name"
              type="text"
              value={calculationName}
            />
          </label>
          <button disabled={!canSave || !named} onClick={onSaveNew} type="button">Save new</button>
          <button disabled={!canSave || !named || !activeId} onClick={onUpdate} type="button">Update loaded</button>
        </div>
      </div>
      <div className="saved-list">
        {calculations.map((calculation) => (
          <button
            aria-pressed={calculation.id === activeId}
            key={calculation.id}
            onClick={() => onLoad(calculation.id)}
            type="button"
          >
            <strong>{calculation.name}</strong>
            <span>{calculation.input.item?.name || "No item selected"}</span>
            <small>Level {calculation.input.currentLevel || "—"} → {calculation.input.targetLevel || "—"}</small>
          </button>
        ))}
        {!calculations.length && <p>No saved calculations yet.</p>}
      </div>
    </section>
  );
};
