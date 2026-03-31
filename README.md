# One-Flow Productivity Tracker

One-Flow is a minimalistic, local-first work timer and productivity tracker that lives entirely on your personal machine. Start timing work cycles, measure deficit tasks, and look at beautiful activity heatmaps without needing internet access, servers, or invasive telemetry tracking apps.

## Features
- **Project Heatmaps**: Track daily intensities exactly like GitHub tracking squares.
- **Refillable Timers**: Configure deficit timers to push yourself to hit hourly thresholds over time.
- **100% Local**: No databases, no telemetry, no tracking scripts. Runs completely securely on your PC via Chrome/Edge/Firefox.

## Getting Started

1. Download or clone this repository to a secure folder on your PC.
2. Double-click the **Create_Desktop_Shortcut.bat** script. This auto-generates a clean desktop icon called `One-Flow.lnk` on your Desktop that points securely to your local installation's `index.html`.
3. Open the desktop shortcut to launch One-Flow!

## Data and Syncing Notes
Your data is securely tracked using the `localStorage` API baked directly into HTML5. This means your time blocks strictly stay natively nested inside your active Web Browser configuration limits. 

If you clear your local browser history/cache strictly across `"Site Data and Cached Images"`, you will effectively wipe your local heatmap configuration! **Export your data via `OneFlow > Projects > Settings` backup periodically**.

*(Note: Data will not cross-sync natively if you install One-Flow locally onto another machine, e.g., your laptop vs. PC without copying over your JSON backup exports.)*
