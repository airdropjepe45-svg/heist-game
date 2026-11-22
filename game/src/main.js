// Entry point for The Midnight Vault: wires input, state, sound and rendering
// together and runs the fixed-step game loop. Also honours ?shot= posing for
// screenshots (see shots.js) — a posed game still simulates, so guards and
// cameras keep sweeping while the screenshot is taken.
import { GameState } from './state.js';
import { Input } from './input.js';
import { SoundEngine } from './audio.js';
import { renderGame, renderOverlay } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const sound = new SoundEngine();
const state = new GameState();

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  applyShot(state, shot, Number(params.get('seed') || '1'));
}

// Small hook for automated playtests (and for the screenshots agent): the live
// game state and input, nothing more. It changes no gameplay.
window.__midnightVault = { state, input, sound };

let last = performance.now();
let accumulator = 0;
const STEP = 1 / 60;

function playSoundEvent(name) {
  switch (name) {
    case 'step': sound.step(state.thief.sneaking); break;
    case 'pebble': sound.pebble(); break;
    case 'clatter': sound.clatter(); break;
    case 'spotted': sound.spotted(); break;
    case 'alarmtick': sound.alarmTick(); break;
    case 'emp': sound.emp(); break;
    case 'pickup': sound.pickup(); break;
    case 'picktick': sound.lockpickTick(); break;
    case 'caught': sound.caught(); break;
    case 'win': sound.win(); break;
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25;
  accumulator += dt;

  const pressed = input.consume();
  if (pressed.mute) sound.toggleMute();
  if (pressed.confirm || pressed.pause) sound.ensure();

  if (state.screen === 'title') {
    if (pressed.confirm) { sound.ensure(); state.startGame(); }
  } else if (state.screen === 'playing') {
    if (pressed.pause) { state.screen = 'paused'; }
  } else if (state.screen === 'paused') {
    if (pressed.pause || pressed.confirm) state.screen = 'playing';
  } else if (state.screen === 'caught') {
    if (pressed.confirm) { state.loadLevel(state.levelIndex); state.screen = 'playing'; }
  } else if (state.screen === 'roomclear') {
    if (pressed.confirm) state.nextLevel();
  } else if (state.screen === 'win') {
    if (pressed.confirm) state.startGame();
  }

  // In a posed screenshot the world keeps moving (cones sweep) but the thief
  // does not walk off and the alarm does not run away: freeze the sim clock.
  const frozen = Boolean(shot);
  while (accumulator >= STEP) {
    accumulator -= STEP;
    if (state.screen === 'playing' && !frozen) {
      const events = [];
      if (pressed.pebble) {
        const landing = state.thief.throwPebble(input.mouseX ?? state.thief.x + 100, input.mouseY ?? state.thief.y);
        if (landing) {
          state.noise = { x: landing.x, y: landing.y, timer: 2.5 };
          events.push('pebble', 'clatter');
        }
      }
      if (pressed.emp) {
        if (state.thief.fireEmp()) events.push('emp');
      }
      state.update(STEP, input, events);
      for (const e of events) playSoundEvent(e);
      pressed.pebble = false;
      pressed.emp = false;
    }
    if (frozen) {
      // Keep cones sweeping for a lively still: advance the visual clock only.
      state.time += STEP;
      for (const c of state.cameras) c.angle = c.baseAngle + Math.sin(state.time * 0.55 + c.x * 0.01) * c.sweep;
    }
  }

  renderGame(ctx, state);
  if (state.screen !== 'playing') renderOverlay(ctx, state);
}

requestAnimationFrame(frame);
