import { buffs } from "../data/buffs";
import type { BuffId } from "../types/calculator";
import { Icon } from "./Icon";

type Props = {
  serverRate: string;
  playerCount: number;
  selectedBuffs: BuffId[];
  tribeTowerBonus: string;
  onServerRateChange: (value: string) => void;
  onPlayerCountChange: (value: number) => void;
  onBuffChange: (id: BuffId) => void;
  onTribeTowerBonusChange: (value: string) => void;
};

const clampPlayers = (value: number) => Math.min(70, Math.max(1, Number.isFinite(value) ? value : 1));

export const ExperienceSettings = ({
  serverRate,
  playerCount,
  selectedBuffs,
  tribeTowerBonus,
  onServerRateChange,
  onPlayerCountChange,
  onBuffChange,
  onTribeTowerBonusChange,
}: Props) => (
  <div className="settings-stack">
    <div className="split-fields">
      <label className="input-field">
        <span className="field-label">Server XP rate</span>
        <span className="input-shell suffix-shell">
          <input
            inputMode="decimal"
            min="0.01"
            onChange={(event) => onServerRateChange(event.target.value)}
            placeholder="1"
            step="0.01"
            type="number"
            value={serverRate}
          />
          <span>×</span>
        </span>
      </label>
      <label className="input-field">
        <span className="field-label">Players crafting together</span>
        <span className="input-shell player-shell">
          <Icon name="users" />
          <input
            aria-label="Number of crafting players"
            max="70"
            min="1"
            onChange={(event) => onPlayerCountChange(clampPlayers(Number(event.target.value)))}
            type="number"
            value={playerCount}
          />
          <small>{playerCount === 1 ? "Solo" : "Tribe"}</small>
        </span>
      </label>
    </div>
    <div className="range-row">
      <span>1</span>
      <input
        aria-label="Crafting players slider"
        max="70"
        min="1"
        onChange={(event) => onPlayerCountChange(Number(event.target.value))}
        type="range"
        value={playerCount}
      />
      <span>70</span>
    </div>
    <fieldset className="buff-fieldset">
      <legend className="field-label">Active experience boosts</legend>
      <div className="buff-grid">
        {buffs.map((buff) => {
          const selected = selectedBuffs.includes(buff.id);
          return (
            <label className={`buff-option ${selected ? "selected" : ""}`} key={buff.id}>
              <input checked={selected} onChange={() => onBuffChange(buff.id)} type="checkbox" />
              <span className="buff-check">{selected && <Icon name="check" size={14} />}</span>
              <span>
                <strong>{buff.label}</strong>
                <small>{buff.detail}</small>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
    {selectedBuffs.includes("tower") && (
      <label className="input-field tower-bonus-field">
        <span className="field-label">Active Tribe Tower XP bonus</span>
        <span className="input-shell suffix-shell">
          <input
            inputMode="decimal"
            min="0.01"
            onChange={(event) => onTribeTowerBonusChange(event.target.value)}
            placeholder="Enter the active percentage"
            step="0.01"
            type="number"
            value={tribeTowerBonus}
          />
          <span>%</span>
        </span>
      </label>
    )}
    <div className="inline-note">
      <Icon name="info" size={17} />
      <span>Active effects multiply. A 2× note and 4× special note combine to 8× XP.</span>
    </div>
  </div>
);
