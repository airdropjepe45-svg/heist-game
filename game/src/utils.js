// Shared math and geometry helpers for The Midnight Vault.
export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
export function dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }
export function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
export function lerpAngle(a, b, t) { return a + angleDiff(b, a) * t; }

// Deterministic seeded random (mulberry32) so posed screenshots are repeatable.
export function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  return function rng() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Does segment (x1,y1)-(x2,y2) hit rectangle r? Used for line-of-sight checks.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
  if (maxX < r.x || minX > r.x + r.w || maxY < r.y || minY > r.y + r.h) return false;
  if (x1 >= r.x && x1 <= r.x + r.w && y1 >= r.y && y1 <= r.y + r.h) return true;
  if (x2 >= r.x && x2 <= r.x + r.w && y2 >= r.y && y2 <= r.y + r.h) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y], [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h], [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ax, ay, bx, by] of edges) {
    const d1 = (bx - ax) * (y1 - ay) - (by - ay) * (x1 - ax);
    const d2 = (bx - ax) * (y2 - ay) - (by - ay) * (x2 - ax);
    const d3 = (x2 - x1) * (ay - y1) - (y2 - y1) * (ax - x1);
    const d4 = (x2 - x1) * (by - y1) - (y2 - y1) * (bx - x1);
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  }
  return false;
}

// True when nothing blocks the view between two points.
export function hasLineOfSight(ax, ay, bx, by, walls) {
  for (const w of walls) if (segmentHitsRect(ax, ay, bx, by, w)) return false;
  return true;
}

// Push a circle out of a rectangle; returns true when a collision happened.
export function resolveCircleRect(p, r, rect) {
  const cx = clamp(p.x, rect.x, rect.x + rect.w);
  const cy = clamp(p.y, rect.y, rect.y + rect.h);
  const dx = p.x - cx, dy = p.y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return false;
  if (d2 === 0) { p.y = rect.y - r; return true; }
  const d = Math.sqrt(d2);
  p.x = cx + (dx / d) * r;
  p.y = cy + (dy / d) * r;
  return true;
}
