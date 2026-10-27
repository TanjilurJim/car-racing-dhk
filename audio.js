/**
 * DHAKA STREET RUSH - AUDIO ENGINE
 * Web Audio API procedurally synthesized sound effects and upbeat synth-arcade music
 * 100% self-contained, zero external asset dependencies!
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicPlaying = false;
    
    // Engine sound nodes
    this.engineOsc = null;
    this.engineGain = null;
    this.engineFilter = null;
    
    // Music timer/sequence
    this.musicTimer = null;
    this.step = 0;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.setupEngineSound();
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setupEngineSound() {
    if (!this.ctx) return;

    // Dual oscillator engine buzz
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    this.engineFilter = this.ctx.createBiquadFilter();

    this.engineOsc1.type = 'sawtooth';
    this.engineOsc2.type = 'triangle';

    this.engineOsc1.frequency.value = 55;
    this.engineOsc2.frequency.value = 55.5;

    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 350;

    this.engineGain.gain.value = 0.001; // start silent

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  updateEngine(speedRatio, isAccelerating, nitroActive) {
    if (!this.ctx || !this.engineGain || !this.enabled) return;

    const targetGain = isAccelerating ? (nitroActive ? 0.22 : 0.16) : 0.07;
    const baseFreq = 50 + speedRatio * 180 + (nitroActive ? 60 : 0);
    const filterFreq = 300 + speedRatio * 1200 + (nitroActive ? 800 : 0);

    const now = this.ctx.currentTime;
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.1);
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);
  }

  stopEngine() {
    if (!this.ctx || !this.engineGain) return;
    this.engineGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.1);
  }

  // --- Iconic Sound Effects ---

  // Player Dual-Tone Car Horn
  playPlayerHorn() {
    if (!this.ctx || !this.enabled) return;
    this.resume();

    const now = this.ctx.currentTime;
    const freqs = [440, 554.37]; // Dual-tone A4 + C#5

    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gain.gain.setValueAtTime(0.18, now + 0.28);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    });
  }

  // Dhaka Local Bus Hydraulic Horn ("PAA-POOOO!")
  playBusHorn() {
    if (!this.ctx || !this.enabled) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    // Loud heavy blare
    osc1.frequency.setValueAtTime(220, now);
    osc1.frequency.setValueAtTime(247, now + 0.2);

    osc2.frequency.setValueAtTime(277, now);
    osc2.frequency.setValueAtTime(311, now + 0.2);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
    gain.gain.setValueAtTime(0.25, now + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.56);
    osc2.stop(now + 0.56);
  }

  // Rickshaw Bell ("Tring Tring!")
  playRickshawBell() {
    if (!this.ctx || !this.enabled) return;
    this.resume();

    const ring = (delay) => {
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2800, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    };

    ring(0);
    ring(0.09);
    ring(0.22);
    ring(0.31);
  }

  // CNG 2-stroke sputter
  playCngSputter() {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.18);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // CNG Nitro Boost Whoosh & Thruster
  playNitroSound() {
    if (!this.ctx || !this.enabled) return;
    this.resume();

    const now = this.ctx.currentTime;
    // White noise blast
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(3200, now + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  // Chai Pickup Chime (Doodh Cha / Singara bonus)
  playChaiPickup() {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.2);
    });
  }

  // Water Splash Effect (Hatirjheel Lake collision)
  playSplash() {
    if (!this.ctx || !this.enabled) return;
    this.resume();

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.42);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  // Crash Impact
  playCrash() {
    if (!this.ctx || !this.enabled) return;
    this.resume();

    const now = this.ctx.currentTime;

    // Heavy low punch
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);

    // Crunch metal noise
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Realistic Tire Screech (Drift & Hard Braking)
  playTireScreech() {
    if (!this.ctx || !this.enabled) return;
    if (this.screeching) return;
    this.screeching = true;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.linearRampToValueAtTime(1300, now + 0.1);
    osc.frequency.linearRampToValueAtTime(750, now + 0.35);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.Q.value = 4.0;

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);

    setTimeout(() => { this.screeching = false; }, 220);
  }

  // --- Background Synth Beat (Procedural Retro Arcade Chiptune/Bhangra Beat) ---
  startMusic() {
    if (!this.ctx || !this.enabled || this.musicPlaying) return;
    this.musicPlaying = true;
    this.step = 0;

    const tempo = 132; // BPM
    const stepDuration = 60 / tempo / 4; // 16th notes

    const bassNotes = [110, 110, 130.8, 110, 146.8, 130.8, 110, 98]; // A2, C3, D3 progression

    const playStep = () => {
      if (!this.musicPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Kick on 1, 5, 9, 13
      if (this.step % 4 === 0) {
        const kick = this.ctx.createOscillator();
        const kGain = this.ctx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(130, now);
        kick.frequency.exponentialRampToValueAtTime(40, now + 0.12);
        kGain.gain.setValueAtTime(0.3, now);
        kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        kick.connect(kGain);
        kGain.connect(this.ctx.destination);
        kick.start(now);
        kick.stop(now + 0.16);
      }

      // Snare / Clap on 4, 12
      if (this.step % 8 === 4) {
        const snareBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
        const data = snareBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const sSource = this.ctx.createBufferSource();
        sSource.buffer = snareBuffer;
        const sFilter = this.ctx.createBiquadFilter();
        sFilter.type = 'highpass';
        sFilter.frequency.setValueAtTime(1000, now);
        const sGain = this.ctx.createGain();
        sGain.gain.setValueAtTime(0.18, now);
        sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        sSource.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(this.ctx.destination);
        sSource.start(now);
      }

      // Hi-hat groove (every off-beat)
      if (this.step % 2 === 1) {
        const hhBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.03, this.ctx.sampleRate);
        const data = hhBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const hhSource = this.ctx.createBufferSource();
        hhSource.buffer = hhBuffer;
        const hhGain = this.ctx.createGain();
        hhGain.gain.setValueAtTime(0.06, now);
        hhGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        hhSource.connect(hhGain);
        hhGain.connect(this.ctx.destination);
        hhSource.start(now);
      }

      // Rolling Synth Bass
      if (this.step % 2 === 0) {
        const noteIdx = Math.floor(this.step / 2) % bassNotes.length;
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sawtooth';
        bOsc.frequency.setValueAtTime(bassNotes[noteIdx], now);
        bGain.gain.setValueAtTime(0.08, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        const bFilter = this.ctx.createBiquadFilter();
        bFilter.type = 'lowpass';
        bFilter.frequency.setValueAtTime(600, now);

        bOsc.connect(bFilter);
        bFilter.connect(bGain);
        bGain.connect(this.ctx.destination);
        bOsc.start(now);
        bOsc.stop(now + 0.15);
      }

      this.step = (this.step + 1) % 32;
      this.musicTimer = setTimeout(playStep, stepDuration * 1000);
    };

    playStep();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  toggle(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopEngine();
      this.stopMusic();
    }
  }
}

// Global instance
window.soundEngine = new SoundEngine();

