# One-Flow Productivity Tracker

One-Flow is made for people who work from home and want to track their work, One-Flow is a a minimalistic, local-first work timer and productivity tracker that lives entirely on your personal machine. Start timing work cycles, measure deficit tasks, and look at beautiful activity heatmaps without needing internet access or invasive accounts. 

## Features
- **Project Heatmaps**: Track daily intensities exactly like GitHub tracking squares.
- **Refillable Timers**: Configure deficit timers to push yourself to hit hourly thresholds over time.
- **100% Local**: No databases, no telemetry, no tracking scripts. Runs completely securely on your PC via Chrome/Edge/Safari/Firefox.

## Getting Started

### 🪟 Windows Setup
1. Download or clone this repository to a secure folder on your PC.
2. Double-click **`Create_Desktop_Shortcut.bat`**. This generates a `One-Flow` shortcut on your Desktop with the custom purple icon.

### 🍎 Mac / 🐧 Linux Setup
1. Download or clone this repository.
2. Open a terminal in the folder and run: `chmod +x Create_Desktop_Shortcut.sh && ./Create_Desktop_Shortcut.sh`
3. This creates a `One-Flow.url` shortcut on your Desktop that opens your local installation.
4. (Optional) For a custom icon on Mac, right-click the shortcut > Get Info, and drag **`assets/icon.png`** onto the icon in the top-left corner.

## Data and Syncing Notes
Your data is securely tracked using the `localStorage` API baked directly into your browser. 
- **Security**: Your data never leaves your computer.
- **Backups**: Since data is stored in your browser's site data, clearing your strict cache might delete it. Use the **Export Data** button in the app periodically to save a JSON backup.
- **Cross-Device**: To move data between computers, use the Export/Import feature.

---
*Built for spontaneous, focused work blocks.*
