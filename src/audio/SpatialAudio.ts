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

  /**
   * 3D Warp Time Tunnel Hyperspace Whoosh (Synthesized noise sweep + sub-bass dive + resonant bandpass)
   */
  public playWarpWhoosh(reverse = false) {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const duration = 1.4;

      // 1. Noise Generator for air/hyperspace friction
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.Q.setValueAtTime(3.5, t);

      if (reverse) {
        noiseFilter.frequency.setValueAtTime(2400, t);
        noiseFilter.frequency.exponentialRampToValueAtTime(180, t + duration);
      } else {
        noiseFilter.frequency.setValueAtTime(160, t);
        noiseFilter.frequency.exponentialRampToValueAtTime(2800, t + duration * 0.7);
        noiseFilter.frequency.exponentialRampToValueAtTime(400, t + duration);
      }

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, t);
      noiseGain.gain.linearRampToValueAtTime(0.4, t + duration * 0.4);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noiseSource.start(t);
      noiseSource.stop(t + duration);

      // 2. Sub-bass engine rumble dive
      const subOsc = ctx.createOscillator();
      subOsc.type = 'sawtooth';
      const subGain = ctx.createGain();
      const subFilter = ctx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(120, t);

      if (reverse) {
        subOsc.frequency.setValueAtTime(95, t);
        subOsc.frequency.exponentialRampToValueAtTime(45, t + duration);
      } else {
        subOsc.frequency.setValueAtTime(45, t);
        subOsc.frequency.exponentialRampToValueAtTime(110, t + duration * 0.6);
        subOsc.frequency.exponentialRampToValueAtTime(50, t + duration);
      }

      subGain.gain.setValueAtTime(0.01, t);
      subGain.gain.linearRampToValueAtTime(0.35, t + duration * 0.3);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      subOsc.connect(subFilter);
      subFilter.connect(subGain);
      subGain.connect(this.masterGain);

      subOsc.start(t);
      subOsc.stop(t + duration);
    } catch {
      // safety
    }
  }

  /**
   * 3D Spatial Alarm Siren with Low-Frequency Synthesizer Growl
   * (Dual-pitch emergency klaxon + 42Hz sawtooth sub-bass growl with sweeping filter)
   */
  private alarmOsc: OscillatorNode | null = null;
  private alarmGrowlOsc: OscillatorNode | null = null;
  private alarmGain: GainNode | null = null;
  private alarmGrowlGain: GainNode | null = null;
  private alarmRunning = false;

  public startAlarmSiren() {
    if (this.alarmRunning || this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;

      // 1. High-frequency Doppler klaxon siren
      this.alarmGain = ctx.createGain();
      this.alarmGain.gain.setValueAtTime(0.22, now);
      this.alarmGain.connect(this.masterGain);

      this.alarmOsc = ctx.createOscillator();
      this.alarmOsc.type = 'sawtooth';
      this.alarmOsc.frequency.setValueAtTime(720, now);

      // Rapid Doppler frequency modulation
      for (let i = 0; i < 80; i++) {
        const time = now + i * 0.32;
        this.alarmOsc.frequency.linearRampToValueAtTime(i % 2 === 0 ? 980 : 520, time + 0.28);
      }

      this.alarmOsc.connect(this.alarmGain);
      this.alarmOsc.start(now);

      // 2. Low-frequency 42Hz Synthesizer Growl with filter sweep
      this.alarmGrowlGain = ctx.createGain();
      this.alarmGrowlGain.gain.setValueAtTime(0.35, now);
      this.alarmGrowlGain.connect(this.masterGain);

      this.alarmGrowlOsc = ctx.createOscillator();
      this.alarmGrowlOsc.type = 'sawtooth';
      this.alarmGrowlOsc.frequency.setValueAtTime(42, now);

      const growlFilter = ctx.createBiquadFilter();
      growlFilter.type = 'lowpass';
      growlFilter.frequency.setValueAtTime(120, now);

      // Sweeping cutoff for growl throbbing
      for (let j = 0; j < 80; j++) {
        const tStep = now + j * 0.64;
        growlFilter.frequency.linearRampToValueAtTime(j % 2 === 0 ? 280 : 80, tStep + 0.5);
      }

      this.alarmGrowlOsc.connect(growlFilter);
      growlFilter.connect(this.alarmGrowlGain);
      this.alarmGrowlOsc.start(now);

      this.alarmRunning = true;
    } catch {
      // safety
    }
  }

  public stopAlarmSiren() {
    if (!this.alarmRunning) return;
    try {
      this.alarmOsc?.stop();
      this.alarmOsc?.disconnect();
      this.alarmGain?.disconnect();

      this.alarmGrowlOsc?.stop();
      this.alarmGrowlOsc?.disconnect();
      this.alarmGrowlGain?.disconnect();
    } catch {
      // safety
    }
    this.alarmRunning = false;
  }

  /**
   * Overclock Powerup Chime
   */
  public playPowerupChime() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      [440, 554.37, 659.25, 880, 1108.73, 1318.5].forEach((freq, idx) => {
        if (!ctx || !this.masterGain) return;
        const noteTime = now + idx * 0.05;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.2, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.42);
      });
    } catch {
      // safety
    }
  }

  /**
   * Victory Fanfare Arpeggio
   */
  public playVictoryFanfare() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!ctx || !this.masterGain) return;
        const noteTime = now + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.3, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.6);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.65);
      });
    } catch {
      // safety
    }
  }

  /**
   * Warp Deceleration & Arrival Thud
   */
  /**
   * Warp Deceleration & Arrival Thud
   */
  public playWarpDecelerate() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.45);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.5);
    } catch {
      // safety
    }
  }

  // --- ARCADE & FEVER MODE AUDIO ENHANCEMENTS ---
  private isFeverActive = false;
  private feverBeatInterval: number | null = null;

  public setFeverMode(active: boolean) {
    if (this.isFeverActive === active) return;
    this.isFeverActive = active;
    if (active) {
      this.playFeverSurge();
      this.startFeverBeat();
    } else {
      this.stopFeverBeat();
    }
  }

  /**
   * Fever Mode Activation Surge: Electrifying octave climb with distortion resonance
   */
  public playFeverSurge() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      // Hyper arpeggio: C5 -> E5 -> G5 -> C6 -> E6
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
      freqs.forEach((f, idx) => {
        if (!ctx || !this.masterGain) return;
        const noteTime = t + idx * 0.045;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, noteTime);

        gain.gain.setValueAtTime(0.28, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.38);
      });

      // Sub drop impact
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(140, t);
      sub.frequency.exponentialRampToValueAtTime(45, t + 0.4);
      subGain.gain.setValueAtTime(0.5, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      sub.connect(subGain);
      subGain.connect(this.masterGain);
      sub.start(t);
      sub.stop(t + 0.5);
    } catch {
      // safety
    }
  }

  /**
   * Fast 20% Accelerated Synthwave Pulse during Fever Mode (138 BPM, ~435ms per beat)
   */
  private startFeverBeat() {
    this.stopFeverBeat();
    if (this.muted) return;

    const beatIntervalMs = 434; // ~138 BPM
    let step = 0;
    const bassNotes = [110, 110, 130.81, 146.83, 110, 164.81, 146.83, 123.47]; // A2 bassline

    this.feverBeatInterval = window.setInterval(() => {
      if (!this.isFeverActive || this.muted) return;
      const ctx = this.initContext();
      if (!ctx || !this.masterGain) return;

      try {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        const freq = bassNotes[step % bassNotes.length];
        step++;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, t);
        filter.frequency.exponentialRampToValueAtTime(120, t + 0.18);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.25);
      } catch {
        // safety
      }
    }, beatIntervalMs);
  }

  private stopFeverBeat() {
    if (this.feverBeatInterval) {
      clearInterval(this.feverBeatInterval);
      this.feverBeatInterval = null;
    }
  }

  /**
   * Shard Pickup Chime: Crisp high-tech absorption ping
   */
  public playShardPickup(x?: number, y?: number, z?: number) {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      let target: AudioNode = this.masterGain;

      if (x !== undefined && y !== undefined && z !== undefined && ctx.createPanner) {
        const panner = ctx.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 25;
        panner.setPosition(x, y, z);
        panner.connect(this.masterGain);
        target = panner;
      }

      [1320, 1760, 2640].forEach((freq, idx) => {
        if (!ctx) return;
        const noteTime = t + idx * 0.035;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.25, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.25);

        osc.connect(gain);
        gain.connect(target);

        osc.start(noteTime);
        osc.stop(noteTime + 0.28);
      });
    } catch {
      // safety
    }
  }

  /**
   * Combo Tier Milestone SFX: Plays ascending chime for x2, x3, x4
   */
  public playComboMilestone(multiplier: number) {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const baseFreq = multiplier === 2 ? 587.33 : multiplier === 3 ? 783.99 : 1046.5;
      const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];

      notes.forEach((freq, idx) => {
        if (!ctx || !this.masterGain) return;
        const noteTime = t + idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.22, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.3);
      });
    } catch {
      // safety
    }
  }

  /**
   * Massive EMP Blast Shockwave Audio
   */
  public playEMPBlast() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      // 1. Deep Sub Bass drop
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(140, t);
      subOsc.frequency.exponentialRampToValueAtTime(28, t + 0.8);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, t);
      filter.frequency.exponentialRampToValueAtTime(60, t + 0.8);

      subGain.gain.setValueAtTime(0.6, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

      subOsc.connect(filter);
      filter.connect(subGain);
      subGain.connect(this.masterGain);

      subOsc.start(t);
      subOsc.stop(t + 0.9);

      // 2. High-frequency electrostatic crackle
      const crackleOsc = ctx.createOscillator();
      const crackleGain = ctx.createGain();
      crackleOsc.type = 'square';
      crackleOsc.frequency.setValueAtTime(2400, t);
      crackleOsc.frequency.exponentialRampToValueAtTime(180, t + 0.5);

      crackleGain.gain.setValueAtTime(0.25, t);
      crackleGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);

      crackleOsc.connect(crackleGain);
      crackleGain.connect(this.masterGain);

      crackleOsc.start(t);
      crackleOsc.stop(t + 0.6);
    } catch {
      // safety
    }
  }

  /**
   * Continuous Plasma Beam Hum Sound
   */
  public playPlasmaBeamSound() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.linearRampToValueAtTime(480, t + 0.4);
      osc.frequency.linearRampToValueAtTime(360, t + 0.8);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.9);
    } catch {
      // safety
    }
  }
}

export const spatialAudio = new SpatialAudioEngine();

