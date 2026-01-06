// Audio Manager - Handles all game sounds and music using Web Audio API

class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private currentMusic: AudioBufferSourceNode | null = null;
  private initialized: boolean = false;
  private muted: boolean = false;
  private musicVolume: number = 0.3;
  private sfxVolume: number = 0.5;

  public async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create gain nodes for volume control
      this.masterGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();

      this.masterGain.connect(this.audioContext.destination);
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);

      this.musicGain.gain.value = this.musicVolume;
      this.sfxGain.gain.value = this.sfxVolume;

      // Generate all sounds programmatically
      await this.generateSounds();
      
      this.initialized = true;
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }

  private async generateSounds(): Promise<void> {
    if (!this.audioContext) return;

    // Generate sound effects
    this.sounds.set('bomb_place', this.generateTone(200, 0.1, 'square', 0.3));
    this.sounds.set('explosion', this.generateExplosionSound());
    this.sounds.set('powerup', this.generatePowerUpSound());
    this.sounds.set('death', this.generateDeathSound());
    this.sounds.set('hit', this.generateHitSound());
    this.sounds.set('walk', this.generateWalkSound());
    this.sounds.set('menu_select', this.generateTone(440, 0.1, 'sine', 0.2));
    this.sounds.set('menu_confirm', this.generateTone(880, 0.15, 'sine', 0.3));
    this.sounds.set('level_complete', this.generateLevelCompleteSound());
    this.sounds.set('boss_appear', this.generateBossAppearSound());
    this.sounds.set('boss_hit', this.generateTone(100, 0.2, 'sawtooth', 0.4));
    this.sounds.set('boss_death', this.generateBossDeathSound());
    this.sounds.set('countdown', this.generateTone(600, 0.1, 'square', 0.3));
    this.sounds.set('game_over', this.generateGameOverSound());
    this.sounds.set('victory', this.generateVictorySound());
  }

  private generateTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
          break;
        case 'sawtooth':
          sample = 2 * ((frequency * t) % 1) - 1;
          break;
        case 'triangle':
          sample = Math.abs(4 * ((frequency * t) % 1) - 2) - 1;
          break;
      }

      // Apply envelope
      const envelope = Math.exp(-3 * t / duration);
      data[i] = sample * volume * envelope;
    }

    return buffer;
  }

  private generateExplosionSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // White noise with decreasing frequency rumble
      const noise = (Math.random() * 2 - 1) * 0.5;
      const rumble = Math.sin(2 * Math.PI * (100 - t * 150) * t) * 0.5;
      const envelope = Math.exp(-4 * t);
      data[i] = (noise + rumble) * envelope;
    }

    return buffer;
  }

  private generatePowerUpSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Rising arpeggio
      const freq = 400 + (t / duration) * 800;
      const sample = Math.sin(2 * Math.PI * freq * t);
      const envelope = Math.sin(Math.PI * t / duration);
      data[i] = sample * envelope * 0.3;
    }

    return buffer;
  }

  private generateDeathSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.6;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Descending tone with wobble
      const freq = 400 - (t / duration) * 300;
      const wobble = Math.sin(2 * Math.PI * 10 * t) * 20;
      const sample = Math.sin(2 * Math.PI * (freq + wobble) * t);
      const envelope = Math.exp(-2 * t);
      data[i] = sample * envelope * 0.4;
    }

    return buffer;
  }

  private generateHitSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.15;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const noise = (Math.random() * 2 - 1) * 0.3;
      const tone = Math.sin(2 * Math.PI * 200 * t) * 0.3;
      const envelope = Math.exp(-10 * t);
      data[i] = (noise + tone) * envelope;
    }

    return buffer;
  }

  private generateWalkSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.08;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const noise = (Math.random() * 2 - 1) * 0.1;
      const envelope = Math.exp(-20 * t);
      data[i] = noise * envelope;
    }

    return buffer;
  }

  private generateLevelCompleteSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.0;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(t / 0.25);
      if (noteIndex < notes.length) {
        const freq = notes[noteIndex];
        const noteT = t - noteIndex * 0.25;
        const sample = Math.sin(2 * Math.PI * freq * t);
        const envelope = Math.exp(-3 * noteT);
        data[i] = sample * envelope * 0.3;
      }
    }

    return buffer;
  }

  private generateBossAppearSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.5;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Ominous rising tone
      const freq = 50 + (t / duration) * 100;
      const sample = Math.sin(2 * Math.PI * freq * t) * 0.5;
      const rumble = Math.sin(2 * Math.PI * 30 * t) * 0.3;
      const envelope = Math.sin(Math.PI * t / duration);
      data[i] = (sample + rumble) * envelope * 0.4;
    }

    return buffer;
  }

  private generateBossDeathSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 2.0;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Dramatic descending explosion
      const freq = 200 - (t / duration) * 180;
      const noise = (Math.random() * 2 - 1) * 0.3;
      const tone = Math.sin(2 * Math.PI * freq * t) * 0.4;
      const envelope = Math.exp(-1.5 * t);
      data[i] = (noise + tone) * envelope;
    }

    return buffer;
  }

  private generateGameOverSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.5;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const notes = [392.00, 349.23, 329.63, 293.66]; // G4, F4, E4, D4

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(t / 0.35);
      if (noteIndex < notes.length) {
        const freq = notes[noteIndex];
        const noteT = t - noteIndex * 0.35;
        const sample = Math.sin(2 * Math.PI * freq * t);
        const envelope = Math.exp(-2 * noteT);
        data[i] = sample * envelope * 0.3;
      }
    }

    return buffer;
  }

  private generateVictorySound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 2.0;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50, 1318.51]; // Victory fanfare

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(t / 0.28);
      if (noteIndex < notes.length) {
        const freq = notes[noteIndex];
        const noteT = t - noteIndex * 0.28;
        const sample = Math.sin(2 * Math.PI * freq * t);
        const envelope = Math.exp(-2 * noteT);
        data[i] = sample * envelope * 0.35;
      }
    }

    return buffer;
  }

  public play(soundName: string): void {
    if (!this.initialized || !this.audioContext || !this.sfxGain || this.muted) return;

    const buffer = this.sounds.get(soundName);
    if (!buffer) return;

    // Resume audio context if suspended (required by browsers)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.sfxGain);
    source.start();
  }

  public playMusic(musicName: string): void {
    // For now, we'll skip music generation as it's complex
    // In a full implementation, you'd generate or load background music
  }

  public stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }

  public setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicVolume;
    }
  }

  public setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 1;
    }
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

export const audioManager = new AudioManager();
