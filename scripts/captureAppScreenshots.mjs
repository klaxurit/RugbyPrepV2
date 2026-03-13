import {existsSync} from 'node:fs';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {parseArgs} from 'node:util';
import {createInterface} from 'node:readline/promises';
import {chromium} from 'playwright-core';

const DEFAULT_OUTPUT_DIR = 'tmp/app-shots';
const DEFAULT_BASE_URL = 'http://127.0.0.1:4173';
const DEFAULT_WIDTH = 430;
const DEFAULT_HEIGHT = 932;
const DEFAULT_SCALE = 2;
const DEFAULT_WAIT_MS = 900;
const DEFAULT_HIDE_SELECTORS = ['[data-testid="devtools"]'];

const DEFAULT_BROWSER_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

const {values} = parseArgs({
  options: {
    'base-url': {type: 'string'},
    route: {type: 'string', multiple: true},
    selector: {type: 'string'},
    'output-dir': {type: 'string'},
    width: {type: 'string'},
    height: {type: 'string'},
    scale: {type: 'string'},
    wait: {type: 'string'},
    hide: {type: 'string', multiple: true},
    'full-page': {type: 'boolean'},
    headed: {type: 'boolean'},
    manual: {type: 'boolean'},
    'user-data-dir': {type: 'string'},
    'browser-path': {type: 'string'},
    'ready-selector': {type: 'string'},
    name: {type: 'string'},
    help: {type: 'boolean'},
  },
  allowPositionals: false,
});

if (values.help) {
  console.log(`
Usage:
  npm run screenshots:app -- --route /landing
  npm run screenshots:app -- --route /week --selector main
  npm run screenshots:app -- --route /calendar --output-dir video/public/assets/screens
  npm run screenshots:app -- --route /week --headed --manual --user-data-dir tmp/screenshot-profile

Useful flags:
  --base-url         App URL (default: ${DEFAULT_BASE_URL})
  --route            Route to capture. Repeatable.
  --selector         Capture a specific element instead of the viewport.
  --output-dir       Output directory (default: ${DEFAULT_OUTPUT_DIR})
  --width            Viewport width (default: ${DEFAULT_WIDTH})
  --height           Viewport height (default: ${DEFAULT_HEIGHT})
  --scale            Device scale factor (default: ${DEFAULT_SCALE})
  --wait             Extra wait after load in ms (default: ${DEFAULT_WAIT_MS})
  --full-page        Capture a stitched full page screenshot.
  --hide             Selector to hide before capture. Repeatable.
  --headed           Run with a visible browser window.
  --manual           Wait for Enter before capturing.
  --user-data-dir    Persistent profile for auth/session reuse.
  --ready-selector   Wait for a selector before capturing.
  --browser-path     Explicit browser executable path.
  --name             Custom file name when capturing a single route.
`);
  process.exit(0);
}

const routes = values.route?.length ? values.route : ['/landing'];
const outputDir = values['output-dir'] ?? DEFAULT_OUTPUT_DIR;
const baseUrl = (values['base-url'] ?? DEFAULT_BASE_URL).replace(/\/$/, '');
const width = Number.parseInt(values.width ?? `${DEFAULT_WIDTH}`, 10);
const height = Number.parseInt(values.height ?? `${DEFAULT_HEIGHT}`, 10);
const scale = Number.parseFloat(values.scale ?? `${DEFAULT_SCALE}`);
const waitMs = Number.parseInt(values.wait ?? `${DEFAULT_WAIT_MS}`, 10);
const selector = values.selector;
const fullPage = Boolean(values['full-page']);
const headed = Boolean(values.headed);
const manual = Boolean(values.manual);
const readySelector = values['ready-selector'];
const customName = values.name;
const hideSelectors = [...DEFAULT_HIDE_SELECTORS, ...(values.hide ?? [])].filter(Boolean);

if (Number.isNaN(width) || Number.isNaN(height) || Number.isNaN(scale) || Number.isNaN(waitMs)) {
  throw new Error('width, height, scale and wait must be numeric values.');
}

