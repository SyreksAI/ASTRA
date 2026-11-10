/**
 * Renders public/rexon/rexon-intro.html to MP4 via Puppeteer + ffmpeg.
 * Run from frontend/: node scripts/render-rexon-intro-video.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const htmlPath = path.join(frontendRoot, 'public', 'rexon', 'rexon-intro.html');
const outDir = path.join(frontendRoot, 'public', 'rexon', '_frames');
const outMp4 = path.join(frontendRoot, 'public', 'rexon', 'rexon-intro.mp4');

const FPS = 30;
const DURATION_MS = 2200;
const WIDTH = 1440;
const HEIGHT = 320;

async function main() {
  const puppeteer = await import('puppeteer');
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(outDir)) {
    if (f.endsWith('.png')) fs.unlinkSync(path.join(outDir, f));
  }

  const browser = await puppeteer.default.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.querySelector('.replay')?.remove());

  const logo = await page.$('.rexon-intro');
  if (!logo) throw new Error('.rexon-intro not found');

  const frameCount = Math.ceil((DURATION_MS / 1000) * FPS);
  const delay = 1000 / FPS;

  for (let i = 0; i < frameCount; i++) {
    const name = `frame-${String(i).padStart(4, '0')}.png`;
    await logo.screenshot({ path: path.join(outDir, name), type: 'png' });
    if (i < frameCount - 1) await new Promise((r) => setTimeout(r, delay));
  }

  await browser.close();

  const ff = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-framerate',
      String(FPS),
      '-i',
      path.join(outDir, 'frame-%04d.png'),
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      outMp4,
    ],
    { stdio: 'inherit' },
  );

  if (ff.status !== 0) {
    console.error('ffmpeg failed');
    process.exit(1);
  }

  console.log('Wrote', outMp4);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
