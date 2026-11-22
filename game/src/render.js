// All canvas drawing for The Midnight Vault: marble floor, rugs, paintings,
// display cases, plants, statues, warm lamp pools, the night mask, guards with
// coloured vision cones, sweeping cameras, the glowing loot, the getaway door,
// the thief, and the HUD (alarm meter, loot, tools, room, score) plus the
// title / pause / caught / room-clear / win overlays. Text is drawn big and
// high-contrast so every screenshot stays readable when shrunk to ~300 px.
import { GUARD_VIEW_HALF_ANGLE, GUARD_VIEW_RANGE } from './guard.js';
import { CAMERA_VIEW_HALF_ANGLE } from './camera.js';
import { PICK_TIME } from './thief.js';
import { PLAY_TOP } from './levels.js';

const W = 1280;
const H = 800;

function conePath(ctx, x, y, angle, half, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, half, range, fill, edge) {
  conePath(ctx, x, y, angle, half, range);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function renderGame(ctx, state) {
  const level = state.level;
  const thief = state.thief;

  // --- Floor: dark marble with big checker tiles and a centre medallion.
  ctx.fillStyle = '#1c1a26';
  ctx.fillRect(0, PLAY_TOP, W, H - PLAY_TOP);
  const tile = 80;
  for (let ty = PLAY_TOP; ty < H; ty += tile) {
    for (let tx = 0; tx < W; tx += tile) {
      const odd = ((tx / tile) + (ty / tile)) % 2 === 0;
      ctx.fillStyle = odd ? '#211e2e' : '#1a1825';
      ctx.fillRect(tx, ty, tile, tile);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx + 0.5, ty + 0.5, tile, tile);
    }
  }
  ctx.strokeStyle = 'rgba(212,175,55,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(640, 430, 120, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(640, 430, 100, 0, Math.PI * 2); ctx.stroke();

  // --- Props: rugs, paintings, plants, statues, display cases.
  for (const p of level.props) {
    if (p.kind === 'rug') {
      ctx.fillStyle = '#5b2333';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.strokeRect(p.x + 8, p.y + 8, p.w - 16, p.h - 16);
      ctx.fillStyle = 'rgba(212,175,55,0.25)';
      ctx.beginPath(); ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 16, 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === 'painting') {
      ctx.fillStyle = '#3a2c14';
      ctx.fillRect(p.x - 6, p.y - 6, p.w + 12, p.h + 12);
      ctx.fillStyle = p.hue;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.arc(p.x + p.w * 0.35, p.y + p.h * 0.4, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(p.x, p.y + p.h * 0.62, p.w, p.h * 0.38);
    } else if (p.kind === 'plant') {
      ctx.fillStyle = '#7a4a21';
      ctx.fillRect(p.x - 12, p.y - 8, 24, 18);
      ctx.fillStyle = '#2e7d32';
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.45;
        ctx.beginPath();
        ctx.ellipse(p.x + Math.cos(a) * 12, p.y - 14 + Math.sin(a) * 10, 7, 16, a, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (p.kind === 'statue') {
      ctx.fillStyle = '#8d8d9a';
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 12, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(p.x - 6, p.y - 22, 12, 32);
      ctx.beginPath(); ctx.arc(p.x, p.y - 30, 11, 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === 'lamp') {
      ctx.fillStyle = 'rgba(255,190,90,0.10)';
      ctx.beginPath(); ctx.arc(p.x, p.y, 110, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b4f1d';
      ctx.fillRect(p.x - 3, p.y - 26, 6, 52);
      ctx.fillStyle = '#ffd98a';
      ctx.beginPath(); ctx.arc(p.x, p.y - 30, 12, 0, Math.PI * 2); ctx.fill();
    }
  }

  // --- Display cases (glass boxes that block movement and sight).
  for (const b of level.blocks) {
    ctx.fillStyle = '#2c2a3a';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(150,200,255,0.18)';
    ctx.fillRect(b.x + 6, b.y + 6, b.w - 12, b.h - 12);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath(); ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 8, 0, Math.PI * 2); ctx.fill();
  }

  // --- Walls: dark stone with a gold top edge.
  for (const w of level.walls) {
    ctx.fillStyle = '#3d3a4d';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(w.x, w.y, w.w, 3);
  }

  // --- Getaway door: big green exit, labelled, always obvious.
  const ex = level.exit;
  ctx.fillStyle = '#1e7d32';
  roundRect(ctx, ex.x - 46, ex.y - 46, 92, 92, 10);
  ctx.fill();
  ctx.strokeStyle = '#a5ff9e';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#eaffea';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', ex.x, ex.y + 2);
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('GETAWAY', ex.x, ex.y + 24);
  if (state.loot.taken) {
    ctx.strokeStyle = '#a5ff9e';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(ex.x, ex.y, 58 + Math.sin(state.time * 4) * 4, 0, Math.PI * 2); ctx.stroke();
  }

  // --- Loot: glowing pedestal + big gem, labelled with its name.
  const loot = state.loot;
  if (!loot.taken) {
    const pulse = 1 + Math.sin(state.time * 3) * 0.12;
    ctx.fillStyle = 'rgba(255,176,46,0.20)';
    ctx.beginPath(); ctx.arc(loot.x, loot.y, 52 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a3b1a';
    ctx.beginPath(); ctx.ellipse(loot.x, loot.y + 18, 30, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = level.lootColor;
    ctx.beginPath();
    ctx.moveTo(loot.x, loot.y - 26);
    ctx.lineTo(loot.x + 20, loot.y - 4);
    ctx.lineTo(loot.x, loot.y + 16);
    ctx.lineTo(loot.x - 20, loot.y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(loot.x, loot.y - 26);
    ctx.lineTo(loot.x + 20, loot.y - 4);
    ctx.lineTo(loot.x, loot.y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(level.lootName.toUpperCase(), loot.x, loot.y - 40);
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#ffd98a';
    ctx.fillText('HOLD SPACE TO PICK THE LOCK', loot.x, loot.y + 44);
  }

  // --- Cameras: wall box + bright sweeping cone (red when it sees the thief).
  for (const c of state.cameras) {
    const seen = c.seesThief;
    const fill = c.disabled
      ? 'rgba(120,120,120,0.10)'
      : seen ? 'rgba(255,40,40,0.42)' : 'rgba(255,220,90,0.30)';
    const edge = c.disabled ? 'rgba(160,160,160,0.5)' : seen ? '#ff4040' : '#ffdd55';
    drawCone(ctx, c.x, c.y, c.angle, CAMERA_VIEW_HALF_ANGLE, c.range, fill, edge);
    ctx.fillStyle = c.disabled ? '#777' : seen ? '#ff3030' : '#ddd';
    ctx.beginPath(); ctx.arc(c.x, c.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(c.x, c.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = seen ? '#ff4040' : '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.disabled ? 'CAMERA OFF' : 'CAMERA', c.x, c.y + 34);
  }

  // --- Guards: vision cone, body, facing, state mark (! / ?), catch ring.
  for (const g of state.guards) {
    const alerted = g.state === 'alerted';
    const suspicious = g.state === 'suspicious';
    const fill = alerted
      ? 'rgba(255,40,40,0.40)'
      : suspicious ? 'rgba(255,200,40,0.38)' : 'rgba(255,220,90,0.26)';
    const edge = alerted ? '#ff4040' : suspicious ? '#ffb020' : 'rgba(255,221,85,0.8)';
    drawCone(ctx, g.x, g.y, g.angle, GUARD_VIEW_HALF_ANGLE, GUARD_VIEW_RANGE, fill, edge);
    // Body: dark uniform, red when alerted, with a cap and a torch dot.
    ctx.fillStyle = alerted ? '#a93226' : '#2e4053';
    ctx.beginPath(); ctx.arc(g.x, g.y, 17, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#f5d76e';
    ctx.beginPath(); ctx.arc(g.x, g.y - 4, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(g.x + Math.cos(g.angle) * 20, g.y + Math.sin(g.angle) * 20, 4, 0, Math.PI * 2); ctx.fill();
    if (alerted || suspicious) {
      ctx.fillStyle = alerted ? '#ff3030' : '#ffcf3f';
      ctx.font = 'bold 34px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(alerted ? '!' : '?', g.x, g.y - 28);
    }
    if (g.catchTimer > 0) {
      ctx.strokeStyle = '#ff3030';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 26, -Math.PI / 2, -Math.PI / 2 + (g.catchTimer / 0.9) * Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ff4040';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CAUGHT!', g.x, g.y - 52);
    }
  }

  // --- Pebble clatter marker.
  if (state.noise) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(state.noise.x, state.noise.y, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CLINK!', state.noise.x, state.noise.y - 18);
  }

  // --- Thief: black cloak, gold trim, mask, direction nose.
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(thief.x, thief.y, 15, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#f5d76e';
  ctx.beginPath(); ctx.arc(thief.x, thief.y - 3, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.fillRect(thief.x - 7, thief.y - 5, 14, 4);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(thief.x + Math.cos(thief.angle) * 17, thief.y + Math.sin(thief.angle) * 17, 3, 0, Math.PI * 2); ctx.fill();
  if (thief.sneaking) {
    ctx.fillStyle = '#9fd8ff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAKING', thief.x, thief.y - 24);
  }

  // --- Lockpick progress ring around the loot.
  if (thief.picking && !state.loot.taken) {
    ctx.strokeStyle = '#ffd98a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(state.loot.x, state.loot.y, 34, -Math.PI / 2, -Math.PI / 2 + (thief.pickProgress / PICK_TIME) * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PICKING LOCK…', state.loot.x, state.loot.y + 86);
  }

  // --- Night mask: darkness everywhere except warm pools around lamps and the thief.
  const mask = document.createElement('canvas');
  mask.width = W; mask.height = H;
  const mctx = mask.getContext('2d');
  mctx.fillStyle = 'rgba(4,4,12,0.55)';
  mctx.fillRect(0, PLAY_TOP, W, H - PLAY_TOP);
  mctx.globalCompositeOperation = 'destination-out';
  for (const p of level.props) {
    if (p.kind !== 'lamp') continue;
    const g = mctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, 150);
    g.addColorStop(0, 'rgba(0,0,0,0.9)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    mctx.fillStyle = g;
    mctx.beginPath(); mctx.arc(p.x, p.y, 150, 0, Math.PI * 2); mctx.fill();
  }
  const tg = mctx.createRadialGradient(thief.x, thief.y, 20, thief.x, thief.y, 170);
  tg.addColorStop(0, 'rgba(0,0,0,0.95)');
  tg.addColorStop(1, 'rgba(0,0,0,0)');
  mctx.fillStyle = tg;
  mctx.beginPath(); mctx.arc(thief.x, thief.y, 170, 0, Math.PI * 2); mctx.fill();
  const lg = mctx.createRadialGradient(state.loot.x, state.loot.y, 10, state.loot.x, state.loot.y, 120);
  lg.addColorStop(0, 'rgba(0,0,0,0.8)');
  lg.addColorStop(1, 'rgba(0,0,0,0)');
  mctx.fillStyle = lg;
  mctx.beginPath(); mctx.arc(state.loot.x, state.loot.y, 120, 0, Math.PI * 2); mctx.fill();
  ctx.drawImage(mask, 0, 0);

  // EMP flash.
  if (state.empFlash > 0) {
    ctx.fillStyle = `rgba(120,200,255,${Math.min(0.35, state.empFlash * 0.3)})`;
    ctx.fillRect(0, PLAY_TOP, W, H - PLAY_TOP);
  }

  drawHud(ctx, state);
  drawMessage(ctx, state);
}

function drawHud(ctx, state) {
  const level = state.level;
  // HUD bar: dark, gold bottom edge, big readable text.
  ctx.fillStyle = '#0d0b16';
  ctx.fillRect(0, 0, W, PLAY_TOP);
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(0, PLAY_TOP - 3, W, 3);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f5d76e';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('THE MIDNIGHT VAULT', 16, 28);
  ctx.fillStyle = '#cfc8e8';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`${level.name.toUpperCase()}  ·  ROOM ${state.levelIndex + 1}/3`, 16, 50);

  // Alarm meter: label + wide bar + number, red and flashing when high.
  const ax = 470, ay = 16, aw = 300, ah = 26;
  ctx.fillStyle = state.alarm > 55 && Math.floor(state.time * 4) % 2 === 0 ? '#ff4040' : '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('ALARM', ax, ay + 20);
  ctx.fillStyle = '#2a2738';
  roundRect(ctx, ax + 90, ay, aw, ah, 6);
  ctx.fill();
  const frac = state.alarm / 100;
  ctx.fillStyle = state.alarm > 70 ? '#ff3030' : state.alarm > 40 ? '#ff9f1c' : '#ffd23f';
  if (frac > 0) {
    roundRect(ctx, ax + 90, ay, Math.max(12, aw * frac), ah, 6);
    ctx.fill();
  }
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  roundRect(ctx, ax + 90, ay, aw, ah, 6);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`${Math.round(state.alarm)}%`, ax + 400, ay + 20);

  // Loot + tools + score, right side.
  const lootLabel = state.loot.taken ? 'LOOT ✓' : `LOOT: ${level.lootName.toUpperCase()}`;
  ctx.fillStyle = state.loot.taken ? '#7dff8a' : '#ffd98a';
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText(lootLabel, 920, 28);
  ctx.fillStyle = '#cfc8e8';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`PEBBLES ${state.thief.pebbles}  ·  EMP ${state.thief.empUses}${state.thief.empCooldown > 0 ? ` (${Math.ceil(state.thief.empCooldown)}s)` : ''}`, 920, 50);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE ${state.score}`, 1264, 28);
  ctx.fillStyle = '#cfc8e8';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`${Math.floor(state.levelTime)}s`, 1264, 50);
  ctx.textAlign = 'left';
}

function drawMessage(ctx, state) {
  if (state.messageTimer <= 0 || !state.message) return;
  ctx.font = 'bold 18px sans-serif';
  const w = ctx.measureText(state.message).width + 40;
  ctx.fillStyle = 'rgba(13,11,22,0.85)';
  roundRect(ctx, (W - w) / 2, 76, w, 40, 8);
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffd98a';
  ctx.textAlign = 'center';
  ctx.fillText(state.message, W / 2, 103);
  ctx.textAlign = 'left';
}

function overlayPanel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(5,4,12,0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#141222';
  roundRect(ctx, 290, 160, 700, 510, 16);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText(title, W / 2, 235);
  ctx.fillStyle = '#e8e4f5';
  ctx.font = '19px sans-serif';
  let y = 288;
  for (const line of lines) {
    ctx.fillText(line, W / 2, y);
    y += 30;
  }
  ctx.textAlign = 'left';
}

export function renderOverlay(ctx, state) {
  const level = state.level;
  if (state.screen === 'title') {
    overlayPanel(ctx, 'THE MIDNIGHT VAULT', [
      'A night-museum heist in 3 rooms. Steal the loot, dodge the guards,',
      'slip past the cameras, and reach the green GETAWAY door.',
      '',
      'MOVE  WASD / Arrows      SNEAK  Shift (slower, harder to spot)',
      'PEBBLE  E or Click (lure guards — limited)      EMP  Q (kills cameras 6s)',
      'PICK LOCK  hold SPACE beside the loot      PAUSE  P      MUTE  M',
      '',
      'Watch the cones. Yellow means suspicious, red means RUN.',
      'If a guard touches you — or the ALARM hits 100% — you are caught.',
      '',
      'Press ENTER to start the heist',
    ], '#d4af37');
  } else if (state.screen === 'paused') {
    overlayPanel(ctx, 'PAUSED', [
      'The museum holds its breath.',
      '',
      'Press P or ENTER to keep stealing.',
    ], '#9fd8ff');
  } else if (state.screen === 'caught') {
    overlayPanel(ctx, 'CAUGHT!', [
      state.caughtReason,
      '',
      `You reached Room ${state.levelIndex + 1} — ${level.name}.`,
      `Score: ${state.score}`,
      '',
      'Press R or ENTER to try the room again.',
    ], '#ff4040');
  } else if (state.screen === 'roomclear') {
    overlayPanel(ctx, 'CLEAN GETAWAY!', [
      `You stole the ${level.lootName} from the ${level.name}.`,
      `Score: ${state.score}`,
      '',
      'Press ENTER for the next room.',
    ], '#7dff8a');
  } else if (state.screen === 'win') {
    overlayPanel(ctx, 'THE PERFECT HEIST!', [
      'All three rooms cleaned out — the Amber Idol, the Sapphire Crown,',
      'and the Midnight Diamond are yours. The museum never saw you coming.',
      '',
      `Final score: ${state.score}`,
      '',
      'Press ENTER to play again.',
    ], '#ffd23f');
  }
}
