/* eslint-disable no-console -- a CLI tool whose entire output is its report */

/**
 * Screenshot any page of the running dev server, including WebGL.
 *
 * Why this exists: the agent browser panes in this project do not composite, so
 * `requestAnimationFrame` never fires, React Three Fiber never renders and every
 * capture comes back black. That cost several rounds of work being "verified"
 * by calculation and shipped without anyone looking at it.
 *
 * Chrome headless with swiftshader renders WebGL in software and can be driven
 * over CDP with no dependencies at all — Node 22 has a WebSocket client built
 * in. Roughly two frames a second, which is useless for judging motion and
 * perfectly adequate for judging a frame.
 *
 *   npm run dev                       # in one terminal
 *   node scripts/capture.mjs                                   # the hero beats
 *   node scripts/capture.mjs /explore                          # one page
 *   node scripts/capture.mjs /family/keylit out/tree           # page + folder
 *
 * Output lands in `.captures/` by default, which is gitignored.
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
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
const RAW = process.argv[2] ?? '/';
const targetUrl = new URL(RAW, ORIGIN);
const PATHNAME = targetUrl.pathname;
const OUT = process.argv[3] ?? '.captures';
/* Port 0 lets the OS pick a free one; Chrome writes it to DevToolsActivePort
   inside the profile. A fixed 9222 meant a second run attached to a stale
   browser from a first run and hung forever, which has already cost a debugging
   session. */
const PROFILE = mkdtempSync(join(tmpdir(), 'capture-'));
const WIDTH = Number(process.env.CAPTURE_WIDTH ?? 1600);
const HEIGHT = Number(process.env.CAPTURE_HEIGHT ?? 900);
const REDUCED = process.env.CAPTURE_REDUCED_MOTION === '1';
const NO_WEBGL = process.env.CAPTURE_NO_WEBGL === '1';

if (PATHNAME === '/' && !targetUrl.searchParams.has('helix') && !REDUCED && !NO_WEBGL) {
  targetUrl.searchParams.set('helix', 'high');
}

/* Twelve section anchors. The driver reads `[data-beat]`, not scroll fractions. */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chromePath) {
  console.error('No Chrome found. Set one of:', CHROME_CANDIDATES.join(', '));
  process.exit(1);
}
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${PROFILE}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    '--hide-scrollbars',
    /* Software WebGL. Without these three there is no GL context at all in
       headless and the canvas renders nothing, silently. */
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    ...(NO_WEBGL ? ['--disable-webgl', '--disable-webgl2'] : []),
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
const seen = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  } else if (msg.method) {
    seen.push(msg.method);
  }
};
const send = (method, params = {}) =>
  new Promise((res) => {
    const id = (messageId += 1);
    pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  const failure = r.result?.exceptionDetails;
  if (failure) throw new Error(failure.exception?.description ?? JSON.stringify(failure));
  return r.result?.result?.value;
};
const luminanceOf = async (data) =>
  evaluate(`(async () => {
    const img = new Image();
    img.src = 'data:image/png;base64,${data}';
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const pix = ctx.getImageData(0, 0, c.width, c.height).data;
    let above = 0;
    let max = 0;
    for (let i = 0; i < pix.length; i += 4) {
      const y = 0.2126 * pix[i] + 0.7152 * pix[i + 1] + 0.0722 * pix[i + 2];
      if (y > 120) above += 1;
      if (y > max) max = y;
    }
    return { above: Number(((100 * above) / (pix.length / 4)).toFixed(2)), max: Number(max.toFixed(1)) };
  })()`);

const shoot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  if (!r.result?.data) return console.log('no data for', name);
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(r.result.data, 'base64'));
  const lum = await luminanceOf(r.result.data);
  console.log('wrote', join(OUT, `${name}.png`), 'luminance', JSON.stringify(lum));
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: WIDTH,
  height: HEIGHT,
  deviceScaleFactor: 1,
  mobile: WIDTH < 800,
});
if (REDUCED) {
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
}
await send('Page.navigate', { url: targetUrl.href });
for (let i = 0; i < 50 && !seen.includes('Page.loadEventFired'); i += 1) await sleep(200);
/* The scene is a dynamic import behind a WebGL feature check; software
   rendering needs a while to produce a first frame worth looking at. */
await sleep(3500);

const diag = await evaluate(`(async () => {
  let frames = 0;
  const dts = [];
  let last = performance.now();
  const tick = (now) => {
    frames += 1;
    dts.push(now - last);
    last = now;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  await new Promise((r) => setTimeout(r, 600));
  /* smooth scrolling makes scrollTo asynchronous, which silently returns
     identical, plausible, wrong frames for every beat */
  document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important');
  const canvas = document.querySelector('canvas');
  const sample = dts.slice(1);
  const mean = sample.length ? sample.reduce((a, b) => a + b, 0) / sample.length : 0;
  return {
    frames,
    meanDt: Number(mean.toFixed(1)),
    hero: document.querySelector('[data-hero]')?.dataset.hero ?? null,
    beats: document.querySelectorAll('[data-beat]').length,
    helixFrames: window.__HELIX_FRAMES ?? null,
    helixLoop: window.__HELIX_LOOP ?? document.documentElement.dataset.helixLoop ?? null,
    canvas: canvas ? [canvas.width, canvas.height] : null,
    search: window.location.search,
  };
})()`);
console.log('diag', JSON.stringify(diag));
if (diag.frames === 0 && !diag.helixFrames) {
  console.log('WARNING: no animation frames — nothing 3D will have rendered');
}

const beatCount = await evaluate(`document.querySelectorAll('[data-beat]').length`);

const waitScroll = async () => {
  await evaluate(`(async () => {
    let last = -1, stable = 0;
    for (let i = 0; i < 40; i += 1) {
      await new Promise((r) => setTimeout(r, 50));
      if (window.scrollY === last) { if ((stable += 1) >= 3) break; } else { stable = 0; last = window.scrollY; }
    }
    await new Promise((r) => setTimeout(r, 900));
  })()`);
};

if (PATHNAME === '/' && beatCount > 0) {
  const beats = await evaluate(`[...new Set([...document.querySelectorAll('[data-beat]')]
    .map((el) => Number(el.dataset.beat))
    .filter((n) => Number.isFinite(n)))].sort((a, b) => a - b)`);
  for (const beat of beats) {
    await evaluate(`(async () => {
      const el = document.querySelector('[data-beat="${beat}"]');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const y = rect.top + window.scrollY + rect.height / 2 - window.innerHeight / 2;
      window.scrollTo(0, Math.max(0, y));
    })()`);
    await waitScroll();
    await shoot(`beat-${String(beat).padStart(2, '0')}`);
  }

  await evaluate(`window.scrollTo(0, document.documentElement.scrollHeight)`);
  await waitScroll();
  const before = await evaluate(`window.__HELIX_FRAMES ?? 0`);
  await sleep(800);
  const after = await evaluate(`window.__HELIX_FRAMES ?? 0`);
  const loop = await evaluate(`window.__HELIX_LOOP ?? document.documentElement.dataset.helixLoop ?? null`);
  console.log('suspend', JSON.stringify({ loop, helixFramesDelta: after - before, before, after }));
  await shoot('footer-suspend');
} else {
  await shoot(PATHNAME.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'index');
}

ws.close();
chrome.kill();
