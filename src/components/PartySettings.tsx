import { partyLimits } from "../data/party";
import { clampPartyCount, partySetup } from "../lib/party";

type Props = {
  playerCount: number;
  stationCount: number;
  onPlayerCountChange: (value: number) => void;
  onStationCountChange: (value: number) => void;
};

const CountControl = ({ label, value, maximum, onChange }: {
  label: string; value: number; maximum: number; onChange: (value: number) => void;
}) => (
  <div className="settings-stack">
    <label className="input-field">
      <span className="field-label">{label}</span>
      <span className="input-shell">
        <input
          aria-label={label}
          max={maximum}
          min="1"
          onChange={(event) => onChange(clampPartyCount(Number(event.target.value), maximum))}
          step="1"
          type="number"
          value={value}
        />
      </span>
    </label>
    <div className="range-row">
      <span>1</span>
      <input
        aria-label={`${label} slider`}
        max={maximum}
        min="1"
        onChange={(event) => onChange(Number(event.target.value))}
        step="1"
        type="range"
        value={value}
      />
      <span>{maximum}</span>
    </div>
  </div>
);

export const PartySettings = (props: Props) => {
  const party = partySetup(props);
  const stationRange = party.minStationsPerCrafter === party.maxStationsPerCrafter
    ? String(party.minStationsPerCrafter)
    : `${party.minStationsPerCrafter}–${party.maxStationsPerCrafter}`;
  return (
    <fieldset className="buff-fieldset settings-stack">
      <legend className="field-label">Party & active stations</legend>
      <div className="split-fields">
        <CountControl label="Players in party" value={props.playerCount} maximum={partyLimits.players} onChange={props.onPlayerCountChange} />
        <CountControl label="Active crafting stations" value={props.stationCount} maximum={partyLimits.stations} onChange={props.onStationCountChange} />
      </div>
      <p className="crafting-help" aria-live="polite">
        {party.craftingPlayers} crafting · {party.sharingPlayers} shared XP only · {stationRange} {party.maxStationsPerCrafter === 1 ? "station" : "stations"} per crafter.
        <br />Stations are assigned evenly. Everyone stays in tribe XP range; the plan runs until every player reaches the target.
      </p>
    </fieldset>
  );
};
