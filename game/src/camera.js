// Wall-mounted security cameras: sweep back and forth, project a vision cone,
// and raise the alarm fast when the thief crosses it. An EMP burst disables
// every camera for a few seconds (a limited tool, see thief.js).
import { angleDiff, dist, hasLineOfSight } from './utils.js';

export const CAMERA_VIEW_HALF_ANGLE = 0.42;

export class SecurityCamera {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.baseAngle = def.baseAngle;
    this.sweep = def.sweep;
    this.range = def.range;
    this.phase = 0;
    this.angle = def.baseAngle;
    this.disabledTimer = 0;
    this.seesThief = false;
  }

  get disabled() { return this.disabledTimer > 0; }

  disable(seconds) { this.disabledTimer = seconds; }

  update(dt, thief, walls, time) {
    if (this.disabledTimer > 0) {
      this.disabledTimer -= dt;
      this.seesThief = false;
      return;
    }
    this.phase = time;
    this.angle = this.baseAngle + Math.sin(time * 0.55 + this.x * 0.01) * this.sweep;
    const d = dist(this.x, this.y, thief.x, thief.y);
    if (d > this.range) { this.seesThief = false; return; }
    const a = Math.atan2(thief.y - this.y, thief.x - this.x);
    if (Math.abs(angleDiff(a, this.angle)) > CAMERA_VIEW_HALF_ANGLE) { this.seesThief = false; return; }
    this.seesThief = hasLineOfSight(this.x, this.y, thief.x, thief.y, walls);
  }
}
