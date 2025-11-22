export class AudioController {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmInterval: number | null = null;

  constructor() {
    // Initialization moved to init() to comply with browser autoplay policies
  }

  init() {
    // Create AudioContext lazily on first user interaction
    if (!this.ctx) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }

    // Resume if suspended (common browser policy)
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(e => console.log("Audio resume failed:", e));
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    }
    return this.isMuted;
  }

  getMuteState() {
    return this.isMuted;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
    if (this.isMuted) return;

    // Try to init or resume if needed (fallback)
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      // Click removal: start at 0, quick ramp up
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration + 0.1);
    } catch (e) {
      console.error("Audio play error", e);
    }
  }

  playStep() {
    // Increased volume
    this.playTone(660, 'square', 0.1, 0.15);
  }

  playTurn() {
    // Increased volume
    this.playTone(330, 'triangle', 0.1, 0.15);
  }

  playGameOver() {
    if (this.isMuted) return;
    // Ensure context is ready
    if (!this.ctx) this.init();
    
    const now = this.ctx ? this.ctx.currentTime : 0;
    // Play sequence
    this.playTone(300, 'sawtooth', 0.3, 0.2);
    setTimeout(() => this.playTone(250, 'sawtooth', 0.3, 0.2), 150);
    setTimeout(() => this.playTone(200, 'sawtooth', 0.4, 0.2), 300);
    setTimeout(() => this.playTone(150, 'sawtooth', 0.6, 0.2), 450);
  }

  startBGM() {
    if (this.bgmInterval) return;
    
    // Ensure context exists and is running
    this.init();
    if (!this.ctx) return;

    let beat = 0;
    // Simple driving bass line: A - A - C - G
    const sequence = [220, 0, 220, 0, 261.6, 0, 196, 0];
    
    this.bgmInterval = window.setInterval(() => {
      if (this.isMuted) return;
      
      // Play bass note
      const freq = sequence[beat];
      if (freq > 0) {
        this.playTone(freq, 'square', 0.15, 0.1); // Increased bass volume
      }

      // Hi-hat tick every beat
      this.playTone(1000 + (Math.random() * 500), 'sawtooth', 0.05, 0.03); // Increased hat volume

      beat = (beat + 1) % sequence.length;
    }, 200); // Fast tempo
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}