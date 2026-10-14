import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright-core';

export const MINECRAFT_URL = 'https://www.minecraft.net/';
const COOKIE_NAME = 'bearer_token';
const PROFILE_PREFIX = 'mc-bearer-token-';

function exists(filePath) {
  try {
    return Boolean(filePath) && fs.existsSync(filePath);
  } catch {
    return false;
  }
}

export function findBrowser() {
  const candidates = [];

  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA;
    const programFiles = process.env.PROGRAMFILES;
    const programFilesX86 = process.env['PROGRAMFILES(X86)'];

    candidates.push(
      local && path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      programFiles && path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      programFilesX86 && path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      programFiles && path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      programFilesX86 && path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
    );
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    );
  } else {
    for (const command of [
      'google-chrome',
      'google-chrome-stable',
      'chromium',
      'chromium-browser',
      'microsoft-edge'
    ]) {
      const result = spawnSync('sh', ['-lc', `command -v ${command}`], {
        encoding: 'utf8'
      });
      const found = result.status === 0 ? result.stdout.trim() : '';

      if (found) {
        candidates.push(found);
      }
    }
  }

  return candidates.find(exists) || null;
}

export function getBrowserDisplayName(executable) {
  const filename = path.basename(executable).toLowerCase();

  if (filename.includes('edge')) {
    return 'Microsoft Edge';
  }

  if (filename.includes('chromium')) {
    return 'Chromium';
  }

  return 'Google Chrome';
}

async function waitForDevToolsPort(profileDirectory, browserProcess) {
  const portFile = path.join(profileDirectory, 'DevToolsActivePort');
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    if (browserProcess.exitCode !== null) {
      throw new Error('The browser closed immediately after launch.');
    }

    if (exists(portFile)) {
      const [port] = fs.readFileSync(portFile, 'utf8').trim().split(/\r?\n/);

      if (/^\d+$/.test(port)) {
        return Number(port);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error('Timed out while preparing the temporary browser connection.');
}

function isMinecraftBearerCookie(cookie) {
  const domain = String(cookie.domain || '')
    .replace(/^\./, '')
    .toLowerCase();

  return cookie.name === COOKIE_NAME &&
    Boolean(cookie.value) &&
    (domain === 'minecraft.net' || domain.endsWith('.minecraft.net'));
}

function removeProfile(profileDirectory, onCleanupWarning) {
  try {
    fs.rmSync(profileDirectory, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 150
    });
  } catch {
    setTimeout(() => {
      try {
        fs.rmSync(profileDirectory, {
          recursive: true,
          force: true,
          maxRetries: 10,
          retryDelay: 250
        });
      } catch {
        onCleanupWarning?.(profileDirectory);
      }
    }, 1000);
  }
}

export async function openTemporaryMinecraftSession(executable, onCleanupWarning) {
  const profileDirectory = fs.mkdtempSync(path.join(os.tmpdir(), PROFILE_PREFIX));
  let browserProcess;
  let browser;
  let cleanedUp = false;

  const cleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;

    try {
      if (browser?.isConnected()) {
        await browser.close();
      }
    } catch {}

    try {
      if (browserProcess && browserProcess.exitCode === null) {
        browserProcess.kill();
      }
    } catch {}

    removeProfile(profileDirectory, onCleanupWarning);
  };

  try {
    browserProcess = spawn(executable, [
      `--user-data-dir=${profileDirectory}`,
      '--remote-debugging-address=127.0.0.1',
      '--remote-debugging-port=0',
      '--no-first-run',
      '--no-default-browser-check',
      '--new-window',
      MINECRAFT_URL
    ], {
      stdio: 'ignore',
      detached: false
    });

    const port = await waitForDevToolsPort(profileDirectory, browserProcess);
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);

    const [context] = browser.contexts();
    if (!context) {
      throw new Error('Could not access the temporary browser context.');
    }

    return {
      profileDirectory,
      browserProcess,
      browser,
      context,
      cleanup
    };
  } catch (error) {
    await cleanup();
    throw error;
  }
}

export async function waitForBearerToken(session) {
  let browserClosed = false;

  session.browserProcess.once('exit', () => {
    browserClosed = true;
  });

  while (!browserClosed) {
    try {
      const cookies = await session.context.cookies();
      const bearerCookie = cookies.find(isMinecraftBearerCookie);

      if (bearerCookie) {
        return bearerCookie.value;
      }
    } catch {
      if (!session.browser.isConnected()) {
        break;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  throw new Error('The browser was closed before a bearer token was found.');
}
