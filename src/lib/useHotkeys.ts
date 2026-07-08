import { useEffect } from "react";

type Handler = (e: KeyboardEvent) => void;

function isTyping(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    el.isContentEditable
  );
}

/**
 * Register global keyboard shortcuts.
 *
 * Keys in `map` are matched against `event.key`. Single-character keys are
 * ignored while the user is typing in a field; combos (with meta/ctrl) and
 * Escape always fire so "save" and "close" work from inside forms.
 */
export function useHotkeys(map: Record<string, Handler>, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const combo = e.metaKey || e.ctrlKey;
      const key = e.key;
      const id = `${combo ? "mod+" : ""}${key.toLowerCase()}`;
      const handler = map[id] ?? map[key];
      if (!handler) return;
      const alwaysAllowed = combo || key === "Escape";
      if (!alwaysAllowed && isTyping(e.target)) return;
      handler(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [map, enabled]);
}
