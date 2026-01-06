// Replay System - Records and plays back game sessions

export interface ReplayFrame {
  timestamp: number;
  players: PlayerFrame[];
  bombs: BombFrame[];
  explosions: ExplosionFrame[];
  enemies: EnemyFrame[];
  powerUps: PowerUpFrame[];
  score: number;
  events: GameEvent[];
}

export interface PlayerFrame {
  id: number;
  x: number;
  y: number;
  direction: number;
  isAlive: boolean;
  animation: string;
}

export interface BombFrame {
  id: string;
  x: number;
  y: number;
  timer: number;
  type: string;
  playerId: number;
}

export interface ExplosionFrame {
  x: number;
  y: number;
  direction: string;
  frame: number;
}

export interface EnemyFrame {
  id: string;
  type: string;
  x: number;
  y: number;
  direction: number;
  health: number;
  animation: string;
}

export interface PowerUpFrame {
  id: string;
  type: string;
  x: number;
  y: number;
  collected: boolean;
}

export interface GameEvent {
  type: 'bomb_placed' | 'bomb_exploded' | 'enemy_killed' | 'powerup_collected' | 'player_death' | 'level_complete' | 'boss_phase';
  data: any;
}

export interface ReplayMetadata {
  id: string;
  levelId: number;
  gameMode: string;
  playerCount: number;
  duration: number;
  score: number;
  date: number;
  playerNames: string[];
  isVictory: boolean;
  highlights: ReplayHighlight[];
}

export interface ReplayHighlight {
  timestamp: number;
  type: 'multi_kill' | 'close_call' | 'boss_defeat' | 'combo' | 'perfect_clear';
  description: string;
}

export interface ReplayData {
  metadata: ReplayMetadata;
  levelData: {
    grid: number[][];
    theme: string;
  };
  frames: ReplayFrame[];
  inputHistory: InputFrame[];
}

export interface InputFrame {
  timestamp: number;
  playerId: number;
  input: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    bomb: boolean;
    action: boolean;
  };
}

class ReplaySystem {
  private isRecording: boolean = false;
  private isPlaying: boolean = false;
  private currentReplay: ReplayData | null = null;
  private frames: ReplayFrame[] = [];
  private inputHistory: InputFrame[] = [];
  private startTime: number = 0;
  private playbackTime: number = 0;
  private playbackSpeed: number = 1;
  private currentFrameIndex: number = 0;
  private highlights: ReplayHighlight[] = [];
  
  // Recording state
  private lastKillTime: number = 0;
  private killCombo: number = 0;
  private nearDeathCount: number = 0;

  // Start recording a new replay
  public startRecording(levelId: number, gameMode: string, playerCount: number, playerNames: string[]): void {
    this.isRecording = true;
    this.frames = [];
    this.inputHistory = [];
    this.highlights = [];
    this.startTime = Date.now();
    this.killCombo = 0;
    this.lastKillTime = 0;
    this.nearDeathCount = 0;
    
    this.currentReplay = {
      metadata: {
        id: this.generateReplayId(),
        levelId,
        gameMode,
        playerCount,
        duration: 0,
        score: 0,
        date: this.startTime,
        playerNames,
        isVictory: false,
        highlights: [],
      },
      levelData: {
        grid: [],
        theme: '',
      },
      frames: [],
      inputHistory: [],
    };
  }

  // Record a frame
  public recordFrame(frame: Omit<ReplayFrame, 'timestamp'>): void {
    if (!this.isRecording) return;

    const timestamp = Date.now() - this.startTime;
    
    this.frames.push({
      ...frame,
      timestamp,
    });

    // Highlights are analyzed via recordEvent
  }

  // Record input
  public recordInput(playerId: number, input: InputFrame['input']): void {
    if (!this.isRecording) return;

    const timestamp = Date.now() - this.startTime;
    this.inputHistory.push({
      timestamp,
      playerId,
      input: { ...input },
    });
  }

  // Record game event
  public recordEvent(type: GameEvent['type'], data: any): void {
    if (!this.isRecording || this.frames.length === 0) return;

    const lastFrame = this.frames[this.frames.length - 1];
    lastFrame.events.push({ type, data });

    // Check for highlights
    const timestamp = lastFrame.timestamp;
    
    switch (type) {
      case 'enemy_killed':
        this.handleKillEvent(timestamp, data);
        break;
      case 'player_death':
        // Check if it was a close call (player survived with 1 life)
        if (data.livesRemaining === 1) {
          this.nearDeathCount++;
          if (this.nearDeathCount >= 3) {
            this.addHighlight(timestamp, 'close_call', 'Survived multiple close calls!');
          }
        }
        break;
      case 'boss_phase':
        this.addHighlight(timestamp, 'boss_defeat', `Defeated ${data.bossName}!`);
        break;
      case 'level_complete':
        if (data.perfectClear) {
          this.addHighlight(timestamp, 'perfect_clear', 'Perfect clear - no damage taken!');
        }
        break;
    }
  }

  private handleKillEvent(timestamp: number, data: any): void {
    const timeSinceLastKill = timestamp - this.lastKillTime;
    
    if (timeSinceLastKill < 2000) {
      this.killCombo++;
      
      if (this.killCombo >= 3) {
        this.addHighlight(timestamp, 'multi_kill', `${this.killCombo}x Multi-kill!`);
      }
      if (this.killCombo >= 5) {
        this.addHighlight(timestamp, 'combo', `${this.killCombo}x Combo streak!`);
      }
    } else {
      this.killCombo = 1;
    }
    
    this.lastKillTime = timestamp;
  }

