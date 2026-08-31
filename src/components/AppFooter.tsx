type Source = {
  checkedAt: string;
  experienceUrl: string;
  levelingUrl: string;
  licenseName: string;
  licenseUrl: string;
};

type Props = {
  source: Source;
};

export const AppFooter = ({ source }: Props) => (
  <footer className="app-footer">
    <div>
      <strong>Data & privacy</strong>
      <p>Calculator inputs stay on this device. No account, analytics, tracking, or backend service is used.</p>
    </div>
    <div>
      <strong>Sources checked {source.checkedAt}</strong>
      <p>
        <a href={source.experienceUrl} rel="noreferrer" target="_blank">Crafting experience</a>
        <span> · </span>
        <a href={source.levelingUrl} rel="noreferrer" target="_blank">Level XP and boosts</a>
      </p>
      <p>Wiki data adapted under <a href={source.licenseUrl} rel="noreferrer" target="_blank">{source.licenseName}</a>.</p>
    </div>
    <p className="disclaimer">Unofficial fan-made calculator. Not affiliated with Studio Wildcard, Snail Games, or the ARK Official Community Wiki.</p>
  </footer>
);
