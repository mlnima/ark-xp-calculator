import { useMemo, useRef, useState } from "react";
import { formatNumber } from "../lib/format";
import type { CraftingItem } from "../types/calculator";
import { Icon } from "./Icon";

type Props = {
  items: CraftingItem[];
  selected: CraftingItem | null;
  onSelect: (item: CraftingItem) => void;
};

const rowHeight = 68;
const viewportHeight = 408;
const overscan = 4;

export const ItemPicker = ({ items, selected, onSelect }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return normalized
      ? items.filter(({ name }) => name.toLocaleLowerCase().includes(normalized))
      : items;
  }, [items, query]);
  const first = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const count = Math.ceil(viewportHeight / rowHeight) + overscan * 2;
  const visible = filtered.slice(first, first + count);
  const close = () => {
    setOpen(false);
    setQuery("");
    setScrollTop(0);
  };
  const choose = (item: CraftingItem) => {
    onSelect(item);
    close();
  };
  const updateQuery = (value: string) => {
    setQuery(value);
    setScrollTop(0);
    if (listRef.current) listRef.current.scrollTop = 0;
  };

  return (
    <>
      <label className="field-label" id="item-picker-label">Crafting item</label>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-labelledby="item-picker-label"
        className={`picker-trigger ${selected ? "has-value" : ""}`}
        onClick={() => setOpen(true)}
        type="button"
      >
        <span className="empty-icon"><Icon name="item" /></span>
        <span className="picker-copy">
          <span>{selected?.name || "Choose an item"}</span>
          <small>{selected ? `${formatNumber(selected.experience)} base crafting XP` : `${items.length} wiki items available`}</small>
        </span>
        <Icon name="search" />
      </button>
      {open && (
        <div className="modal-backdrop" onMouseDown={close}>
          <div
            aria-labelledby="item-dialog-title"
            aria-modal="true"
            className="picker-dialog"
            onKeyDown={(event) => event.key === "Escape" && close()}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="dialog-heading">
              <div>
                <span className="eyebrow">Experience for item crafting</span>
                <h2 id="item-dialog-title">Select an item</h2>
              </div>
              <button aria-label="Close item picker" className="icon-button" onClick={close} type="button">
                <Icon name="close" />
              </button>
            </div>
            <div className="search-field">
              <Icon name="search" />
              <input
                autoFocus
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="Search by item name"
                type="search"
                value={query}
              />
              <span>{filtered.length}</span>
            </div>
            <div
              aria-label="Crafting items"
              className="virtual-list"
              onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
              ref={listRef}
              role="listbox"
            >
              {filtered.length ? (
                <div className="virtual-space" style={{ height: filtered.length * rowHeight }}>
                  {visible.map((item, index) => (
                    <button
                      aria-selected={selected?.name === item.name}
                      className="item-option"
                      key={`${item.name}-${first + index}`}
                      onClick={() => choose(item)}
                      role="option"
                      style={{ transform: `translateY(${(first + index) * rowHeight}px)` }}
                      type="button"
                    >
                      <span>{item.name}</span>
                      <small>{formatNumber(item.experience)} XP</small>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="no-results">No crafting item matches “{query}”.</div>
              )}
            </div>
            <p className="dialog-footnote">Item names and crafting XP are sourced from the ARK Official Community Wiki.</p>
          </div>
        </div>
      )}
    </>
  );
};