  private addHighlight(timestamp: number, type: ReplayHighlight['type'], description: string): void {
    // Avoid duplicate highlights
    const existing = this.highlights.find(h => 
      h.type === type && Math.abs(h.timestamp - timestamp) < 1000
    );
    
    if (!existing) {
      this.highlights.push({ timestamp, type, description });
    }
  }

  // Stop recording and finalize replay
  public stopRecording(finalScore: number, isVictory: boolean): ReplayData | null {
    if (!this.isRecording || !this.currentReplay) return null;

    this.isRecording = false;
    
    this.currentReplay.metadata.duration = Date.now() - this.startTime;
    this.currentReplay.metadata.score = finalScore;
    this.currentReplay.metadata.isVictory = isVictory;
    this.currentReplay.metadata.highlights = this.highlights;
    this.currentReplay.frames = this.frames;
    this.currentReplay.inputHistory = this.inputHistory;

    const replay = this.currentReplay;
    this.currentReplay = null;
    
    return replay;
  }

  // Set level data for replay
  public setLevelData(grid: number[][], theme: string): void {
    if (this.currentReplay) {
      this.currentReplay.levelData = { grid, theme };
    }
  }

  // Load a replay for playback
  public loadReplay(replay: ReplayData): void {
    this.currentReplay = replay;
    this.currentFrameIndex = 0;
    this.playbackTime = 0;
    this.playbackSpeed = 1;
    this.isPlaying = false;
  }

  // Start playback
  public startPlayback(): void {
    if (!this.currentReplay) return;
    this.isPlaying = true;
    this.playbackTime = 0;
    this.currentFrameIndex = 0;
  }

  // Pause playback
  public pausePlayback(): void {
    this.isPlaying = false;
  }

  // Resume playback
  public resumePlayback(): void {
    this.isPlaying = true;
  }

  // Stop playback
  public stopPlayback(): void {
    this.isPlaying = false;
    this.currentReplay = null;
    this.currentFrameIndex = 0;
    this.playbackTime = 0;
  }

  // Set playback speed (0.25x to 4x)
  public setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.25, Math.min(4, speed));
  }

  // Seek to timestamp
  public seekTo(timestamp: number): void {
    if (!this.currentReplay) return;

    this.playbackTime = timestamp;
    
    // Find the frame at this timestamp
    this.currentFrameIndex = this.currentReplay.frames.findIndex(
      (frame, index, arr) => {
        const nextFrame = arr[index + 1];
        return frame.timestamp <= timestamp && (!nextFrame || nextFrame.timestamp > timestamp);
      }
    );
    
    if (this.currentFrameIndex === -1) {
      this.currentFrameIndex = 0;
    }
  }

  // Seek to highlight
  public seekToHighlight(highlightIndex: number): void {
    if (!this.currentReplay) return;

    const highlight = this.currentReplay.metadata.highlights[highlightIndex];
    if (highlight) {
      // Seek to 2 seconds before the highlight
      this.seekTo(Math.max(0, highlight.timestamp - 2000));
    }
  }

  // Update playback (call every frame)
  public update(deltaTime: number): ReplayFrame | null {
    if (!this.isPlaying || !this.currentReplay) return null;

    this.playbackTime += deltaTime * this.playbackSpeed;
    
    // Find current frame
    while (
      this.currentFrameIndex < this.currentReplay.frames.length - 1 &&
      this.currentReplay.frames[this.currentFrameIndex + 1].timestamp <= this.playbackTime
    ) {
      this.currentFrameIndex++;
    }

    // Check if playback is complete
    if (this.currentFrameIndex >= this.currentReplay.frames.length - 1) {
      this.isPlaying = false;
    }

    return this.currentReplay.frames[this.currentFrameIndex] || null;
  }

  // Get current playback state
  public getPlaybackState(): {
    isPlaying: boolean;
    currentTime: number;
    totalTime: number;
    speed: number;
    progress: number;
  } | null {
    if (!this.currentReplay) return null;

    return {
      isPlaying: this.isPlaying,
      currentTime: this.playbackTime,
      totalTime: this.currentReplay.metadata.duration,
      speed: this.playbackSpeed,
      progress: this.currentReplay.metadata.duration > 0 
        ? this.playbackTime / this.currentReplay.metadata.duration 
        : 0,
    };
  }

  // Get input at current playback time
  public getInputAtTime(playerId: number): InputFrame['input'] | null {
    if (!this.currentReplay) return null;

    // Find the most recent input for this player before current time
    const inputs = this.currentReplay.inputHistory.filter(
      i => i.playerId === playerId && i.timestamp <= this.playbackTime
    );

    return inputs.length > 0 ? inputs[inputs.length - 1].input : null;
  }

  // Utility functions
  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  public isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentReplay(): ReplayData | null {
    return this.currentReplay;
  }

  public getHighlights(): ReplayHighlight[] {
    return this.currentReplay?.metadata.highlights || this.highlights;
  }

  private generateReplayId(): string {
    return `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Compress replay data for storage
  public compressReplay(replay: ReplayData): string {
    // Simple compression: reduce frame rate for storage
    const compressedFrames = replay.frames.filter((_, index) => index % 2 === 0);
    
    const compressed = {
      ...replay,
      frames: compressedFrames,
    };
    
    return JSON.stringify(compressed);
  }

  // Decompress replay data
  public decompressReplay(data: string): ReplayData {
    return JSON.parse(data);
  }

  // Export replay as shareable format
  public exportReplay(replay: ReplayData): Blob {
    const data = this.compressReplay(replay);
    return new Blob([data], { type: 'application/json' });
  }

  // Import replay from file
  public async importReplay(file: File): Promise<ReplayData> {
    const text = await file.text();
    return this.decompressReplay(text);
  }
}

export const replaySystem = new ReplaySystem();
