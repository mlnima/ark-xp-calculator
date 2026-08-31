import { appMeta } from "../data/app-meta";
import { Icon } from "./Icon";

type Props = {
  itemCount: number;
};

export const AppHeader = ({ itemCount }: Props) => (
  <header className="app-header">
    <div className="header-inner">
      <div className="brand-lockup">
        <span className="brand-mark"><Icon name="spark" size={24} /></span>
        <span>
          <strong>{appMeta.name}</strong>
          <small>{appMeta.subtitle}</small>
        </span>
      </div>
      <div className="header-badges">
        <span><i /> Local calculation</span>
        <span>{itemCount} items</span>
      </div>
    </div>
  </header>
);
