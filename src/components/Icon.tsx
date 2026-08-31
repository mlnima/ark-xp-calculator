import type { ReactNode } from "react";

export type IconName =
  | "spark"
  | "item"
  | "levels"
  | "boost"
  | "blueprint"
  | "users"
  | "search"
  | "close"
  | "plus"
  | "trash"
  | "check"
  | "cube"
  | "info";

type Props = {
  name: IconName;
  size?: number;
};

const paths: Record<IconName, ReactNode> = {
  spark: <path d="m12 2 1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2Zm7 13 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />,
  item: <><path d="M12 3 4.5 7v10L12 21l7.5-4V7L12 3Z" /><path d="m4.5 7 7.5 4 7.5-4M12 11v10" /></>,
  levels: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /><path d="m17 6 2-2 2 2" /></>,
  boost: <><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></>,
  blueprint: <><path d="M6 3h9l3 3v15H6V3Z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  cube: <><path d="m12 2 8 4.5v11L12 22l-8-4.5v-11L12 2Z" /><path d="m4 6.5 8 4.5 8-4.5M12 11v11" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
};

export const Icon = ({ name, size = 20 }: Props) => (
  <svg
    aria-hidden="true"
    className="icon"
    fill="none"
    height={size}
    viewBox="0 0 24 24"
    width={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.8"
  >
    {paths[name]}
  </svg>
);
