/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// AAA-Grade Zero-Dependency Procedural Audio Synthesizer with Spatial 3D Panning
export class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientRunning = false;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientNoiseSource: AudioBufferSourceNode | null = null;
  private beepInterval: number | null = null;

  constructor() {
    // Lazily initialized on first user gesture to comply with browser autoplay policies
  }

  private initContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1.0, this.ctx.currentTime);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Ambient Server Room Drone: Deep 60Hz binaural hum + cooling fan white noise + random server beeps
   */
  public startAmbientHum() {
    if (this.ambientRunning || this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.08, ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      // 60Hz Mains hum oscillator
      this.ambientOsc1 = ctx.createOscillator();
      this.ambientOsc1.type = 'sawtooth';
      this.ambientOsc1.frequency.setValueAtTime(60, ctx.currentTime);

      // Lowpass filter for hum
      const humFilter = ctx.createBiquadFilter();
      humFilter.type = 'lowpass';
      humFilter.frequency.setValueAtTime(140, ctx.currentTime);

      this.ambientOsc1.connect(humFilter);
      humFilter.connect(this.ambientGain);
      this.ambientOsc1.start();

      // Binaural second oscillator at 62Hz for subtle beating rhythm
      this.ambientOsc2 = ctx.createOscillator();
      this.ambientOsc2.type = 'sine';
      this.ambientOsc2.frequency.setValueAtTime(62, ctx.currentTime);
      this.ambientOsc2.connect(this.ambientGain);
      this.ambientOsc2.start();

      // Cooling fan white noise buffer (looping)
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.04;
      }
      this.ambientNoiseSource = ctx.createBufferSource();
      this.ambientNoiseSource.buffer = noiseBuffer;
      this.ambientNoiseSource.loop = true;

      const fanFilter = ctx.createBiquadFilter();
      fanFilter.type = 'bandpass';
      fanFilter.frequency.setValueAtTime(450, ctx.currentTime);
      fanFilter.Q.setValueAtTime(1.2, ctx.currentTime);

      this.ambientNoiseSource.connect(fanFilter);
      fanFilter.connect(this.ambientGain);
      this.ambientNoiseSource.start();

      // Periodic random server blade activity chirp/beeps
      this.beepInterval = window.setInterval(() => {
        if (!this.muted && Math.random() > 0.45) {
          this.playServerBeep();
        }
      }, 1800);

      this.ambientRunning = true;
    } catch {
      // Audio safety
    }
  }

  public stopAmbientHum() {
    if (!this.ambientRunning) return;
    try {
      this.ambientOsc1?.stop();
      this.ambientOsc1?.disconnect();
      this.ambientOsc2?.stop();
      this.ambientOsc2?.disconnect();
      this.ambientNoiseSource?.stop();
      this.ambientNoiseSource?.disconnect();
      if (this.beepInterval) {
        clearInterval(this.beepInterval);
        this.beepInterval = null;
      }
    } catch {
      // Audio safety
    }
    this.ambientRunning = false;
  }

  /**
   * Procedural Server Blade Beep
   */
  public playServerBeep() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const freqs = [1800, 2200, 2600, 3200];
      const freq = freqs[Math.floor(Math.random() * freqs.length)];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.015, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.06);
    } catch {
      // safety
    }
  }

  /**
   * Laser Fire: Frequency-modulated saw-wave sweep with quick decay and transient click
   */
  public playLaserFire(side: 'left' | 'right' | 'desktop' = 'right') {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      // FM Sweep: drops from 1250Hz to 90Hz in 120ms
      osc.type = 'sawtooth';
      const startFreq = side === 'left' ? 1150 : 1350;
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.12);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

      // Stereo pan for dual laser blaster feel
      if (panner) {
        panner.pan.setValueAtTime(side === 'left' ? -0.45 : side === 'right' ? 0.45 : 0, t);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.masterGain);
      } else {
        osc.connect(gain);
        gain.connect(this.masterGain);
      }

      osc.start(t);
      osc.stop(t + 0.14);
    } catch {
      // safety
    }
  }

  /**
   * Packet Explosion: Low-pass filtered white noise punch with sub-bass 40Hz kick
   * Supports 3D spatial positioning via x, y, z coordinates!
   */
  public playPacketExplosion(x?: number, y?: number, z?: number) {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;

      // Create spatial panner if 3D coordinates provided
      let targetNode: AudioNode = this.masterGain;
      if (x !== undefined && y !== undefined && z !== undefined && ctx.createPanner) {
        const panner = ctx.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 20;
        panner.rolloffFactor = 1.2;
        panner.positionX.setValueAtTime(x, t);
        panner.positionY.setValueAtTime(y, t);
        panner.positionZ.setValueAtTime(z, t);
        panner.connect(this.masterGain);
        targetNode = panner;
      }

      // 1. Sub-bass kick (220Hz down to 40Hz)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(220, t);
      subOsc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
      subGain.gain.setValueAtTime(0.4, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      subOsc.connect(subGain);
      subGain.connect(targetNode);
      subOsc.start(t);
      subOsc.stop(t + 0.23);

      // 2. Filtered noise punch
      const bufferSize = Math.floor(ctx.sampleRate * 0.15);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.frequency.exponentialRampToValueAtTime(250, t + 0.15);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(targetNode);

      noise.start(t);
    } catch {
      // safety
    }
  }

  /**
   * Alarm Klaxon: Dual-tone resonant sine wave pulse
   */
  public playAlarmKlaxon() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.linearRampToValueAtTime(620, t + 0.22);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.25);
    } catch {
      // safety
    }
  }

  /**
   * Success / Threat Neutralized Arpeggio
   */
  public playSuccessChime() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!ctx || !this.masterGain) return;
        const noteTime = now + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.22, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.51);
      });
    } catch {
      // safety
    }
  }

  /**
   * Cryptographic Shield Snap / Lock
   */
  public playShieldLock() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, t);
      osc.frequency.exponentialRampToValueAtTime(920, t + 0.2);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.3);
    } catch {
      // safety
    }
  }

  /**
   * Button / Terminal Click Beep
   */
  public playButtonBeep(freq = 660) {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.1);
    } catch {
      // safety
    }
  }

  /**
   * Target Lock-On Chirp: Rapid high-tech double chirp when aiming reticle snaps to a node
   */
  public playTargetLock() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.setValueAtTime(1760, t + 0.03);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch {
      // safety
    }
  }

  /**
   * Massive EMP Shockwave: Room-clearing sub-bass resonance & electrical discharge
   */
  public playEmpShockwave() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;

      // 1. Deep Sub-bass Drop
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(120, t);
      sub.frequency.exponentialRampToValueAtTime(24, t + 1.2);

      subGain.gain.setValueAtTime(0.65, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.3);

      sub.connect(subGain);
      subGain.connect(this.masterGain);
      sub.start(t);
      sub.stop(t + 1.35);

      // 2. Electrical Discharge Shimmer
      const bufferSize = Math.floor(ctx.sampleRate * 0.8);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(2800, t);
      bandpass.frequency.exponentialRampToValueAtTime(200, t + 0.8);
      bandpass.Q.setValueAtTime(4.0, t);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

      noise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(t);
    } catch {
      // safety
    }
  }

  /**
   * Blast Door Sealing Wave Resonance
   */
  public playSealingWave() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        if (!ctx || !this.masterGain) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.05);

        gain.gain.setValueAtTime(0.25, t + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.6);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + idx * 0.05);
        osc.stop(t + idx * 0.05 + 0.65);
      });
    } catch {
      // safety
    }
  }

  /**
   * Update 3D Listener in Web Audio
   */
  public updateListener(x: number, y: number, z: number, forwardX = 0, forwardY = 0, forwardZ = -1) {
    if (!this.ctx) return;
    const listener = this.ctx.listener;
    if (!listener) return;

    try {
      const t = this.ctx.currentTime;
      if (listener.positionX) {
        listener.positionX.setValueAtTime(x, t);
        listener.positionY.setValueAtTime(y, t);
        listener.positionZ.setValueAtTime(z, t);
        listener.forwardX.setValueAtTime(forwardX, t);
        listener.forwardY.setValueAtTime(forwardY, t);
        listener.forwardZ.setValueAtTime(forwardZ, t);
        listener.upX.setValueAtTime(0, t);
        listener.upY.setValueAtTime(1, t);
        listener.upZ.setValueAtTime(0, t);
      } else {
        // Legacy fallback
        (listener as unknown as { setPosition: (x: number, y: number, z: number) => void }).setPosition(x, y, z);
        (listener as unknown as { setOrientation: (fx: number, fy: number, fz: number, ux: number, uy: number, uz: number) => void })
          .setOrientation(forwardX, forwardY, forwardZ, 0, 1, 0);
      }
    } catch {
      // safety
    }
  }

  /**
   * Damage / Breach Error Buzzer
   */
  public playErrorBuzzer() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.setValueAtTime(90, t + 0.12);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.3);
    } catch {
      // safety
    }
  }
}

export const spatialAudio = new SpatialAudioEngine();
