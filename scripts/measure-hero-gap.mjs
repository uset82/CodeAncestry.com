/* eslint-disable no-console -- a CLI tool whose entire output is its report */

/**
 * Measure the horizontal gap between the hero copy and the helix.
 *
 * The complaint "there are still gaps between the text and the 3D helix" is a
 * number, not an opinion, and it has to be measured before it can be designed
 * away. This reports three edges in CSS pixels:
 *
 *   ink    the rightmost glyph in the copy column
 *   box    the right edge of the copy column element
 *   helix  the leftmost column of pixels the WebGL canvas actually paints
 *
 * `box` and `ink` are usually far apart, which is the whole trap: widening the
 * column looks like closing the gap in the markup while the reader still sees
 * the same emptiness, because what the eye reads is the ink.
 *
 * The helix edge is found by differencing two screenshots, one with the canvas
 * visible and one with it hidden. Anything that changes is canvas. Guessing the
 * edge from camera maths is not good enough — the scrim, the taper and the
 * beat's own pose all move it.
 *
 *   npm run dev                       # in one terminal
 *   node scripts/measure-hero-gap.mjs
 *
 * Widths and height come from the environment: `GAP_WIDTHS=1600,1280`.
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

const ORIGIN = process.env.CAPTURE_ORIGIN ?? 'http://localhost:3100';
const WIDTHS = (process.env.GAP_WIDTHS ?? '1600,1440,1280').split(',').map(Number);
const HEIGHT = Number(process.env.GAP_HEIGHT ?? 900);
const SETTLE = 3500;
/* Debug framing knobs, passed straight through to the page. `GAP_EXTENT` pins
   the horizontal aim in world units, `GAP_ZOOM` scales the camera distance.
   Sweeping them here is how the composition gets chosen by measurement. */
const EXTENT = process.env.GAP_EXTENT ?? null;
const ZOOM = process.env.GAP_ZOOM ?? null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chromePath) {
  console.error('No Chrome found. Set one of:', CHROME_CANDIDATES.join(', '));
  process.exit(1);
}

