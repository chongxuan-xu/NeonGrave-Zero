// Custom synthesized audio engine using pure Web Audio API to create highly immersive, responsive cyberpunk soundscapes.

class CyberAudioEngine {
  private ctx: AudioContext | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private isMuted: boolean = false;

  // Background gameplay arpeggiator variables
  private gameplayTimer: any = null;
  private gameplayTick: number = 0;
  private gameplayGain: GainNode | null = null;
  private biquadFilter: BiquadFilterNode | null = null;

  private init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ctx) {
      if (this.isMuted) {
        this.ctx.suspend();
        this.stopGameplayMusic();
      } else {
        this.ctx.resume();
        this.startAmbient();
      }
    }
    return this.isMuted;
  }

  public getMuteState() {
    return this.isMuted;
  }

  // Neon background synth pad loop
  public startAmbient() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    if (this.ambientOsc1) return; // Already running

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      // Low sub bass oscillator
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = "sawtooth";
      this.ambientOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note

      // Detuned second oscillator
      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = "square";
      this.ambientOsc2.frequency.setValueAtTime(55.4, this.ctx.currentTime); // slightly detuned

      // Lowpass resonance filter to create the breathing dark warehouse ambient
      const lpFilter = this.ctx.createBiquadFilter();
      lpFilter.type = "lowpass";
      lpFilter.frequency.setValueAtTime(180, this.ctx.currentTime);
      lpFilter.Q.setValueAtTime(5, this.ctx.currentTime);

      // Modulate lowpass filter frequency with slow LFO
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // very slow sweep
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(80, this.ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(lpFilter.frequency);
      lfo.start();

      this.ambientOsc1.connect(lpFilter);
      this.ambientOsc2.connect(lpFilter);
      lpFilter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      this.ambientOsc1.start();
      this.ambientOsc2.start();
    } catch (e) {
      console.warn("Ambient soundtrack start failed", e);
    }
  }

  public stopAmbient() {
    try {
      if (this.ambientOsc1) {
        this.ambientOsc1.stop();
        this.ambientOsc1.disconnect();
        this.ambientOsc1 = null;
      }
      if (this.ambientOsc2) {
        this.ambientOsc2.stop();
        this.ambientOsc2.disconnect();
        this.ambientOsc2 = null;
      }
    } catch (e) {}
  }

  // Soft sci-fi synth-wave tracker sequencer played dynamically
  public startGameplayMusic() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    if (this.gameplayTimer) return; // already playing

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.gameplayGain = this.ctx.createGain();
      this.gameplayGain.gain.setValueAtTime(0.045, this.ctx.currentTime); // Soft background music volume
      this.gameplayGain.connect(this.ctx.destination);

      // Low pass filter to make the arpeggio sound warm, analog, and "soft"
      this.biquadFilter = this.ctx.createBiquadFilter();
      this.biquadFilter.type = "lowpass";
      this.biquadFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
      this.biquadFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);
      this.biquadFilter.connect(this.gameplayGain);

      this.gameplayTick = 0;
      
      const tempoIntervalMs = 180; // Fast-pace grid arpeggiator clock tick
      
      this.gameplayTimer = setInterval(() => {
        if (!this.ctx || this.isMuted || this.ctx.state === 'suspended') return;
        const now = this.ctx.currentTime;
        const tick = this.gameplayTick % 32;
        
        // Minor key chord progression (Am, F, C, G)
        let chordBase = 55.00; // Am (A1)
        let leadNotes = [220.00, 261.63, 329.63, 440.00];

        const measure = Math.floor(tick / 8);
        if (measure === 0) {
          chordBase = 55.00; // Am
          leadNotes = [220.00, 261.63, 329.63, 440.00]; // A, C, E, A
        } else if (measure === 1) {
          chordBase = 43.65; // F
          leadNotes = [174.61, 261.63, 349.23, 440.00]; // F, C, F, A
        } else if (measure === 2) {
          chordBase = 65.41; // C
          leadNotes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C
        } else {
          chordBase = 48.99; // G
          leadNotes = [196.00, 293.66, 392.00, 493.88]; // G, D, G, B
        }

        const step = tick % 8;

        // 1. Kick/Sub-Bass pulsation (beat 0) & off-bass (beat 4, 6)
        if (step === 0 || step === 4 || step === 6) {
          try {
            const osc = this.ctx.createOscillator();
            const noteGain = this.ctx.createGain();
            osc.type = "sawtooth";
            const levelScalar = step === 4 ? 2 : 1.5;
            osc.frequency.setValueAtTime(chordBase * levelScalar, now);
            
            noteGain.gain.setValueAtTime(0.045, now);
            noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.connect(noteGain);
            noteGain.connect(this.biquadFilter!);
            
            osc.start(now);
            osc.stop(now + 0.45);

            osc.onended = () => {
              try {
                osc.disconnect();
                noteGain.disconnect();
              } catch (e) {}
            };
          } catch(e){}
        }

        // 2. Soft cyber-hihat metallic ticks
        if (step === 2 || step === 6) {
          try {
            const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.02, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
              data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const noiseFilter = this.ctx.createBiquadFilter();
            noiseFilter.type = "highpass";
            noiseFilter.frequency.setValueAtTime(6000, now);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.015, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.gameplayGain!);
            
            noise.start(now);
            noise.stop(now + 0.025);

            noise.onended = () => {
              try {
                noise.disconnect();
                noiseFilter.disconnect();
                noiseGain.disconnect();
              } catch (e) {}
            };
          } catch(e){}
        }

        // 3. Spacely Arpeggiator micro melodies
        if (step === 0 || step === 3 || step === 5 || step === 7) {
          try {
            const leadOsc = this.ctx.createOscillator();
            const leadGain = this.ctx.createGain();
            leadOsc.type = "triangle";
            
            const noteIndex = (step * 2 + Math.floor(tick / 2)) % leadNotes.length;
            const noteFreq = leadNotes[noteIndex];
            
            leadOsc.frequency.setValueAtTime(noteFreq, now);

            leadGain.gain.setValueAtTime(0.02, now);
            leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            leadOsc.connect(leadGain);
            leadGain.connect(this.biquadFilter!);

            leadOsc.start(now);
            leadOsc.stop(now + 0.5);

            leadOsc.onended = () => {
              try {
                leadOsc.disconnect();
                leadGain.disconnect();
              } catch (e) {}
            };
          } catch(e){}
        }

        this.gameplayTick++;
      }, tempoIntervalMs);

    } catch (e) {
      console.warn("Gameplay music start failed", e);
    }
  }

  public stopGameplayMusic() {
    if (this.gameplayTimer) {
      clearInterval(this.gameplayTimer);
      this.gameplayTimer = null;
    }
    if (this.gameplayGain) {
      try {
        this.gameplayGain.disconnect();
      } catch(e){}
      this.gameplayGain = null;
    }
    this.biquadFilter = null;
  }

  // Energy Katana attack
  public playKatana() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(3, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.2);

    osc.onended = () => {
      try {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch (e) {}
    };
  }

  // Energy projectile fire
  public playLaser(frequency = 440, type: "sine" | "triangle" | "sawtooth" | "square" = "triangle") {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.15);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (e) {}
    };
  }

  // Cyber dash / momentum boost
  public playDash() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.08);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.15);

    osc.onended = () => {
      try {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch (e) {}
    };
  }

  // Hack activation trigger
  public playHack() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = "square";
    osc1.frequency.setValueAtTime(950, now);
    osc1.frequency.setValueAtTime(600, now + 0.04);
    osc1.frequency.setValueAtTime(1300, now + 0.08);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(150, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc1.stop(now + 0.2);
    osc2.start();
    osc2.stop(now + 0.2);

    osc1.onended = () => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        gain.disconnect();
      } catch (e) {}
    };
  }

  // Heavy blast / Android death explosion
  public playExplosion() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Simulate noise for standard explosions
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
       data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(20, now + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(now + 0.4);

    noise.onended = () => {
      try {
        noise.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch (e) {}
    };

    // Deep sub drop
    const sub = this.ctx.createOscillator();
    sub.frequency.setValueAtTime(100, now);
    sub.frequency.linearRampToValueAtTime(25, now + 0.3);
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.3, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start();
    sub.stop(now + 0.35);

    sub.onended = () => {
      try {
        sub.disconnect();
        subGain.disconnect();
      } catch (e) {}
    };
  }

  // Slow-motion enter / dive whistle
  public playBulletTime(isEntering: boolean) {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    if (isEntering) {
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.3);
    } else {
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(350, now + 0.2);
    }

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.3);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (e) {}
    };
  }

  // Play static glitch pop
  public playGlitch() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(Math.random() * 2000 + 100, now);

    // Quick bursts
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.setValueAtTime(0, now + 0.02);
    gain.gain.setValueAtTime(0.06, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.1);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (e) {}
    };
  }
}

export const cyberAudio = new CyberAudioEngine();
