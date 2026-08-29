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
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
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
const PATHNAME = process.argv[2] ?? '/';
const OUT = process.argv[3] ?? '.captures';
const PORT = 9222;
const WIDTH = Number(process.env.CAPTURE_WIDTH ?? 1600);
const HEIGHT = Number(process.env.CAPTURE_HEIGHT ?? 900);

/* The five beats plus the closing hold. Anything scroll-driven is only worth
   judging at the positions the copy changes on. */
const HERO_BEATS = [0, 0.22, 0.44, 0.65, 0.86, 1];

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
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), 'capture-'))}`,
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
    'about:blank',
  ],
  { stdio: 'ignore' },
);

let target;
for (let i = 0; i < 60 && !target?.webSocketDebuggerUrl; i += 1) {
  await sleep(400);
  try {
    const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
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
const shoot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  if (!r.result?.data) return console.log('no data for', name);
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(r.result.data, 'base64'));
  console.log('wrote', join(OUT, `${name}.png`));
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: WIDTH,
  height: HEIGHT,
  deviceScaleFactor: 1,
  mobile: false,
});
await send('Page.navigate', { url: ORIGIN + PATHNAME });
for (let i = 0; i < 50 && !seen.includes('Page.loadEventFired'); i += 1) await sleep(200);
/* The scene is a dynamic import behind a WebGL feature check; software
   rendering needs a while to produce a first frame worth looking at. */
await sleep(3500);

const diag = await evaluate(`(async () => {
  let frames = 0;
  const tick = () => { frames += 1; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  await new Promise((r) => setTimeout(r, 600));
  /* smooth scrolling makes scrollTo asynchronous, which silently returns
     identical, plausible, wrong frames for every beat */
  document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important');
  const canvas = document.querySelector('canvas');
  return {
    frames,
    hero: document.querySelector('[data-hero]')?.dataset.hero ?? null,
    canvas: canvas ? [canvas.width, canvas.height] : null,
  };
})()`);
console.log('diag', JSON.stringify(diag));
if (diag.frames === 0) console.log('WARNING: no animation frames — nothing 3D will have rendered');

const hero = await evaluate(`!!document.querySelector('[data-hero="animated"]')`);

if (hero && PATHNAME === '/') {
  for (const p of HERO_BEATS) {
    await evaluate(`(async () => {
      const track = document.querySelector('[data-hero="animated"]');
      const rect = track.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const scrollable = Math.max(0, rect.height - window.innerHeight);
      window.scrollTo(0, top + scrollable * ${p});
      let last = -1, stable = 0;
      for (let i = 0; i < 40; i += 1) {
        await new Promise((r) => setTimeout(r, 50));
        if (window.scrollY === last) { if ((stable += 1) >= 3) break; } else { stable = 0; last = window.scrollY; }
      }
      await new Promise((r) => setTimeout(r, 900));
    })()`);
    await shoot(`beat-${String(p).replace('.', '_')}`);
  }
} else {
  await shoot(PATHNAME.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'index');
}

ws.close();
chrome.kill();
