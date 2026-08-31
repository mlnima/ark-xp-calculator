import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type Props = {
  number: string;
  icon: IconName;
  title: string;
  description: string;
  children: ReactNode;
};

export const StepCard = ({ number, icon, title, description, children }: Props) => (
  <section className="step-card">
    <div className="step-heading">
      <div className="step-icon"><Icon name={icon} /></div>
      <div>
        <span className="eyebrow">Step {number}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
    <div className="step-body">{children}</div>
  </section>
);
