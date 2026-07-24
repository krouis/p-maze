import { getThemeForLevel } from '../themes/themes';
import { SeededRandom } from '../maze/SeededRandom';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Sound and music state
  private musicEnabled = true;
  private sfxEnabled = true;
  private currentLevel = 1;

  // Sequencer properties
  private sequencerTimer: number | null = null;
  private nextNoteTime = 0.0;
  private currentStep = 0;
  private tempo = 120; // BPM
  private scheduleAheadTime = 0.1; // seconds
  private lookahead = 25.0; // ms

  // Sequencer patterns (procedural per level)
  private scale: number[] = [];
  private rootFreq = 220; // A3
  private leadPattern: (number | null)[] = [];
  private bassPattern: (number | null)[] = [];
  private drumPattern: ('k' | 's' | 'h' | null)[] = [];

  // White noise buffer for retro percussion
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    // Audio will start after interaction
  }

  /**
   * Initializes the AudioContext and gain nodes.
   */
  private initContext() {
    if (this.ctx) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Music Gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.25 : 0.0, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? 0.35 : 0.0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Generate White Noise Buffer
      const bufferSize = this.ctx.sampleRate * 1.5; // 1.5 seconds of noise
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } catch (e) {
      console.error('Failed to initialize Web Audio API', e);
    }
  }

  /**
   * Resumes the AudioContext if suspended by autoplay restrictions.
   */
  async start(): Promise<void> {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.setupSequencerForLevel(this.currentLevel);
    this.startSequencer();
  }

  /**
   * Stops the sequencer.
   */
  suspend(): void {
    this.stopSequencer();
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch((e) => console.error(e));
    }
  }

  /**
   * Resumes the sequencer.
   */
  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx
        .resume()
        .then(() => this.startSequencer())
        .catch((e) => console.error(e));
    } else {
      this.startSequencer();
    }
  }

  /**
   * Sets whether the music is enabled.
   */
  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    this.initContext();
    if (this.ctx && this.musicGain) {
      const targetVolume = enabled ? 0.25 : 0.0;
      this.musicGain.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.1);
    }
    if (enabled) {
      this.startSequencer();
    }
  }

  /**
   * Sets whether sound effects are enabled.
   */
  setSFXEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    this.initContext();
    if (this.ctx && this.sfxGain) {
      const targetVolume = enabled ? 0.35 : 0.0;
      this.sfxGain.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.1);
    }
  }

  /**
   * Set up procedural patterns and scale based on level.
   */
  setupSequencerForLevel(level: number) {
    this.currentLevel = level;

    // Choose theme
    const theme = getThemeForLevel(level, false);
    const rng = new SeededRandom(`music-level-${level}-${theme.id}`);

    // Procedural musical parameters
    // Scale intervals relative to root
    const scales = {
      majorPentatonic: [0, 2, 4, 7, 9, 12, 14, 16, 19, 21],
      minorPentatonic: [0, 3, 5, 7, 10, 12, 15, 17, 19, 22],
      dorian: [0, 2, 3, 5, 7, 9, 10, 12, 14, 15],
    };

    let chosenScale = scales.majorPentatonic;
    this.tempo = rng.nextInt(100, 130);

    if (theme.id === 'green-meadow' || theme.id === 'purple-candy' || theme.id === 'pink-clouds') {
      chosenScale = scales.majorPentatonic;
    } else if (
      theme.id === 'blue-ocean' ||
      theme.id === 'forest-night' ||
      theme.id === 'icy-cave'
    ) {
      chosenScale = scales.dorian;
      this.tempo = rng.nextInt(90, 110); // Slower
    } else {
      chosenScale = scales.minorPentatonic;
    }

    this.scale = chosenScale;

    // Root note selection: range of 110Hz (A2) to 220Hz (A3)
    const roots = [110, 123.47, 130.81, 146.83, 164.81, 174.61, 196, 220]; // A2, B2, C3, D3, E3, F3, G3, A3
    this.rootFreq = rng.choose(roots);

    // Procedural pattern generation (16 steps)
    this.leadPattern = Array.from({ length: 16 }, () => {
      if (rng.next() > 0.4) {
        return rng.nextInt(0, 7); // Note index in scale
      }
      return null; // Rest
    });

    this.bassPattern = Array.from({ length: 16 }, (_, i) => {
      if (i % 4 === 0) return 0; // Root note on downbeat
      if (i % 4 === 2 && rng.next() > 0.5) return rng.choose([3, 4, 7]); // Harmonizing notes
      return null;
    });

    this.drumPattern = Array.from({ length: 16 }, (_, i) => {
      if (i % 8 === 0) return 'k'; // Kick on 1 and 9
      if (i % 8 === 4) return 's'; // Snare on 5 and 13
      if (i % 2 === 0 && rng.next() > 0.3) return 'h'; // Hi-hat on eighths
      return null;
    });
  }

  /**
   * Starts the step sequencer scheduler loop.
   */
  private startSequencer() {
    this.initContext();
    if (!this.musicEnabled || !this.ctx || this.sequencerTimer !== null) return;

    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.sequencerTimer = window.setInterval(() => this.scheduler(), this.lookahead);
  }

  /**
   * Stops the step sequencer loop.
   */
  private stopSequencer() {
    if (this.sequencerTimer !== null) {
      clearInterval(this.sequencerTimer);
      this.sequencerTimer = null;
    }
  }

  /**
   * Schedules notes inside the lookahead window.
   */
  private scheduler() {
    if (!this.ctx) return;
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.advanceStep();
    }
  }

  /**
   * Advances the sequencer to the next step.
   */
  private advanceStep() {
    if (!this.ctx) return;
    const secondsPerBeat = 60.0 / this.tempo;
    const stepDuration = secondsPerBeat / 4; // Sixteenth notes
    this.nextNoteTime += stepDuration;
    this.currentStep = (this.currentStep + 1) % 16;
  }

  /**
   * Schedules sounds for a single step.
   */
  private scheduleStep(step: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    // 1. Bass Channel (Triangle Oscillator)
    const bassIdx = this.bassPattern[step];
    if (bassIdx !== null) {
      const noteFreq = this.rootFreq * 0.5 * Math.pow(2, this.scale[bassIdx] / 12);
      this.playSynthNote(noteFreq, 'triangle', 0.18, time, 0.15);
    }

    // 2. Lead Channel (Square Oscillator)
    const leadIdx = this.leadPattern[step];
    if (leadIdx !== null) {
      const noteFreq = this.rootFreq * Math.pow(2, this.scale[leadIdx] / 12);
      // Lead waveform varies by level: square or triangle
      const waveform = this.currentLevel % 2 === 0 ? 'square' : 'triangle';
      this.playSynthNote(noteFreq, waveform, 0.08, time, 0.1);
    }

    // 3. Drum Channel (Noise + Sine Kick)
    const drum = this.drumPattern[step];
    if (drum === 'k') {
      this.playKick(time);
    } else if (drum === 's') {
      this.playSnare(time);
    } else if (drum === 'h') {
      this.playHihat(time);
    }
  }

  /**
   * Synthesizes a note on a lead/bass channel.
   */
  private playSynthNote(
    freq: number,
    type: OscillatorType,
    volume: number,
    time: number,
    duration: number,
  ) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    // Filter to avoid harsh frequencies
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'square' ? 1200 : 2000, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  /**
   * Plays a synthesized kick drum.
   */
  private playKick(time: number) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);

    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  /**
   * Plays a white noise snare drum.
   */
  private playSnare(time: number) {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    source.buffer = this.noiseBuffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, time);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    source.start(time);
    source.stop(time + 0.18);
  }

  /**
   * Plays a tiny highhat.
   */
  private playHihat(time: number) {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    source.buffer = this.noiseBuffer;
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, time);

    gain.gain.setValueAtTime(0.04, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    source.start(time);
    source.stop(time + 0.05);
  }

  /**
   * Triggers a sound effect.
   */
  playSFX(effect: 'move' | 'bump' | 'success' | 'click' | 'hint') {
    this.initContext();
    if (!this.sfxEnabled || !this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    if (effect === 'move') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.06);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (effect === 'bump') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (effect === 'click') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1200, now + 0.01);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (effect === 'hint') {
      // Arpeggio of sine waves
      const notes = [600, 800, 1000];
      notes.forEach((freq, idx) => {
        const timeOffset = now + idx * 0.06;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, timeOffset);

        gain.gain.setValueAtTime(0.1, timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.0001, timeOffset + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(timeOffset);
        osc.stop(timeOffset + 0.12);
      });
    } else if (effect === 'success') {
      // Rising fanfare
      const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
      notes.forEach((freq, idx) => {
        const timeOffset = now + idx * 0.08;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, timeOffset);

        gain.gain.setValueAtTime(0.08, timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.0001, timeOffset + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(timeOffset);
        osc.stop(timeOffset + 0.2);
      });
    }
  }
}
