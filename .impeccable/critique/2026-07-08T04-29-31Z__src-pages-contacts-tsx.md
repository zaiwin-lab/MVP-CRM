---
target: Contacts + core app shell
total_score: 23
p0_count: 0
p1_count: 3
timestamp: 2026-07-08T04-29-31Z
slug: src-pages-contacts-tsx
---
# Critique — KOBIS Connect (Contacts + core app shell)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Save/delete succeed silently; modal just closes, no toast/confirmation |
| 2 | Match System / Real World | 3 | Plain language ("Follow-ups", "Leads") reads well |
| 3 | User Control and Freedom | 2 | Modals have Esc/Cancel, but delete uses native window.confirm, no undo |
| 4 | Consistency and Standards | 3 | Consistent buttons/cards/modals; quirky unicode-glyph icons weaken it |
| 5 | Error Prevention | 2 | Hard delete of shared data; no duplicate detection |
| 6 | Recognition Rather Than Recall | 3 | Nav + fields labeled; discoverable |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts at all — contradicts the "sharp/efficient" brief |
| 8 | Aesthetic and Minimalist Design | 3 | Clean, but gradient CTA banner + stat-tile row add rejected "startup" noise |
| 9 | Error Recovery | 2 | Login errors shown; data-layer rejections uncaught (blank-screen risk) |
| 10 | Help and Documentation | 2 | Empty states teach lightly; nothing else |
| **Total** | | **23/40** | **Acceptable — solid bones, generic skin, missing the brief's efficiency** |

## Anti-Patterns Verdict

Partially reads as AI-default admin. Tells: Inter (detector-flagged), stock slate-50 + blue-600
palette, uniform white cards on one shadow. Two patterns the user explicitly rejected are present:
the **gradient CTA banner** and the **stat-tile row** (big-number/small-label) — both "flashy startup
demo" cues. Deterministic scan: 1 real finding (overused-font: Inter); 3 gray-on-color hits are
false positives (button hover states in the CSS component layer).

## What's Working

- Clean, consistent component system (buttons, modals, badges) — real foundation to build on.
- Plain, human microcopy in empty states ("Add your first contact").
- Status badges carry text labels, not color alone (good a11y instinct).

## Priority Issues

- **[P1] No keyboard efficiency.** Heuristic 7 = 1. The core brief is "sharp, efficient, keyboard-
  friendly power tool," but there are zero shortcuts: no quick-search focus, no quick-add, no
  Enter-to-save. Fix: "/" or Cmd/Ctrl+K to focus search, "n" / Cmd+Enter to add/save, Esc to close.
- **[P1] Generic identity + two rejected patterns.** Inter + slate/blue stock look; gradient banner
  and stat-tile row violate "not a flashy startup demo." Fix: font with character, subtly warmed
  neutral palette (brief: "not sterile"), remove the gradient banner, restyle metrics as calm inline
  figures.
- **[P1] Silent success.** Heuristic 1 = 2. On shared data, saves/deletes must confirm. Fix: a small
  toast on create/update/delete (with Undo on delete).
- **[P2] Destructive delete via window.confirm, no undo.** Jarring native dialog + irreversible on
  shared data. Fix: inline confirm or undo-toast pattern.
- **[P2] Unhandled data errors.** Page loaders/mutations can reject (network/Supabase) with no
  try/catch, risking a blank screen. Fix: error states + guarded async.

## Persona Red Flags

- **Alex (power user):** no shortcuts, no bulk select; every add is a mouse trip to a button + modal.
  The brief's primary "sharp/efficient" persona is underserved.
- **Sam (a11y):** dashboard "due" dot is color-only; a few slate-400 meta texts risk < 4.5:1 contrast;
  focus rings exist. Verify contrast, pair the dot with a label.
- **Jordan (mixed-skill first-timer):** unicode-glyph icons (◧ ▤ ☺) are ambiguous and a touch
  childish; nav labels save it.

## Minor Observations

- Unicode glyph icons should become a single consistent inline-SVG set.
- Google Fonts @import is render-blocking and fails on locked-down networks (seen in this env).
- Tags/meta use slate-400 — bump toward ink for AA.

## Questions to Consider

- What would the "60-second" path look like: open app, find a person, log a follow-up, without touching the mouse?
- Does the dashboard need a hero banner at all, or should it just show what's due?
