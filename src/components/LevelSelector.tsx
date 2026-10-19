import { formatNumber } from "../lib/format";
import type { LevelEntry } from "../types/calculator";

type Props = {
  levels: LevelEntry[];
  currentLevel: string;
  targetLevel: string;
  onCurrentChange: (value: string) => void;
  onTargetChange: (value: string) => void;
  playerLabel: string;
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
  playerLabel,
}: Props) => (
  <div className="settings-stack">
    <div className="split-fields">
      <label className="input-field">
        <span className="field-label">Current level</span>
        <span className="input-shell select-shell">
          <select aria-label={`Current level for ${playerLabel}`} value={currentLevel} onChange={(event) => onCurrentChange(event.target.value)}>
            <LevelOptions levels={levels} />
          </select>
        </span>
      </label>
      <label className="input-field">
        <span className="field-label">Target level</span>
        <span className="input-shell select-shell">
          <select aria-label={`Target level for ${playerLabel}`} value={targetLevel} onChange={(event) => onTargetChange(event.target.value)}>
            <LevelOptions levels={levels} />
          </select>
        </span>
      </label>
    </div>
  </div>
);
