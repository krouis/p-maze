# Accessibility Accommodations

This document outlines the accessibility integrations implemented in **Pixel Maze (p-maze)**.

## Universal Design for Children

The game is intended for young children aged 3 to 8. This group includes emerging readers, children with developing motor skills, and users with sensory sensitivities.

### 1. Zero-Text Gameplay

- Children can launch, play, and complete levels without reading any text.
- All interactive controls use clear emojis and visual icons (e.g. 🎮 for play, ⏸️ for pause, 💡 for hints, 🔊 for sound) alongside text labels.

### 2. Physical & Motor Accommodations

- **Large Touch Targets**: Mobile buttons and D-pad touch sectors are sized at $64\text{px} \times 64\text{px}$ or larger, providing easy targets for small fingers.
- **Deterministic Repeats**: Holding down D-pad buttons triggers smooth grid movement at a steady, manageable rate (110ms intervals) rather than sliding off-screen or responding too quickly.
- **Forgiving Play**: Hitting walls triggers a harmless squash bounce and soft sound rather than showing negative score points or failure popups.

---

## Technical Accessibility Standards

The application strictly implements **WCAG 2.1 AA** patterns.

### 1. Keyboard Navigation

- Complete playability without a mouse.
- Mapped movement inputs support both Arrow keys, WASD, and Vim HJKL layouts simultaneously.
- **Focus Indicators**: Focused controls receive a highly visible, thick cyan/white pixel border outline offset by 3px (`:focus-visible`).

### 2. Dialog Focus Management

We use the native HTML5 `<dialog>` component for settings:

- **Focus Trapping**: When settings open, tab indexes are locked within the dialog.
- **Focus Restore**: Closing settings automatically returns focus to the button that triggered the menu, preventing lost tab highlights.

### 3. Screen Reader Semantics (ARIA)

- Emojis are wrapped with descriptions or use clear `aria-label` tags (e.g., `<button aria-label="Mute all sounds">🔇</button>`).
- Modal elements declare `role="dialog"` and `aria-modal="true"`.
- Current levels are read aloud to screen readers on update using `aria-live="polite"`.

---

## Sensory Accommodations

### 1. High Contrast Mode

Activating high contrast mode overrides the active HSL themes, forcing a solid black background, white pathways/walls, and bright yellow/cyan colors for the player and exit. This provides clean visual separation for low-vision players.

### 2. Reduced Motion Mode

Activating this preference disables:

- Floating ambient particles (stars, leaves, snow).
- Exit portal spinning/scaling animations.
- Player breathing/stretching animations.
- CSS transition delays.
  This helps players with vestibular disorders or animation sensitivities.
