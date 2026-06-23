# Platform Tour for New Users

## Overview

Add a guided floating tour that highlights key UI elements for new users visiting QueryVeda. Uses `driver.js` for lightweight, non-blocking popovers with a close (X) button.

## Trigger Conditions

- **Auto-trigger:** On first visit to the home page (after onboarding/track selection completes)
- **Manual trigger:** "Take a Tour" button available in the navbar for replay anytime
- **State:** `queryveda-tour-completed` key in localStorage. Auto-tour fires only when this key is absent.

## Tour Behavior

- **Floating popovers** — no dark overlay/backdrop blocking the page
- **Close (X) button** on each popover dismisses the entire tour
- **Next / Previous / Done** buttons for step navigation
- Closing or completing the tour sets `queryveda-tour-completed: "true"` in localStorage
- Tour auto-scrolls to elements if needed

## Tour Steps (7 total)

| Step | Target Element | Title | Description |
|------|---------------|-------|-------------|
| 1 | Learn dropdown | Learn | Choose SQL or Excel learning tracks |
| 2 | Daily nav link | Daily Challenge | A new challenge every day — keep your streak! |
| 3 | Problems nav link | Problems | 75+ practice problems sorted by difficulty |
| 4 | Progress nav link | Progress | Track your achievements, streaks, and mastery |
| 5 | Leaderboard nav link | Leaderboard | See how you rank against other learners |
| 6 | Theme toggle button | Theme | Switch between dark and light mode |
| 7 | Skill tree cards section | Your Learning Path | Unlock nodes as you progress through the skill tree |

## Components

### `PlatformTour` (client component)
- Location: `queryveda/components/layout/platform-tour.tsx`
- Renders nothing visible — initializes driver.js imperatively
- Reads tour state from localStorage on mount
- Auto-starts tour if not completed and user is on home page
- Exposes a way for the navbar button to re-trigger

### `useTourState` hook
- Location: `queryveda/hooks/use-tour-state.ts`
- Reads/writes `queryveda-tour-completed` from localStorage
- Returns `{ completed: boolean, markCompleted: () => void, reset: () => void }`

### Navbar "Take a Tour" button
- Small icon button (e.g., `HelpCircle` from lucide-react) in the navbar
- Clicking resets tour state and re-triggers the tour

## Styling

- Custom CSS to theme driver.js popovers for dark mode
- Purple accent color (`#9333ea` / purple-600) for buttons and highlights
- Rounded corners, subtle shadow to match existing card styling
- No backdrop/overlay — popover floats freely

## Dependencies

- `driver.js` (~5KB gzipped, zero dependencies)

## Data Flow

```
First visit → Home page loads → PlatformTour checks localStorage
  → key absent → auto-start driver.js tour
  → user completes or closes → set localStorage key
  → subsequent visits → tour does not auto-start

"Take a Tour" click → reset localStorage key → start tour
```
