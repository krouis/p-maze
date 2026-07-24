# Testing Strategy & Guidelines

This document details the unit and end-to-end (E2E) testing setup for **Pixel Maze (p-maze)**.

## Test Architecture

Our testing strategy splits validation into two distinct layers:

1. **Unit Tests (Vitest)**: Verifies pure mathematical logic (seeded random arrays, maze wall connectivity, BFS shortest path, storage schema validation). Runs in a fast mock JSOM environment.
2. **E2E Tests (Playwright)**: Verifies real browser rendering, keyboard inputs, mobile viewport configurations, page reloads, and offline caching.

---

## Unit Testing (Vitest)

### Executing Unit Tests

- Run tests once:
  ```bash
  npm run test
  ```
- Run with coverage reports:
  ```bash
  npm run test:coverage
  ```

### Coverage Thresholds

We enforce strict minimum coverage metrics on codebase updates:

- **Statements**: $\ge 85\%$
- **Branches**: $\ge 80\%$
- **Functions**: $\ge 85\%$
- **Lines**: $\ge 85\%$

Pure logic modules (such as `SeededRandom.ts`, `levelConfig.ts`, and `Pathfinding.ts`) target $100\%$ unit test coverage.

---

## E2E Testing (Playwright)

We run E2E scenarios against a production-like preview server to ensure real-world performance.

### Executing E2E Tests

- Run tests headlessly:
  ```bash
  npm run test:e2e
  ```
- Run with browser UI visible (headed):
  ```bash
  npm run test:e2e:headed
  ```

### Test Coverage Scenarios

1. **Desktop Controls**: Taps Arrow/WASD keys and verifies player state coordinates update. Checks pause menu overlays.
2. **Mobile Layout**: Configures a mobile emulation viewport, touch pointer properties, and asserts the Grid D-pad is visible and interactive.
3. **Data Persistence**: Moves the player, reloads the page, and confirms coordinates and mutes are restored from `localStorage`.
4. **Hold to Reset**: Simulates clicking and holding the reset button for 2 seconds to check that it resets the game.
5. **Accessibility**: Toggles Reduced Motion and High Contrast settings and asserts proper class attributes are appended to `document.body`.
