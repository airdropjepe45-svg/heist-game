// Deterministic screenshot posing: ?shot=<name>&seed=<n> puts the game into a
// fixed, real gameplay state — never a fake image, always the live simulation
// with the thief, guards, cameras, loot and alarm placed for the camera.
//   cover — Room 1, thief mid-room beside a display case, a guard's yellow
//           cone sweeping close, a camera cone overhead, the Amber Idol
//           glowing, alarm at 38% (all required elements in one frame).
//   vault — Room 3, thief at the vault door picking the lock, guards and
//           cameras on both sides, the Midnight Diamond glowing, alarm 62%.
//   alert — Room 2, guard alerted and chasing (red cone + "!"), thief
//           sprinting for the getaway door, alarm 78%.
//   sneak — Room 1, thief sneaking along the quiet side route behind a
//           pillar while a guard patrols past, alarm 12%.
import { makeRng } from './utils.js';

export function applyShot(state, name, seed) {
  const rng = makeRng(seed || 1);
  state.screen = 'playing';
  state.message = '';
  state.messageTimer = 0;

  if (name === 'vault') {
    state.loadLevel(2);
    state.thief.x = 470; state.thief.y = 430;
    state.thief.angle = 0;
    state.thief.picking = true;
    state.thief.pickProgress = 1.6;
    state.guards[0].x = 640; state.guards[0].y = 200; state.guards[0].angle = Math.PI / 2;
    state.guards[1].x = 640; state.guards[1].y = 660; state.guards[1].angle = -Math.PI / 2;
    state.guards[2].x = 300; state.guards[2].y = 430; state.guards[2].angle = 0;
    state.guards[2].state = 'suspicious';
    state.guards[3].x = 980; state.guards[3].y = 430; state.guards[3].angle = Math.PI;
    state.cameras[0].angle = Math.PI / 2 + 0.4;
    state.cameras[1].angle = 0.3;
    state.alarm = 62;
  } else if (name === 'alert') {
    state.loadLevel(1);
    state.thief.x = 320; state.thief.y = 620;
    state.thief.angle = Math.PI;
    state.loot.taken = true;
    state.score = 1500;
    state.guards[0].x = 520; state.guards[0].y = 560; state.guards[0].angle = Math.PI;
    state.guards[0].state = 'alerted';
    state.guards[0].suspicion = 1;
    state.guards[0].catchTimer = 0.45;
    state.guards[1].x = 700; state.guards[1].y = 470; state.guards[1].angle = Math.PI;
    state.guards[1].state = 'suspicious';
    state.guards[2].x = 1150; state.guards[2].y = 430; state.guards[2].angle = Math.PI / 2;
    state.cameras[0].angle = Math.PI / 2 - 0.5;
    state.cameras[1].angle = Math.PI + 0.4;
    state.cameras[1].seesThief = true;
    state.alarm = 78;
  } else if (name === 'sneak') {
    state.loadLevel(0);
    state.thief.x = 300; state.thief.y = 420;
    state.thief.angle = Math.PI / 2;
    state.thief.sneaking = true;
    state.guards[0].x = 380; state.guards[0].y = 480; state.guards[0].angle = Math.PI / 2;
    state.guards[1].x = 900; state.guards[1].y = 430; state.guards[1].angle = -Math.PI / 2;
    state.cameras[0].angle = Math.PI / 2 + 0.6;
    state.cameras[1].angle = -0.4;
    state.alarm = 12;
  } else {
    // cover (default): Room 1, everything in one frame.
    state.loadLevel(0);
    state.thief.x = 640; state.thief.y = 480;
    state.thief.angle = -Math.PI / 2;
    state.guards[0].x = 760; state.guards[0].y = 300; state.guards[0].angle = Math.PI / 2 + 0.5;
    state.guards[0].state = 'suspicious';
    state.guards[0].suspicion = 0.6;
    state.guards[1].x = 980; state.guards[1].y = 660; state.guards[1].angle = Math.PI;
    state.cameras[0].angle = Math.PI / 2 + 0.5;
    state.cameras[1].angle = 0.5;
    state.alarm = 38;
    state.score = 500;
  }
  // Tiny deterministic jitter from the seed so different seeds pose differently.
  state.thief.x += Math.floor(rng() * 5) - 2;
  state.thief.y += Math.floor(rng() * 5) - 2;
  state.time = 12.5;
}
