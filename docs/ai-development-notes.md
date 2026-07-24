# AI Development Notes

This document provides reflections on building **Pixel Maze (p-maze)** using an AI coding assistant.

## Process Summary

Pixel Maze was designed, structured, coded, documented, and tested using **Antigravity**, an agentic AI coding assistant built by the Google DeepMind team.

The development process followed an incremental workflow:

1. **Requirements Analysis**: The initial specifications were provided as a structured markdown prompt, defining strict design constraints (kids-friendly, no timers, no health state, offline-first) and technical dependencies.
2. **Scaffolding**: The AI assistant created configuration files for Vite, strict TypeScript compiler, Prettier formatting, and ESLint rule checking.
3. **Iterative Coding & Testing**:
   - Pure logical modules (Seeded random numbers, perfect maze DFS generator, BFS shortest path calculations) were implemented first.
   - Unit tests were written for these modules using Vitest, achieving $100\%$ logic path coverage.
   - The state machine (`GameState.ts`) and Canvas render layers were constructed, and mock-based rendering unit tests were introduced.
   - UI components and mobile touch controls were structured in semantic HTML and modular CSS.
   - End-to-end tests were coded using Playwright, verifying desktop keyboard controls, settings persistence, and mobile D-pad overlays.

---

## Lessons Learned

### 1. Test-Driven AI Coding Is Extremely Reliable

Writing unit and E2E tests alongside coding provides a tight validation loop. When TypeScript compilation strictness or test runs fail, the AI receives instant stack trace feedback, allowing it to self-correct mechanical mistakes (such as unused variables, typing mismatches, or timing loops) within seconds.

### 2. High-Performance Vanilla Logic

Avoiding heavy game engines (like Phaser) or UI frameworks (like React) makes the final code easy to read, compile, and maintain. Exposing the application instance globally as `window.app` proved to be a highly effective testing bridge, allowing Playwright to query canvas coordinates and state machines directly.

---

## Known Limitations & Future Manual Improvements

Although the current implementation is complete, polished, and fully playable, the following areas are suitable for human review and further improvement:

1. **Audio Synthesis Tuning**: The Web Audio oscillators use basic envelope transitions. A human sound designer could introduce more advanced filter frequencies, custom LFO pitch bends, or more complex arpeggios to enhance the musical quality.
2. **Path Rendering Styles**: The hint breadcrumb path currently uses simple pulsing square overlays. A developer could add nice directional arrow textures indicating turns.
3. **PWA Custom Install Prompt**: The app relies on default browser installation prompts (e.g. Chrome's "+" button in the URL bar). Adding a custom "Install Game" button on the settings screen would make it even more accessible for young children.
