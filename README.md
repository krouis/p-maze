# p-maze (Pixel Maze)

A lightweight, framework-free, procedurally generated HTML5 pixel-art maze game built specifically for young children.

> **Play it now:** [Play Pixel Maze on GitHub Pages](https://krouis.github.io/p-maze/)

---

## AI-Generated Project Disclosure

> [!IMPORTANT]
> **AI-generated project**
>
> This project was designed and implemented with the assistance of an AI coding agent (**Antigravity** by the Google DeepMind team). The source code, tests, documentation, directory structures, and initial visual and audio designs were generated as part of a study and learning experiment in agentic coding capabilities.
>
> The repository is public so that the generated implementation can be inspected, tested, discussed, improved, and used as an educational example.
>
> AI-generated code may contain mistakes, inefficient choices, or incomplete assumptions. Review, testing, and human contributions are welcome!

---

## Core Product Concept

Pixel Maze is designed to be emerging-reader friendly, forgiving, and peaceful for children aged approximately 3 to 8 years old.

### Peaceful Design Invariants:

- **No Stress States**: No visible scores, no timers, no move counters, no lives, no countdowns, and no game-over failure screens.
- **Forgiving Play**: Hitting a wall causes a harmless character squash animation and a soft sound instead of subtraction penalties.
- **Child Safe**: No advertisements, no tracking analytics, no user accounts, no login portals, and zero cookies.
- **Interactive Elements**: Playful custom particle systems (stars, leaves, bubbles) matching 12 rotation level color themes and original retro 8-bit music.

---

## Supported Platforms

- Desktop & Laptop Browsers (Chrome, Firefox, Safari, Edge)
- Mobile Phones and Tablets (Android & iOS WebViews)
- Usable down to 320 CSS pixels wide without requiring page scrolling.

---

## Controls

### Desktop Keyboard Controls

Support Arrow keys, WASD, and Vim HJKL layouts simultaneously:

- **Up**: `ArrowUp` | `W` | `K`
- **Down**: `ArrowDown` | `S` | `J`
- **Left**: `ArrowLeft` | `A` | `H`
- **Right**: `ArrowRight` | `D` | `L`

### Mobile & Touch Controls

On touch devices, a semi-transparent, child-friendly directional overlay (D-pad) is displayed at the bottom center. It supports tapping, press-and-hold repeating movement, and swipe gestures.

---

## Development Setup

### System Prerequisites

- **Node.js**: Version `>=20.0.0` (LTS is pinned to `v20.12.2` in [.nvmrc](file:///.nvmrc))
- **npm**: Version `>=10.0.0`

### Installation

1. Clone the repository.
2. Install local development dependencies:
   ```bash
   npm install
   ```

### Execution Commands

- **Run Local Server**: Launch the Vite development server on `http://localhost:5173`:
  ```bash
  npm run dev
  ```
- **Production Compilation**: Build optimized assets under `dist/`:
  ```bash
  npm run build
  ```
- **Local Production Preview**: Host local built assets on `http://localhost:4173`:
  ```bash
  npm run preview
  ```

### Testing & Verification

- **Linting & Code Checks**: Check ESLint rules:
  ```bash
  npm run lint
  ```
- **Formatting Checks**: Verify Prettier layout rules:
  ```bash
  npm run format:check
  ```
- **TypeScript Compilation Check**:
  ```bash
  npm run typecheck
  ```
- **Vitest Unit Tests**: Execute all mathematical, storage, and logic unit tests:
  ```bash
  npm run test
  ```
- **E2E Browser Tests**: Run Playwright end-to-end browser scenarios:
  ```bash
  npm run test:e2e
  ```
- **Complete Check Suite**: Runs format, lint, type-checks, unit tests, builds assets, and runs E2E tests:
  ```bash
  npm run check
  ```

---

## Project Structure

```text
p-maze/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Quality, unit testing, and E2E checks
│       └── deploy-pages.yml       # GitHub Pages compilation deployment
├── docs/                          # Detailed architecture design guides
│   ├── architecture.md
│   ├── maze-generation.md
│   ├── audio-system.md
│   ├── accessibility.md
│   ├── testing.md
│   ├── deployment.md
│   └── privacy.md
├── public/                        # Static assets (sw, manifest, PWA icons)
│   ├── icons/
│   ├── manifest.webmanifest
│   └── sw.js                      # Custom cache-on-fetch service worker
├── src/
│   ├── main.ts                    # Entry point loading styles and SW
│   ├── app/                       # App flow and screen orchestration
│   ├── game/                      # State machine and level configs
│   ├── maze/                      # Seeded random generators, DFS maze generation
│   ├── rendering/                 # Double-canvas drawing layers, particles
│   ├── input/                     # Unified repeat timings, keyboard, swipe, D-pad
│   ├── audio/                     # Synthesizers, sequencer scheduler
│   ├── themes/                    # HSL color theme palettes
│   ├── storage/                   # LocalStorage adapters and migrations
│   └── styles/                    # Modular layout and accessibility CSS
└── tests/
    └── e2e/                       # Playwright browser automation suites
```

---

## Privacy Policy

Pixel Maze does not collect personal data, does not show ads, and does not use cookies. All game progress and settings remain locally stored within your current browser's local storage. For parents wishing to review compliance details, see the [Privacy documentation](file:///docs/privacy.md).

## License

Licensed under the [MIT License](file:///LICENSE).
