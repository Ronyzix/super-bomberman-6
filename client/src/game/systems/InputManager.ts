// Input Manager - Handles keyboard and touch controls

import { KEYS } from '../constants';
import { InputState, TouchState, Position } from '../types';
import { isTouchDevice } from '../utils/helpers';

export class InputManager {
  private inputState: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    bomb: false,
    detonate: false,
    pause: false,
  };

  private touchState: TouchState = {
    joystick: { x: 0, y: 0 },
    bombPressed: false,
    detonatePressed: false,
  };

  private joystickCenter: Position = { x: 0, y: 0 };
  private joystickActive: boolean = false;
  private joystickTouchId: number | null = null;
  private bombTouchId: number | null = null;

  private keyDownHandler: (e: KeyboardEvent) => void;
  private keyUpHandler: (e: KeyboardEvent) => void;
  private touchStartHandler: (e: TouchEvent) => void;
  private touchMoveHandler: (e: TouchEvent) => void;
  private touchEndHandler: (e: TouchEvent) => void;

  private onPauseCallback: (() => void) | null = null;
  private isEnabled: boolean = true;

  constructor() {
    this.keyDownHandler = this.handleKeyDown.bind(this);
    this.keyUpHandler = this.handleKeyUp.bind(this);
    this.touchStartHandler = this.handleTouchStart.bind(this);
    this.touchMoveHandler = this.handleTouchMove.bind(this);
    this.touchEndHandler = this.handleTouchEnd.bind(this);
  }

  public init(): void {
    // Keyboard events
    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);

    // Touch events
    if (isTouchDevice()) {
      window.addEventListener('touchstart', this.touchStartHandler, { passive: false });
      window.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
      window.addEventListener('touchend', this.touchEndHandler);
      window.addEventListener('touchcancel', this.touchEndHandler);
    }
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);
    window.removeEventListener('touchstart', this.touchStartHandler);
    window.removeEventListener('touchmove', this.touchMoveHandler);
    window.removeEventListener('touchend', this.touchEndHandler);
    window.removeEventListener('touchcancel', this.touchEndHandler);
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.resetInputState();
    }
  }

  public setOnPause(callback: () => void): void {
    this.onPauseCallback = callback;
  }

  public getInputState(): InputState {
    // Combine keyboard and touch input
    const state: InputState = { ...this.inputState };

    if (isTouchDevice()) {
      // Apply joystick input
      const threshold = 0.3;
      if (this.touchState.joystick.y < -threshold) state.up = true;
      if (this.touchState.joystick.y > threshold) state.down = true;
      if (this.touchState.joystick.x < -threshold) state.left = true;
      if (this.touchState.joystick.x > threshold) state.right = true;
      
      if (this.touchState.bombPressed) state.bomb = true;
      if (this.touchState.detonatePressed) state.detonate = true;
    }

    return state;
  }

  public getTouchState(): TouchState {
    return { ...this.touchState };
  }

  public isUsingTouch(): boolean {
    return isTouchDevice() && this.joystickActive;
  }

  private resetInputState(): void {
    this.inputState = {
      up: false,
      down: false,
      left: false,
      right: false,
      bomb: false,
      detonate: false,
      pause: false,
    };
    this.touchState = {
      joystick: { x: 0, y: 0 },
      bombPressed: false,
      detonatePressed: false,
    };
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.isEnabled) return;

    const key = e.code;

    if (KEYS.UP.includes(key)) {
      this.inputState.up = true;
      e.preventDefault();
    }
    if (KEYS.DOWN.includes(key)) {
      this.inputState.down = true;
      e.preventDefault();
    }
    if (KEYS.LEFT.includes(key)) {
      this.inputState.left = true;
      e.preventDefault();
    }
    if (KEYS.RIGHT.includes(key)) {
      this.inputState.right = true;
      e.preventDefault();
    }
    if (KEYS.BOMB.includes(key)) {
      this.inputState.bomb = true;
      e.preventDefault();
    }
    if (KEYS.DETONATE.includes(key)) {
      this.inputState.detonate = true;
      e.preventDefault();
    }
    if (KEYS.PAUSE.includes(key)) {
      this.inputState.pause = true;
      if (this.onPauseCallback) {
        this.onPauseCallback();
      }
      e.preventDefault();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const key = e.code;

    if (KEYS.UP.includes(key)) this.inputState.up = false;
    if (KEYS.DOWN.includes(key)) this.inputState.down = false;
    if (KEYS.LEFT.includes(key)) this.inputState.left = false;
    if (KEYS.RIGHT.includes(key)) this.inputState.right = false;
    if (KEYS.BOMB.includes(key)) this.inputState.bomb = false;
    if (KEYS.DETONATE.includes(key)) this.inputState.detonate = false;
    if (KEYS.PAUSE.includes(key)) this.inputState.pause = false;
  }

  private handleTouchStart(e: TouchEvent): void {
    if (!this.isEnabled) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = touch.clientX;
      const y = touch.clientY;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // Left side of screen - joystick
      if (x < screenWidth * 0.4 && y > screenHeight * 0.5) {
        if (this.joystickTouchId === null) {
          this.joystickTouchId = touch.identifier;
          this.joystickCenter = { x, y };
          this.joystickActive = true;
          e.preventDefault();
        }
      }

      // Right side of screen - action buttons
      if (x > screenWidth * 0.6) {
        // Bottom right - bomb button
        if (y > screenHeight * 0.6) {
          this.touchState.bombPressed = true;
          this.bombTouchId = touch.identifier;
          e.preventDefault();
        }
        // Middle right - detonate button
        else if (y > screenHeight * 0.4) {
          this.touchState.detonatePressed = true;
          e.preventDefault();
        }
      }
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    if (!this.isEnabled) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];

      if (touch.identifier === this.joystickTouchId) {
        const dx = touch.clientX - this.joystickCenter.x;
        const dy = touch.clientY - this.joystickCenter.y;
        const maxDistance = 60;

        // Normalize to -1 to 1 range
        this.touchState.joystick = {
          x: Math.max(-1, Math.min(1, dx / maxDistance)),
          y: Math.max(-1, Math.min(1, dy / maxDistance)),
        };

        e.preventDefault();
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];

      if (touch.identifier === this.joystickTouchId) {
        this.joystickTouchId = null;
        this.joystickActive = false;
        this.touchState.joystick = { x: 0, y: 0 };
      }

      if (touch.identifier === this.bombTouchId) {
        this.bombTouchId = null;
        this.touchState.bombPressed = false;
      }
    }

    // Reset detonate on any touch end in that area
    this.touchState.detonatePressed = false;
  }

  // Virtual joystick rendering data
  public getJoystickData(): { center: Position; current: Position; active: boolean; radius: number } {
    const radius = 60;
    return {
      center: this.joystickCenter,
      current: {
        x: this.joystickCenter.x + this.touchState.joystick.x * radius,
        y: this.joystickCenter.y + this.touchState.joystick.y * radius,
      },
      active: this.joystickActive,
      radius,
    };
  }
}

export const inputManager = new InputManager();
