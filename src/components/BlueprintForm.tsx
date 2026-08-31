import type { ResourceInput } from "../types/calculator";

type Props = {
  itemSelected: boolean;
  resources: ResourceInput[];
  onQuantityChange: (id: string, value: string) => void;
};

export const BlueprintForm = ({ itemSelected, resources, onQuantityChange }: Props) => (
  <div className="settings-stack">
    <div className="resource-heading">
      <div>
        <span className="field-label">Crafting requirements</span>
        <p>Resource types come from the selected item. Enter each amount shown on your blueprint.</p>
      </div>
    </div>
    <div className="resource-list">
      {resources.map((resource, index) => (
        <div className="resource-row" key={resource.id}>
          <span className="resource-index">{index + 1}</span>
          <div className="resource-name">
            <span>Resource</span>
            <strong>{resource.name}</strong>
          </div>
          <label className="quantity-input">
            <span>Per craft</span>
            <input
              aria-label={`${resource.name} quantity per craft`}
              inputMode="decimal"
              min="0.01"
              onChange={(event) => onQuantityChange(resource.id, event.target.value)}
              placeholder="Amount"
              step="0.01"
              type="number"
              value={resource.quantity}
            />
          </label>
        </div>
      ))}
      {!itemSelected && <div className="no-resources">Select a crafting item to load its resource types.</div>}
      {itemSelected && !resources.length && (
        <div className="no-resources">The wiki does not list crafting resources for this item.</div>
      )}
    </div>
  </div>
);
