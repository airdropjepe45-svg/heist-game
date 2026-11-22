// Game state: which room, the alarm meter, loot, score and the screen flow
// (title -> playing -> paused / caught / room clear -> win). The alarm is the
// shared pressure gauge: guards and cameras fill it while they see the thief,
// it drains when the thief is hidden, and at 100 the museum locks down.
import { LEVELS } from './levels.js';
import { Guard } from './guard.js';
import { SecurityCamera } from './camera.js';
import { Thief } from './thief.js';
import { dist } from './utils.js';

export const ALARM_CAMERA_RATE = 26; // alarm points per second while a camera sees the thief
export const ALARM_GUARD_RATE = 34; // alarm points per second while a guard sees the thief
export const ALARM_DECAY = 7; // points per second while unseen

export class GameState {
  constructor() {
    this.screen = 'title'; // title | playing | paused | caught | roomclear | win
    this.levelIndex = 0;
    this.alarm = 0;
    this.score = 0;
    this.lootTaken = 0;
    this.time = 0;
    this.levelTime = 0;
    this.message = '';
    this.messageTimer = 0;
    this.caughtReason = '';
    this.noise = null; // {x, y, timer} pebble clatter marker
    this.empFlash = 0;
    this.alarmTickTimer = 0;
    this.loadLevel(0);
  }

  get level() { return LEVELS[this.levelIndex]; }
  get walls() { return this.level.walls.concat(this.level.blocks); }

  loadLevel(i) {
    this.levelIndex = i;
    const def = LEVELS[i];
    this.thief = new Thief(def.playerStart.x, def.playerStart.y);
    this.thief.pebbles = def.pebbles;
    this.thief.empUses = def.empUses;
    this.guards = def.guards.map((g) => new Guard(g));
    this.cameras = def.cameras.map((c) => new SecurityCamera(c));
    this.lootTaken = 0;
    this.loot = { x: def.loot.x, y: def.loot.y, taken: false };
    this.alarm = 0;
    this.levelTime = 0;
    this.noise = null;
    this.message = '';
    this.messageTimer = 0;
  }

  startGame() {
    this.score = 0;
    this.loadLevel(0);
    this.screen = 'playing';
  }

  nextLevel() {
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.screen = 'win';
      return;
    }
    this.loadLevel(this.levelIndex + 1);
    this.screen = 'playing';
  }

  showMessage(text, seconds) {
    this.message = text;
    this.messageTimer = seconds;
  }

  catchThief(reason) {
    if (this.screen !== 'playing') return;
    this.screen = 'caught';
    this.caughtReason = reason;
  }

  // One simulation step while playing. Returns sound events for main.js.
  update(dt, input, events) {
    this.time += dt;
    this.levelTime += dt;
    if (this.messageTimer > 0) this.messageTimer -= dt;
    if (this.empFlash > 0) this.empFlash -= dt;
    if (this.noise) {
      this.noise.timer -= dt;
      if (this.noise.timer <= 0) this.noise = null;
    }

    const thief = this.thief;
    thief.update(dt, input, this.level.walls, this.level.blocks);
    if (thief.moving) events.push('step');

    // EMP burst: one event disables every camera for 6 seconds.
    if (events.includes('emp')) {
      for (const c of this.cameras) c.disable(6);
      this.empFlash = 1;
    }

    // Pebble: guards near the clatter turn and walk over to investigate.
    if (events.includes('pebble') && this.noise) {
      for (const g of this.guards) {
        if (dist(g.x, g.y, this.noise.x, this.noise.y) < 420) g.hearNoise(this.noise.x, this.noise.y);
      }
    }

    // Lockpick: hold Space beside the loot, standing still, for the pick time.
    const nearLoot = !this.loot.taken && dist(thief.x, thief.y, this.loot.x, this.loot.y) < 80;
    if (input.pickHeld && nearLoot && !thief.moving) {
      const done = thief.updatePicking(dt, true, false);
      if (Math.random() < dt * 6) events.push('picktick');
      if (done) {
        this.loot.taken = true;
        this.lootTaken += 1;
        this.score += 500;
        events.push('pickup');
        this.showMessage(`STOLE THE ${this.level.lootName.toUpperCase()} — NOW REACH THE GETAWAY DOOR!`, 4);
      }
    } else {
      thief.updatePicking(dt, false, false);
    }

    // Guards and cameras watch the thief; being seen fills the alarm.
    let seenByGuard = false;
    let seenByCamera = false;
    for (const g of this.guards) {
      g.update(dt, thief, this.walls);
      if (g.seesThief) seenByGuard = true;
      if (g.caughtThief) {
        this.catchThief('A guard grabbed you in the open.');
        events.push('caught');
        return;
      }
      if (g.state === 'alerted' && g.stateTime < dt * 1.5) events.push('spotted');
    }
    for (const c of this.cameras) {
      c.update(dt, thief, this.walls, this.time);
      if (c.seesThief) seenByCamera = true;
    }
    if (seenByCamera) this.alarm += ALARM_CAMERA_RATE * dt;
    if (seenByGuard) this.alarm += ALARM_GUARD_RATE * dt;
    if (!seenByCamera && !seenByGuard) this.alarm -= ALARM_DECAY * dt;
    this.alarm = Math.max(0, Math.min(100, this.alarm));

    // Alarm warning ticks get faster as the meter climbs.
    if (this.alarm > 55) {
      this.alarmTickTimer -= dt;
      if (this.alarmTickTimer <= 0) {
        this.alarmTickTimer = 1.1 - this.alarm / 130;
        events.push('alarmtick');
      }
    }

    if (this.alarm >= 100) {
      this.catchThief('The alarm hit 100 — the museum locked down and security swarmed in.');
      events.push('caught');
      return;
    }

    // Escape: loot in hand + reach the getaway door to clear the room.
    if (this.loot.taken && dist(thief.x, thief.y, this.level.exit.x, this.level.exit.y) < 52) {
      const timeBonus = Math.max(0, Math.round(600 - this.levelTime * 2));
      this.score += 1000 + timeBonus;
      if (this.levelIndex + 1 >= LEVELS.length) {
        this.screen = 'win';
        events.push('win');
      } else {
        this.screen = 'roomclear';
        events.push('win');
      }
    }
  }
}
