// Keyboard + mouse input. WASD / arrows move, Shift sneaks, E or click throws
// a pebble toward the mouse, Q fires the EMP, Space (hold) picks the lock,
// P pauses, M mutes, Enter / R restarts after a win or a catch.
export class Input {
  constructor(canvas) {
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
    this.sneak = false;
    this.mouseX = null;
    this.mouseY = null;
    this.mouseClicked = false;
    this.pebblePressed = false;
    this.empPressed = false;
    this.pickHeld = false;
    this.pausePressed = false;
    this.mutePressed = false;
    this.confirmPressed = false;
    this.canvas = canvas;
    this._attach();
  }

  _attach() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      switch (e.code) {
        case 'KeyA': case 'ArrowLeft': this.left = true; break;
        case 'KeyD': case 'ArrowRight': this.right = true; break;
        case 'KeyW': case 'ArrowUp': this.up = true; break;
        case 'KeyS': case 'ArrowDown': this.down = true; break;
        case 'ShiftLeft': case 'ShiftRight': this.sneak = true; break;
        case 'KeyE': this.pebblePressed = true; break;
        case 'KeyQ': this.empPressed = true; break;
        case 'Space': this.pickHeld = true; e.preventDefault(); break;
        case 'KeyP': this.pausePressed = true; break;
        case 'KeyM': this.mutePressed = true; break;
        case 'Enter': case 'KeyR': this.confirmPressed = true; break;
      }
    });
    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyA': case 'ArrowLeft': this.left = false; break;
        case 'KeyD': case 'ArrowRight': this.right = false; break;
        case 'KeyW': case 'ArrowUp': this.up = false; break;
        case 'KeyS': case 'ArrowDown': this.down = false; break;
        case 'ShiftLeft': case 'ShiftRight': this.sneak = false; break;
        case 'Space': this.pickHeld = false; break;
      }
    });
    this.canvas.addEventListener('mousemove', (e) => {
      const r = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - r.left) * (this.canvas.width / r.width);
      this.mouseY = (e.clientY - r.top) * (this.canvas.height / r.height);
    });
    this.canvas.addEventListener('mousedown', (e) => {
      const r = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - r.left) * (this.canvas.width / r.width);
      this.mouseY = (e.clientY - r.top) * (this.canvas.height / r.height);
      this.mouseClicked = true;
    });
    window.addEventListener('blur', () => {
      this.left = this.right = this.up = this.down = this.sneak = false;
      this.pickHeld = false;
    });
  }

  // One-shot flags are consumed by the game loop each frame.
  consume() {
    const out = {
      pebble: this.pebblePressed || this.mouseClicked,
      emp: this.empPressed,
      pause: this.pausePressed,
      mute: this.mutePressed,
      confirm: this.confirmPressed,
    };
    this.pebblePressed = false;
    this.mouseClicked = false;
    this.empPressed = false;
    this.pausePressed = false;
    this.mutePressed = false;
    this.confirmPressed = false;
    return out;
  }
}
