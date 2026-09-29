// Abre Chromium sin ventana. Orden: CHROME_PATH → Chromium de Playwright → Google Chrome instalado.
import { chromium } from 'playwright';

const ARGS = ['--font-render-hinting=none', '--force-color-profile=srgb', '--hide-scrollbars', '--disable-lcd-text'];

export async function launchBrowser() {
  const args = [...ARGS];
  if (process.getuid?.() === 0) args.push('--no-sandbox');
  const tries = [];
  if (process.env.CHROME_PATH) tries.push({ executablePath: process.env.CHROME_PATH, args });
  tries.push({ args }, { channel: 'chrome', args });
  let lastErr;
  for (const opts of tries) {
    try { return await chromium.launch(opts); } catch (e) { lastErr = e; }
  }
  console.error(`\nNo pude abrir Chromium. Soluciones:
  1) npx playwright install chromium
  2) o indica tu navegador:  CHROME_PATH="/ruta/a/chrome" node render.mjs …\n`);
  throw lastErr;
}
