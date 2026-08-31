import { formatNumber } from "../lib/format";
import type { LevelEntry } from "../types/calculator";
import { Icon } from "./Icon";

type Props = {
  levels: LevelEntry[];
  currentLevel: string;
  targetLevel: string;
  onCurrentChange: (value: string) => void;
  onTargetChange: (value: string) => void;
};

const LevelOptions = ({ levels }: { levels: LevelEntry[] }) => (
  <>
    <option value="">Select level</option>
    {levels.map(({ level, totalXp }) => (
      <option key={level} value={level}>Level {level} · {formatNumber(totalXp)} total XP</option>
    ))}
  </>
);

export const LevelSelector = ({
  levels,
  currentLevel,
  targetLevel,
  onCurrentChange,
  onTargetChange,
}: Props) => (
  <div className="settings-stack">
    <div className="level-track" aria-hidden="true"><span /><i /><span /></div>
    <div className="split-fields">
      <label className="input-field">
        <span className="field-label">Current level</span>
        <span className="input-shell select-shell">
          <select value={currentLevel} onChange={(event) => onCurrentChange(event.target.value)}>
            <LevelOptions levels={levels} />
          </select>
        </span>
      </label>
      <label className="input-field">
        <span className="field-label">Target level</span>
        <span className="input-shell select-shell">
          <select value={targetLevel} onChange={(event) => onTargetChange(event.target.value)}>
            <LevelOptions levels={levels} />
          </select>
        </span>
      </label>
    </div>
    <div className="inline-note">
      <Icon name="info" size={17} />
      <span>Calculation starts at the beginning of the selected current level. Levels above 220 reuse the level 219 to 220 XP requirement.</span>
    </div>
  </div>
);
