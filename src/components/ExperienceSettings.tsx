import { buffs } from "../data/buffs";
import type { BuffId } from "../types/calculator";
import { Icon } from "./Icon";
import { PartySettings } from "./PartySettings";

type Props = {
  serverRate: string;
  playerCount: number;
  stationCount: number;
  selectedBuffs: BuffId[];
  tribeTowerBonus: string;
  onServerRateChange: (value: string) => void;
  onPlayerCountChange: (value: number) => void;
  onStationCountChange: (value: number) => void;
  onBuffChange: (id: BuffId) => void;
  onTribeTowerBonusChange: (value: string) => void;
};

export const ExperienceSettings = ({
  serverRate,
  playerCount,
  stationCount,
  selectedBuffs,
  tribeTowerBonus,
  onServerRateChange,
  onPlayerCountChange,
  onStationCountChange,
  onBuffChange,
  onTribeTowerBonusChange,
}: Props) => (
  <div className="settings-stack">
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
    <PartySettings
      playerCount={playerCount}
      stationCount={stationCount}
      onPlayerCountChange={onPlayerCountChange}
      onStationCountChange={onStationCountChange}
    />
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