const PROFILE = mkdtempSync(join(tmpdir(), 'gap-'));
const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${PROFILE}`,
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

let port;
for (let i = 0; i < 60 && !port; i += 1) {
  await sleep(300);
  try {
    port = parseInt(readFileSync(join(PROFILE, 'DevToolsActivePort'), 'utf8'), 10) || 0;
  } catch {
    /* Chrome has not written it yet */
  }
}
if (!port) {
  chrome.kill();
  throw new Error('Chrome never reported a debugging port');
}

let target;
for (let i = 0; i < 60 && !target?.webSocketDebuggerUrl; i += 1) {
  await sleep(300);
  try {
    const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
    target = list.find((t) => t.type === 'page');
  } catch {
    /* not up yet */
  }
}
if (!target) {
  chrome.kill();
  throw new Error('Chrome never opened its debugging port');
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let messageId = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg);
};
const send = (method, params = {}) =>
  new Promise((res) => {
    const id = (messageId += 1);
    pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  const failure = r.result?.exceptionDetails;
  if (failure) throw new Error(failure.exception?.description ?? JSON.stringify(failure));
  return r.result?.result?.value;
};
const shoot = async () => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  return r.result?.data ?? null;
};

/** What the driver and the camera rig actually settled on. */
const measureCam = () =>
  evaluate(`(() => ({
    lookX: window.__HELIX_LOOK_X ?? null,
    camZ: window.__HELIX_CAM_Z ?? null,
    beat: window.__HELIX_BEAT ?? null,
    side: window.__HELIX_SIDE ?? null,
    search: window.location.search,
    canvas: (() => {
      const c = document.querySelector('canvas');
      return c ? c.width + 'x' + c.height : null;
    })(),
  }))()`);

/** Right edge of the copy column, and of the ink inside it. */
const measureCopy = () =>
  evaluate(`(() => {
    const col = document.querySelector('[data-hero-copy]');
    if (!col) return { error: 'no [data-hero-copy]' };
    const box = col.getBoundingClientRect();

    /* Walk the column's own text nodes and union their client rects. The block
       elements stretch to the column width; only the glyph runs say where the
       reading actually ends. */
    const walker = document.createTreeWalker(col, NodeFilter.SHOW_TEXT);
    let inkRight = -Infinity;
    let inkLeft = Infinity;
    let nodes = 0;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.nodeValue.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) {
        if (r.width < 1 || r.height < 1) continue;
        nodes += 1;
        if (r.right > inkRight) inkRight = r.right;
        if (r.left < inkLeft) inkLeft = r.left;
      }
    }

    const h1 = col.querySelector('h1');
    const h1Range = document.createRange();
    let h1Right = null;
    let h1Size = null;
    let h1Family = null;
    if (h1) {
      h1Range.selectNodeContents(h1);
      const rects = [...h1Range.getClientRects()].filter((r) => r.width >= 1 && r.height >= 1);
      h1Right = rects.length ? Math.round(Math.max(...rects.map((r) => r.right))) : null;
      h1Size = getComputedStyle(h1).fontSize;
      h1Family = getComputedStyle(h1).fontFamily.split(',')[0].replace(/["']/g, '');
    }

    return {
      boxLeft: Math.round(box.left),
      boxRight: Math.round(box.right),
      inkLeft: Number.isFinite(inkLeft) ? Math.round(inkLeft) : null,
      inkRight: Number.isFinite(inkRight) ? Math.round(inkRight) : null,
      textRuns: nodes,
      h1Right,
      h1Size,
      h1Family,
    };
  })()`);

/**
 * Left and right edges of what the canvas paints, by differencing two frames.
 * `any` is a single changed pixel; `solid` needs three rows in the column, so a
 * one-pixel antialiased whisker cannot be mistaken for the specimen.
 */
const measureHelix = (withCanvas, withoutCanvas) =>
  evaluate(`(async () => {
    const load = async (b64) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return ctx.getImageData(0, 0, c.width, c.height);
    };
    const a = await load('${withCanvas}');
    const b = await load('${withoutCanvas}');
    const w = Math.min(a.width, b.width);
    const h = Math.min(a.height, b.height);

    const any = { left: null, right: null, top: null, bottom: null };
    const solid = { left: null, right: null, top: null, bottom: null };
    const density = [];
    const rowDensity = [];
    for (let x = 0; x < w; x += 1) {
      let changed = 0;
      for (let y = 0; y < h; y += 1) {
        const i = (y * a.width + x) * 4;
        const j = (y * b.width + x) * 4;
        const d =
          Math.abs(a.data[i] - b.data[j]) +
          Math.abs(a.data[i + 1] - b.data[j + 1]) +
          Math.abs(a.data[i + 2] - b.data[j + 2]);
        if (d > 12) {
          changed += 1;
          rowDensity[y] = (rowDensity[y] ?? 0) + 1;
        }
      }
      density.push(changed);
      if (changed > 0) {
        if (any.left === null) any.left = x;
        any.right = x;
      }
      if (changed >= 3) {
        if (solid.left === null) solid.left = x;
        solid.right = x;
      }
    }
    for (let y = 0; y < h; y += 1) {
      const n = rowDensity[y] ?? 0;
      if (n > 0) {
        if (any.top === null) any.top = y;
        any.bottom = y;
      }
      if (n >= 3) {
        if (solid.top === null) solid.top = y;
        solid.bottom = y;
      }
    }
    return {
      width: w,
      height: h,
      anyLeft: any.left,
      anyRight: any.right,
      solidLeft: solid.left,
      solidRight: solid.right,
      anyTop: any.top,
      anyBottom: any.bottom,
      solidTop: solid.top,
      solidBottom: solid.bottom,
      density,
    };
  })()`);

console.log(`hero gap report — ${ORIGIN}/?helix=high`);
console.log('');

for (const width of WIDTHS) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height: HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.enable');
  const url = new URL('/', ORIGIN);
  url.searchParams.set('helix', 'high');
  if (EXTENT !== null) url.searchParams.set('extent', EXTENT);
  if (ZOOM !== null) url.searchParams.set('zoom', ZOOM);
  await send('Page.navigate', { url: url.toString() });
  await sleep(SETTLE);

  const copy = await measureCopy();
  const cam = await measureCam();
  const withCanvas = await shoot();
  await evaluate(`(() => {
    const c = document.querySelector('canvas');
    if (c) c.style.visibility = 'hidden';
    return !!c;
  })()`);
  await sleep(400);
  const withoutCanvas = await shoot();
  await evaluate(`(() => {
    const c = document.querySelector('canvas');
    if (c) c.style.visibility = '';
    return !!c;
  })()`);

  if (copy.error || !withCanvas || !withoutCanvas) {
    console.log(`${width}x${HEIGHT}  SKIPPED ${copy.error ?? 'no screenshot'}`);
    continue;
  }

  const helix = await measureHelix(withCanvas, withoutCanvas);
  const gapInk = helix.solidLeft === null ? null : helix.solidLeft - copy.inkRight;
  const gapBox = helix.solidLeft === null ? null : helix.solidLeft - copy.boxRight;

  console.log(`${width}x${HEIGHT}`);
  console.log(
    `  copy    box ${copy.boxLeft}..${copy.boxRight}   ink ${copy.inkLeft}..${copy.inkRight}   (${copy.textRuns} text runs)`,
  );
  console.log(`  h1      right ${copy.h1Right}  size ${copy.h1Size}  family ${copy.h1Family}`);
  console.log(
    `  cam     lookX ${cam.lookX}  z ${cam.camZ?.toFixed?.(2)}  beat ${cam.beat}  side ${cam.side}  canvas ${cam.canvas}  ${cam.search}`,
  );
  const span = helix.solidRight - helix.solidLeft;
  const centre = Math.round((helix.solidLeft + helix.solidRight) / 2);
  const vspan = helix.solidBottom - helix.solidTop;
  console.log(
    `  helix   x ${helix.solidLeft}..${helix.solidRight} (any ${helix.anyLeft}..${helix.anyRight})` +
      `  span ${span}px  centre ${centre}  (${Math.round((100 * span) / width)}% of frame)`,
  );
  console.log(
    `          y ${helix.solidTop}..${helix.solidBottom}  span ${vspan}px` +
      `  (${Math.round((100 * vspan) / HEIGHT)}% of height)  aspect ${(span / vspan).toFixed(2)}`,
  );
  console.log(`  GAP     box -> helix ${gapBox}px     ink -> helix ${gapInk}px`);
  /* Coarse column profile. A specimen that reads as half the composition shows
     a solid run of buckets on the right; one shoved off the edge shows a single
     clipped bucket hard against the frame. */
  const BUCKETS = 40;
  const per = Math.ceil(helix.density.length / BUCKETS);
  const bars = [];
  for (let b = 0; b < BUCKETS; b += 1) {
    let sum = 0;
    for (let i = b * per; i < (b + 1) * per && i < helix.density.length; i += 1) {
      sum += helix.density[i];
    }
    bars.push(sum / per / HEIGHT);
  }
  const ramp = ' .:-=+*#%@';
  console.log(
    `  profile |${bars
      .map((v) => ramp[Math.min(ramp.length - 1, Math.round(Math.sqrt(v) * (ramp.length - 1)))])
      .join('')}|`,
  );
  console.log('');
}

ws.close();
chrome.kill();
