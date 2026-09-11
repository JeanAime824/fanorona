/**
 * @file soundSynthesizer.ts
 * Procedural Web Audio API sound synthesizer for authentic stone & wood board game sounds.
 * Requires 0 external audio files, operates 100% offline, zero latency.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  private initContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /** Warm up audio context on first interaction */
  public warmUp(): void {
    try {
      this.initContext();
    } catch {
      // ignore
    }
  }

  /**
   * Subtle click when selecting a piece (asynchronous non-blocking)
   */
  public playSelect(): void {
    if (!this.soundEnabled) return;
    queueMicrotask(() => {
      try {
        const ctx = this.initContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(480, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(720, ctx.currentTime + 0.04);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } catch {
        // audio fail silent
      }
    });
  }

  /**
   * Stone placement sound when moving to an empty intersection (asynchronous non-blocking)
   */
  public playMove(): void {
    if (!this.soundEnabled) return;
    queueMicrotask(() => {
      try {
        const ctx = this.initContext();
        if (!ctx) return;

        // Dual-oscillator stone impact
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "triangle";
        osc1.frequency.setValueAtTime(220, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.08);

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(340, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.09);
        osc2.stop(ctx.currentTime + 0.09);
      } catch {
        // audio fail silent
      }
    });
  }

  /**
   * Resonant hollow wood / bamboo strike for captures
   */
  public playCapture(): void {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(540, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.16);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }

  /**
   * Ascending chime for combo capture sequences
   */
  public playCombo(step: number = 1): void {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const baseFreq = 440 * Math.pow(1.15, Math.min(step, 6));
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }

  /**
   * Gentle muted tap for illegal move or blocked action
   */
  public playError(): void {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(130, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  /**
   * Malagasy celebratory victory chord
   */
  public playVictory(): void {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const notes = [261.63, 329.63, 392.0, 523.25]; // C major chord
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.08;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.65);
    });
  }

  /**
   * Crisp metronome tick for countdown timer urgency
   */
  public playTick(isUrgent: boolean = false): void {
    if (!this.soundEnabled) return;
    queueMicrotask(() => {
      try {
        const ctx = this.initContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = isUrgent ? "triangle" : "sine";
        const freq = isUrgent ? 980 : 720;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, ctx.currentTime + 0.04);

        gain.gain.setValueAtTime(isUrgent ? 0.12 : 0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.045);
      } catch {
        // fail silently
      }
    });
  }

  /**
   * Distinctive gong / low chime when player runs out of time (timeout)
   */
  public playTimeout(): void {
    if (!this.soundEnabled) return;
    queueMicrotask(() => {
      try {
        const ctx = this.initContext();
        if (!ctx) return;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sawtooth";
        osc1.frequency.setValueAtTime(180, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.5);

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(130, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(65, ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.55);
        osc2.stop(ctx.currentTime + 0.55);
      } catch {
        // fail silently
      }
    });
  }

  /**
   * Ascending bell chime for incoming challenges
   */
  public playChallenge(): void {
    if (!this.soundEnabled) return;
    queueMicrotask(() => {
      try {
        const ctx = this.initContext();
        if (!ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 - E5 - G5 - C6
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = ctx.currentTime + index * 0.08;

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.12, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.4);
        });
      } catch {
        // fail silently
      }
    });
  }

  /**
   * Resonant drum / gong cue when a live multiplayer match commences
   */
  public playGameStart(): void {
    if (!this.soundEnabled) return;
    queueMicrotask(() => {
      try {
        const ctx = this.initContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } catch {
        // fail silently
      }
    });
  }
}

export const sound = new SoundSynthesizer();
