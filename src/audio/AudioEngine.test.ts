import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioEngine } from './AudioEngine';

// Mock Web Audio API
class MockAudioNode {
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockGainNode extends MockAudioNode {
  gain = {
    value: 1.0,
    setValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  };
}

class MockOscillatorNode extends MockAudioNode {
  type = 'sine';
  frequency = {
    value: 440,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  };
  start = vi.fn();
  stop = vi.fn();
}

class MockBiquadFilterNode extends MockAudioNode {
  type = 'lowpass';
  frequency = {
    value: 350,
    setValueAtTime: vi.fn(),
  };
}

class MockAudioBufferSourceNode extends MockAudioNode {
  buffer = null;
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioContext {
  state = 'suspended';
  sampleRate = 44100;
  currentTime = 0;
  createGain = () => new MockGainNode();
  createOscillator = () => new MockOscillatorNode();
  createBiquadFilter = () => new MockBiquadFilterNode();
  createBufferSource = () => new MockAudioBufferSourceNode();
  createBuffer = (chan: number, size: number, rate: number) => {
    return {
      numberOfChannels: chan,
      length: size,
      sampleRate: rate,
      getChannelData: () => new Float32Array(size),
    };
  };
  resume = vi.fn().mockImplementation(async () => {
    this.state = 'running';
  });
  suspend = vi.fn().mockImplementation(async () => {
    this.state = 'suspended';
  });
  destination = {} as any;
}

describe('AudioEngine', () => {
  beforeEach(() => {
    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal('webkitAudioContext', MockAudioContext);
  });

  it('should initialize context and gains properly when start is called', async () => {
    const audio = new AudioEngine();
    await audio.start();

    // Verify it doesn't crash and sets up correct level
    audio.setupSequencerForLevel(1);
    expect(audio).toBeDefined();
  });

  it('should support muting and unmuting music', async () => {
    const audio = new AudioEngine();
    await audio.start();

    // Should set target volume
    expect(() => audio.setMusicEnabled(false)).not.toThrow();
    expect(() => audio.setMusicEnabled(true)).not.toThrow();
  });

  it('should support muting and unmuting sound effects', async () => {
    const audio = new AudioEngine();
    await audio.start();

    expect(() => audio.setSFXEnabled(false)).not.toThrow();
    expect(() => audio.setSFXEnabled(true)).not.toThrow();
  });

  it('should play sound effects without crashing', async () => {
    const audio = new AudioEngine();
    await audio.start();

    expect(() => audio.playSFX('move')).not.toThrow();
    expect(() => audio.playSFX('bump')).not.toThrow();
    expect(() => audio.playSFX('click')).not.toThrow();
    expect(() => audio.playSFX('hint')).not.toThrow();
    expect(() => audio.playSFX('success')).not.toThrow();
  });
});
