# Audio Engine & Synthesizer

This document details the chiptune audio system inside **Pixel Maze (p-maze)**.

## Overview

All music and sound effects are procedurally generated in real-time using the browser's native **Web Audio API**. There are no external audio asset downloads.

## Audio Graph Routing

```text
       [Triangle Bass]      [Square Lead]      [White Noise Drum]
              │                   │                    │
              └───────────┬───────┘                    │
                          ▼                            ▼
                    [Music Gain]                  [SFX Gain]
                     (vol: 25%)                   (vol: 35%)
                          │                            │
                          └───────────┬────────────────┘
                                      ▼
                                [Master Gain]
                                      │
                                      ▼
                             [Audio Destination]
```

---

## Autoplay Restrictions & Lifecycle

Modern browsers block audio from playing automatically without explicit user interaction.

- **Autoplay Resolution**: We initialize and resume the `AudioContext` only after the user clicks the **Play** or **Continue** button on the start screen.
- **Mute Defaults**: Master gains are configured to respect settings defaults (Music = 25%, SFX = 35%) and can be muted independently.
- **Auto-Suspension**: When the browser tab is hidden or minimized (`visibilitychange` event), we call `ctx.suspend()` to release CPU cycles, and call `ctx.resume()` once the tab is reactivated.

---

## Procedural Step Sequencer

The background tracks are constructed using a custom lookahead scheduling queue.

### 1. Step Scheduler

To avoid audio stuttering caused by main-thread lag, the audio engine runs a scheduling clock every 25ms. During each clock tick, it schedules notes that fall within a 100ms lookahead window (`nextNoteTime`).

### 2. Synthesizers & Instruments

- **Lead Channel**: Square or triangle waves with a lowpass filter set to 1200Hz to eliminate harsh high-frequency buzzes. Uses a fast linear ramp-up followed by an exponential decay envelope.
- **Bass Channel**: Clean triangle wave oscillators playing a steady downbeat.
- **Percussion**: Custom white noise source nodes running through bandpass filters (for retro snare strikes) or highpass filters (for hi-hat clicks).

### 3. Procedural Scales & Moods

The sequencer parameters are derived from the level number and the current color theme:

- **Green Meadow / Candy**: Upbeat major pentatonic scales (e.g. intervals `[0, 2, 4, 7, 9]`) at 120 BPM.
- **Blue Ocean / Forest**: Slower, mysterious Dorian scales (e.g. intervals `[0, 2, 3, 5, 7, 9, 10]`) at 90-110 BPM.
- **Ruby Castle / Space**: Dark minor pentatonic scales.

---

## Sound Effects Frequency Reference

- **Move Tick**: A fast pitch sweep from 250Hz to 500Hz over 0.06 seconds using a square wave oscillator.
- **Wall Bump**: A low frequency triangle wave dropping from 120Hz to 40Hz over 0.08 seconds.
- **Click**: A sine wave pulse shifting from 800Hz to 1200Hz over 0.04 seconds.
- **Hint Breadcrumb**: An ascending three-note arpeggio (600Hz, 800Hz, 1000Hz) spaced 0.06 seconds apart.
- **Success Fanfare**: An 8-bit major arpeggio (C4, E4, G4, C5) triggered at 0.08-second increments.
