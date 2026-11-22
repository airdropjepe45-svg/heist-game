// The thief: moves with WASD / arrows, sneaks with Shift, and spends tools.
// Tools always cost something, so every use is a decision:
//  - Pebble (E or click): thrown toward the mouse, clatters and pulls nearby
//    guards to the landing spot. Limited count per room, no refill.
//  - EMP burst (Q): disables every camera for 6 seconds. Limited uses, and a
//    12-second cooldown, so it cannot be spammed through a camera gauntlet.
//  - Lockpick (hold Space at the loot): picking takes 2.5 seconds of standing
//    still in the open — the real moment of tension in every room.
import { clamp, dist, resolveCircleRect } from './utils.js';

export const THIEF_RADIUS = 15;
export const WALK_SPEED = 185;
export const SNEAK_SPEED = 105;
export const PICK_TIME = 2.5;
export const EMP_DURATION = 6;
export const EMP_COOLDOWN = 12;

export class Thief {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = -Math.PI / 2;
    this.sneaking = false;
    this.moving = false;
    this.pebbles = 0;
    this.empUses = 0;
    this.empCooldown = 0;
    this.pickProgress = 0;
    this.picking = false;
  }

  reset(x, y, pebbles, empUses) {
    this.x = x; this.y = y;
    this.angle = -Math.PI / 2;
    this.pebbles = pebbles;
    this.empUses = empUses;
    this.empCooldown = 0;
    this.pickProgress = 0;
    this.picking = false;
  }

  update(dt, input, walls, blocks) {
    let mx = 0, my = 0;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    if (input.up) my -= 1;
    if (input.down) my += 1;
    this.sneaking = input.sneak;
    this.moving = mx !== 0 || my !== 0;
    if (this.moving) {
      const len = Math.hypot(mx, my);
      const speed = this.sneaking ? SNEAK_SPEED : WALK_SPEED;
      this.x += (mx / len) * speed * dt;
      this.y += (my / len) * speed * dt;
      this.angle = Math.atan2(my, mx);
      this.pickProgress = 0;
      this.picking = false;
    }
    // Face the mouse when standing still, so pebbles go where the player aims.
    if (!this.moving && input.mouseX !== null) {
      this.angle = Math.atan2(input.mouseY - this.y, input.mouseX - this.x);
    }
    const solids = walls.concat(blocks);
    for (const w of solids) resolveCircleRect(this, THIEF_RADIUS, w);
    this.x = clamp(this.x, 14 + THIEF_RADIUS, 1280 - 14 - THIEF_RADIUS);
    this.y = clamp(this.y, 64 + THIEF_RADIUS, 800 - 14 - THIEF_RADIUS);
    if (this.empCooldown > 0) this.empCooldown -= dt;
  }

  // Returns a pebble landing spot, or null when none are left.
  throwPebble(targetX, targetY) {
    if (this.pebbles <= 0) return null;
    this.pebbles -= 1;
    const d = dist(this.x, this.y, targetX, targetY);
    const range = 260;
    const t = Math.min(d, range) / (d || 1);
    return { x: this.x + (targetX - this.x) * t, y: this.y + (targetY - this.y) * t };
  }

  fireEmp() {
    if (this.empUses <= 0 || this.empCooldown > 0) return false;
    this.empUses -= 1;
    this.empCooldown = EMP_COOLDOWN;
    return true;
  }

  // Hold-to-pick the loot. Returns true the moment the pick completes.
  updatePicking(dt, nearLoot, lootTaken) {
    this.picking = nearLoot && !lootTaken;
    if (!this.picking || this.moving) { this.pickProgress = 0; return false; }
    this.pickProgress += dt;
    if (this.pickProgress >= PICK_TIME) {
      this.pickProgress = 0;
      return true;
    }
    return false;
  }
}
