export class AudioController {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmInterval: number | null = null;

  constructor() {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  init() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      // If we were playing (or should be), restart logic would be handled by the game state,
      // but here we just ensure the interval is cleared or ready. 
      // In this simple implementation, the game loop calls startBGM again or we assume silence until next trigger.
      // However, for a toggle, let's just stop. The user can restart BGM by playing.
    }
    return this.isMuted;
  }

  getMuteState() {
    return this.isMuted;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.error("Audio play error", e);
    }
  }

  playStep() {
    // High pitch short beep (coin/jump style)
    this.playTone(660, 'square', 0.1, 0.05);
  }

  playTurn() {
    // Lower pitch distinct tone
    this.playTone(330, 'triangle', 0.1, 0.05);
  }

  playGameOver() {
    // Descending effect
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    this.playTone(300, 'sawtooth', 0.3, 0.1);
    setTimeout(() => this.playTone(250, 'sawtooth', 0.3, 0.1), 150);
    setTimeout(() => this.playTone(200, 'sawtooth', 0.4, 0.1), 300);
    setTimeout(() => this.playTone(150, 'sawtooth', 0.6, 0.1), 450);
  }

  startBGM() {
    if (this.bgmInterval) return;
    if (!this.ctx) return;

    let beat = 0;
    // Simple driving bass line: A - A - C - G
    const sequence = [220, 0, 220, 0, 261.6, 0, 196, 0];
    
    this.bgmInterval = window.setInterval(() => {
      if (this.isMuted) return;
      
      // Play bass note
      const freq = sequence[beat];
      if (freq > 0) {
        this.playTone(freq, 'square', 0.15, 0.03);
      }

      // Hi-hat tick every beat
      this.playTone(1000 + (Math.random() * 500), 'sawtooth', 0.05, 0.01);

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