import { memo } from "react";
import type { CalculatorInput, LevelEntry, PartyPlayer } from "../types/calculator";
import { LevelSelector } from "./LevelSelector";

type RowProps = {
  player: PartyPlayer;
  index: number;
  stations: number;
  levels: LevelEntry[];
  onChange: (index: number, changes: Partial<PartyPlayer>) => void;
};

const PlayerRow = memo(({ player, index, stations, levels, onChange }: RowProps) => {
  const label = `Player ${index + 1}`;
  return (
    <fieldset className="player-level-row settings-stack" aria-label={label}>
      <legend>{label} · {stations ? `${stations} ${stations === 1 ? "station" : "stations"}` : "Shared XP only"}</legend>
      <label className="input-field">
        <span className="field-label">Player name</span>
        <span className="input-shell">
          <input aria-label={`Name for ${label}`} type="text" value={player.name} onChange={(event) => onChange(index, { name: event.target.value })} />
        </span>
      </label>
      <LevelSelector
        currentLevel={player.currentLevel}
        targetLevel={player.targetLevel}
        levels={levels}
        playerLabel={label}
        onCurrentChange={(currentLevel) => onChange(index, { currentLevel })}
        onTargetChange={(targetLevel) => onChange(index, { targetLevel })}
      />
    </fieldset>
  );
});

type Props = {
  input: CalculatorInput;
  levels: LevelEntry[];
  onChange: RowProps["onChange"];
};

export const PlayerLevels = ({ input, levels, onChange }: Props) => (
  <div className="settings-stack">
    <p className="crafting-help">New players copy Player 1's current and target levels. Existing player details stay unchanged. Hidden rows return when you increase the party size again.</p>
    <div className="player-level-list" role="region" aria-label="Player levels" tabIndex={0}>
      {input.players.slice(0, input.playerCount).map((player, index) => (
        <PlayerRow
          key={index}
          player={player}
          index={index}
          levels={levels}
          onChange={onChange}
          stations={Math.floor(input.stationCount / input.playerCount) + Number(index < input.stationCount % input.playerCount)}
        />
      ))}
    </div>
    <p className="crafting-help">XP starts at the beginning of each selected current level. All players use the same blueprint, server rate, and selected boosts.</p>
  </div>
);
