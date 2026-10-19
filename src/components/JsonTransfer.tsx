import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

type Props = { onExport: () => string; onImport: (text: string) => void };

export const JsonTransfer = ({ onExport, onImport }: Props) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [reading, setReading] = useState(false);
  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([onExport()], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "ark-crafting-xp.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setFailed(false);
    setMessage("Exported the current setup and all saved calculations.");
  };
  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const element = event.currentTarget;
    const file = element.files?.[0];
    if (!file) return;
    setMessage("");
    setReading(true);
    try {
      onImport(await file.text());
      setFailed(false);
      setMessage("Imported the current setup and added saved calculations. Existing saved calculations were kept.");
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "The file could not be imported.");
    } finally {
      setReading(false);
      element.value = "";
    }
  };
  return (
    <div className="json-transfer">
      <div className="json-actions">
        <button onClick={exportJson} type="button">Export JSON</button>
        <button disabled={reading} onClick={() => fileInput.current?.click()} type="button">{reading ? "Reading JSON…" : "Import JSON"}</button>
        <input accept=".json,application/json" aria-label="Import calculator JSON" hidden onChange={importJson} ref={fileInput} type="file" />
      </div>
      <p>Export includes player names and levels, all settings, the current draft, and saved plans. Import restores the draft and keeps existing saved plans.</p>
      {message && <p role={failed ? "alert" : "status"}>{message}</p>}
    </div>
  );
};
