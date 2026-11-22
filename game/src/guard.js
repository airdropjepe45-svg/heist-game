// Museum guards: patrol waypoints, watch with a vision cone, get suspicious
// when they glimpse the thief or hear a pebble, and chase when sure.
// A catch is never instant: a guard must stay close to a visible thief for a
// short grace period while a big "!" warning shows, so the player can escape.
import { angleDiff, angleTo, clamp, dist, hasLineOfSight, lerpAngle, resolveCircleRect } from './utils.js';

export const GUARD_VIEW_RANGE = 260;
export const GUARD_VIEW_HALF_ANGLE = 0.55; // ~63 degrees of cone
export const GUARD_CATCH_RADIUS = 34;
export const GUARD_CATCH_GRACE = 0.9; // seconds of close contact before the catch lands

export class Guard {
  constructor(def) {
    this.waypoints = def.waypoints;
    this.speed = def.speed;
    this.x = def.waypoints[0].x;
    this.y = def.waypoints[0].y;
    this.wpIndex = 1 % def.waypoints.length;
    this.angle = 0;
    this.state = 'patrol'; // patrol | suspicious | alerted
    this.stateTime = 0;
    this.suspicion = 0; // 0..1, fills while the thief is glimpsed
    this.investigateX = 0;
    this.investigateY = 0;
    this.catchTimer = 0;
    this.seesThief = false;
  }

  canSeeThief(thief, walls) {
    const d = dist(this.x, this.y, thief.x, thief.y);
    const range = thief.sneaking ? GUARD_VIEW_RANGE * 0.62 : GUARD_VIEW_RANGE;
    if (d > range) return false;
    const a = angleTo(this.x, this.y, thief.x, thief.y);
    if (Math.abs(angleDiff(a, this.angle)) > GUARD_VIEW_HALF_ANGLE) return false;
    return hasLineOfSight(this.x, this.y, thief.x, thief.y, walls);
  }

  hearNoise(x, y) {
    if (this.state === 'alerted') return;
    this.state = 'suspicious';
    this.stateTime = 0;
    this.investigateX = x;
    this.investigateY = y;
  }

  update(dt, thief, walls) {
    this.stateTime += dt;
    this.seesThief = this.canSeeThief(thief, walls);

    if (this.seesThief) {
      this.suspicion = clamp(this.suspicion + dt * 1.6, 0, 1);
      if (this.suspicion >= 1) {
        this.state = 'alerted';
        this.stateTime = 0;
      } else if (this.state === 'patrol') {
        this.state = 'suspicious';
        this.stateTime = 0;
        this.investigateX = thief.x;
        this.investigateY = thief.y;
      }
    } else {
      this.suspicion = clamp(this.suspicion - dt * 0.5, 0, 1);
      if (this.state === 'alerted' && this.stateTime > 4) {
        this.state = 'suspicious';
        this.stateTime = 0;
        this.investigateX = thief.x;
        this.investigateY = thief.y;
      }
      if (this.state === 'suspicious' && this.stateTime > 5) {
        this.state = 'patrol';
        this.stateTime = 0;
      }
    }

    let tx, ty, speed;
    if (this.state === 'alerted') {
      tx = thief.x; ty = thief.y; speed = this.speed * 1.85;
    } else if (this.state === 'suspicious') {
      tx = this.investigateX; ty = this.investigateY; speed = this.speed * 1.25;
    } else {
      const wp = this.waypoints[this.wpIndex];
      tx = wp.x; ty = wp.y; speed = this.speed;
      if (dist(this.x, this.y, tx, ty) < 8) {
        this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
      }
    }

    const d = dist(this.x, this.y, tx, ty);
    if (d > 4) {
      const targetAngle = angleTo(this.x, this.y, tx, ty);
      this.angle = lerpAngle(this.angle, targetAngle, clamp(dt * 6, 0, 1));
      const step = Math.min(speed * dt, d);
      this.x += Math.cos(this.angle) * step;
      this.y += Math.sin(this.angle) * step;
    } else if (this.state === 'suspicious') {
      // Arrived at the noise: look around before giving up.
      this.angle += dt * 1.8;
    }
    for (const w of walls) resolveCircleRect(this, 16, w);

    // Fair catch: close contact with a visible thief starts a visible countdown.
    if (this.seesThief && dist(this.x, this.y, thief.x, thief.y) < GUARD_CATCH_RADIUS) {
      this.catchTimer += dt;
    } else {
      this.catchTimer = 0;
    }
  }

  get caughtThief() { return this.catchTimer >= GUARD_CATCH_GRACE; }
}
