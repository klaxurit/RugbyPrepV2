import {existsSync} from 'node:fs';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {parseArgs} from 'node:util';
import {createInterface} from 'node:readline/promises';
import {chromium} from 'playwright-core';

const DEFAULT_OUTPUT_DIR = 'tmp/app-shots';
const DEFAULT_BASE_URL = 'http://127.0.0.1:4173';
const AUTO_BASE_URLS = [
  'http://127.0.0.1:4173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://localhost:5173',
  'http://127.0.0.1:4174',
  'http://127.0.0.1:5174',
];
const DEFAULT_WIDTH = 430;
const DEFAULT_HEIGHT = 932;
const DEFAULT_SCALE = 2;
const DEFAULT_WAIT_MS = 900;
const DEFAULT_MAX_CAPTURE_HEIGHT = 16000;
const DEFAULT_HIDE_SELECTORS = ['[data-testid="devtools"]'];

const DEFAULT_BROWSER_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

async function main() {
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
      'fit-height': {type: 'boolean'},
      'max-height': {type: 'string'},
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
  --base-url         App URL (auto-detects Vite ports if omitted, default target: ${DEFAULT_BASE_URL})
  --route            Route to capture. Repeatable.
  --selector         Capture a specific element instead of the viewport.
  --output-dir       Output directory (default: ${DEFAULT_OUTPUT_DIR})
  --width            Viewport width (default: ${DEFAULT_WIDTH})
  --height           Viewport height (default: ${DEFAULT_HEIGHT})
  --scale            Device scale factor (default: ${DEFAULT_SCALE})
  --wait             Extra wait after load in ms (default: ${DEFAULT_WAIT_MS})
  --full-page        Capture a stitched full page screenshot.
  --fit-height       Resize the viewport to the content height before capture.
  --max-height       Maximum viewport height used with --fit-height (default: ${DEFAULT_MAX_CAPTURE_HEIGHT})
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
  const width = Number.parseInt(values.width ?? `${DEFAULT_WIDTH}`, 10);
  const height = Number.parseInt(values.height ?? `${DEFAULT_HEIGHT}`, 10);
  const scale = Number.parseFloat(values.scale ?? `${DEFAULT_SCALE}`);
  const waitMs = Number.parseInt(values.wait ?? `${DEFAULT_WAIT_MS}`, 10);
  const maxCaptureHeight = Number.parseInt(
    values['max-height'] ?? `${DEFAULT_MAX_CAPTURE_HEIGHT}`,
    10
  );
  const selector = values.selector;
  const fullPage = Boolean(values['full-page']);
  const fitHeight = Boolean(values['fit-height']);
  const headed = Boolean(values.headed);
  const manual = Boolean(values.manual);
  const readySelector = values['ready-selector'];
  const customName = values.name;
  const hideSelectors = [...DEFAULT_HIDE_SELECTORS, ...(values.hide ?? [])].filter(Boolean);

  if (
    Number.isNaN(width) ||
    Number.isNaN(height) ||
    Number.isNaN(scale) ||
    Number.isNaN(waitMs) ||
    Number.isNaN(maxCaptureHeight)
  ) {
    throw new Error('width, height, scale, wait and max-height must be numeric values.');
  }

  if (maxCaptureHeight < height) {
    throw new Error('--max-height must be greater than or equal to the viewport height.');
  }

  if (customName && routes.length > 1) {
    throw new Error('--name can only be used when a single --route is provided.');
  }

  const browserPath = resolveBrowserPath(values['browser-path']);
  const baseUrl = await resolveBaseUrl(values['base-url']);

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
      await page.setViewportSize({width, height});

      const targetUrl = new URL(route, `${baseUrl}/`).toString();
      const fileName = customName ?? `${sanitizeRoute(route)}.png`;
      const outputPath = path.resolve(outputDir, fileName);

      try {
        await page.goto(targetUrl, {waitUntil: 'domcontentloaded'});
      } catch (error) {
        throw new Error(formatNavigationError(targetUrl, error), {cause: error});
      }
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

      if (fitHeight) {
        await fitViewportToContent({
          page,
          selector,
          width,
          minHeight: height,
          maxHeight: maxCaptureHeight,
        });
        await stabilizePage(page, 150, hideSelectors);
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
}

function resolveBrowserPath(explicitPath) {
  if (explicitPath) {
    return explicitPath;
  }

  return DEFAULT_BROWSER_PATHS.find((candidate) => existsSync(candidate)) ?? null;
}

async function resolveBaseUrl(explicitBaseUrl) {
  if (explicitBaseUrl) {
    const normalized = explicitBaseUrl.replace(/\/$/, '');
    const reachable = await isReachable(normalized);

    if (!reachable) {
      throw new Error(
        [
          `The provided --base-url is unreachable: ${normalized}`,
          'Start your app first, or pass the correct URL.',
          'Examples:',
          '  npm run dev -- --host 127.0.0.1 --port 5173',
          '  npm run preview -- --host 127.0.0.1 --port 4173',
        ].join('\n')
      );
    }

    return normalized;
  }

  for (const candidate of AUTO_BASE_URLS) {
    if (await isReachable(candidate)) {
      if (candidate !== DEFAULT_BASE_URL) {
        console.log(`Auto-detected app URL: ${candidate}`);
      }

      return candidate;
    }
  }

  throw new Error(
    [
      `No local app server detected. Tried: ${AUTO_BASE_URLS.join(', ')}`,
      'Start the app first, then run the screenshot command again.',
      'Examples:',
      '  npm run dev -- --host 127.0.0.1 --port 5173',
      '  npm run preview -- --host 127.0.0.1 --port 4173',
      'Or pass a URL explicitly:',
      '  npm run screenshots:app -- --base-url http://127.0.0.1:5173 --route /landing',
    ].join('\n')
  );
}

async function isReachable(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/`, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(1200),
    });

    return response.status > 0;
  } catch {
    return false;
  }
}

function sanitizeRoute(route) {
  const cleanRoute = route.split('?')[0]?.split('#')[0] ?? route;
  const collapsed = cleanRoute.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9]+/g, '-');
  return collapsed.length > 0 ? collapsed : 'root';
}

async function fitViewportToContent({page, selector, width, minHeight, maxHeight}) {
  const measuredHeight = await page.evaluate((targetSelector) => {
    if (targetSelector) {
      const node = document.querySelector(targetSelector);
      if (!node) return null;

      const rect = node.getBoundingClientRect();
      return Math.ceil(rect.top + window.scrollY + rect.height + 24);
    }

    return Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      document.documentElement.offsetHeight,
      document.body.offsetHeight
    );
  }, selector);

  if (measuredHeight == null) {
    throw new Error(`Could not measure selector height for "${selector}".`);
  }

  const boundedHeight = Math.max(minHeight, Math.min(maxHeight, measuredHeight));
  await page.setViewportSize({width, height: boundedHeight});
  await page.evaluate(() => window.scrollTo(0, 0));

  if (measuredHeight > maxHeight) {
    console.warn(
      `Capture height capped at ${maxHeight}px (measured ${measuredHeight}px). Increase --max-height if needed.`
    );
  }
}

function formatNavigationError(targetUrl, error) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('ERR_CONNECTION_REFUSED')) {
    return [
      `Could not open ${targetUrl}`,
      'The app server is not reachable anymore.',
      'Restart it with one of these commands:',
      '  npm run dev -- --host 127.0.0.1 --port 5173',
      '  npm run preview -- --host 127.0.0.1 --port 4173',
    ].join('\n');
  }

  return `Failed to open ${targetUrl}\n${message}`;
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
