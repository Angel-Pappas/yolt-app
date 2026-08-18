"use client";

import { useState, type ReactNode } from "react";

export type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
};

/**
 * A reusable sub-tab strip: an underline tab bar plus the active panel. Content
 * for every tab is passed in already-rendered (server components are fine — they
 * arrive as elements); only the active tab's content is mounted, so switching
 * tabs mounts/unmounts panels. `defaultTab` picks the initially-active tab and
 * falls back to the first.
 *
 * Generic and self-contained — drop it into any page that needs sub-tabs (the
 * lead edit page uses it for History / Contacts), not a leads-specific thing.
 */
export function Tabs({
  tabs,
  defaultTab,
}: {
  tabs: TabItem[];
  defaultTab?: string;
}) {
  const [activeId, setActiveId] = useState(defaultTab ?? tabs[0]?.id);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 border-b border-edge" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === active?.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(tab.id)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-accent text-accent"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div>{active?.content}</div>
    </div>
  );
}