if (customName && routes.length > 1) {
  throw new Error('--name can only be used when a single --route is provided.');
}

const browserPath = resolveBrowserPath(values['browser-path']);

if (!browserPath) {
  throw new Error(
    'No compatible Chrome/Chromium browser was found. Pass --browser-path explicitly.'
  );
}

await mkdir(outputDir, {recursive: true});

const context = values['user-data-dir']
  ? await chromium.launchPersistentContext(values['user-data-dir'], {
      executablePath: browserPath,
      headless: !headed,
      viewport: {width, height},
      deviceScaleFactor: scale,
      isMobile: true,
      hasTouch: true,
      colorScheme: 'dark',
      locale: 'fr-FR',
      serviceWorkers: 'block',
      args: ['--hide-scrollbars', '--disable-dev-shm-usage'],
    })
  : await chromium.launch({
      executablePath: browserPath,
      headless: !headed,
      args: ['--hide-scrollbars', '--disable-dev-shm-usage'],
    }).then((browser) =>
      browser.newContext({
        viewport: {width, height},
        deviceScaleFactor: scale,
        isMobile: true,
        hasTouch: true,
        colorScheme: 'dark',
        locale: 'fr-FR',
        serviceWorkers: 'block',
      })
    );

try {
  const page = context.pages()[0] ?? (await context.newPage());
  await page.emulateMedia({reducedMotion: 'reduce'});

  for (const route of routes) {
    const targetUrl = new URL(route, `${baseUrl}/`).toString();
    const fileName = customName ?? `${sanitizeRoute(route)}.png`;
    const outputPath = path.resolve(outputDir, fileName);

    await page.goto(targetUrl, {waitUntil: 'domcontentloaded'});
    await page.waitForTimeout(250);
    await page.waitForLoadState('networkidle', {timeout: 3000}).catch(() => {});
    await stabilizePage(page, waitMs, hideSelectors);

    if (readySelector) {
      await page.locator(readySelector).first().waitFor({state: 'visible', timeout: 5000});
    }

    if (manual) {
      await waitForEnter(`Ready on ${targetUrl}. Press Enter to capture ${fileName}...`);
      await stabilizePage(page, 250, hideSelectors);
    }

    if (selector) {
      const locator = page.locator(selector).first();
      await locator.waitFor({state: 'visible', timeout: 5000});
      await locator.screenshot({
        path: outputPath,
        animations: 'disabled',
        caret: 'hide',
        scale: 'device',
      });
    } else {
      await page.screenshot({
        path: outputPath,
        fullPage,
        animations: 'disabled',
        caret: 'hide',
        scale: 'device',
      });
    }

    console.log(`Captured ${targetUrl}`);
    console.log(` -> ${outputPath}`);
  }
} finally {
  await context.close();
}

function resolveBrowserPath(explicitPath) {
  if (explicitPath) {
    return explicitPath;
  }

  return DEFAULT_BROWSER_PATHS.find((candidate) => existsSync(candidate)) ?? null;
}

function sanitizeRoute(route) {
  const cleanRoute = route.split('?')[0]?.split('#')[0] ?? route;
  const collapsed = cleanRoute.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9]+/g, '-');
  return collapsed.length > 0 ? collapsed : 'root';
}

async function stabilizePage(page, waitMs, hideSelectors) {
  await page.addStyleTag({
    content: `
      * , *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
      html {
        scroll-behavior: auto !important;
      }
      * {
        scrollbar-width: none !important;
      }
      *::-webkit-scrollbar {
        display: none !important;
      }
    `,
  });

  await page.evaluate(async (selectors) => {
    await document.fonts?.ready?.catch?.(() => {});

    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((node) => {
        node.setAttribute('data-screenshot-hidden', 'true');
        if (node instanceof HTMLElement) {
          node.style.visibility = 'hidden';
        }
      });
    }
  }, hideSelectors);

  await page.waitForTimeout(waitMs);
}

async function waitForEnter(message) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    await rl.question(`${message}\n`);
  } finally {
    rl.close();
  }
}
