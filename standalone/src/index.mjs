import process from 'node:process';
import {
  findBrowser,
  getBrowserDisplayName,
  openTemporaryMinecraftSession,
  waitForBearerToken
} from './browser.mjs';
import { copyToClipboard } from './clipboard.mjs';
import {
  colors,
  header,
  hideCursor,
  line,
  showCursor,
  status,
  successBanner
} from './ui.mjs';

const printToken = process.argv.includes('--print');
let activeSession = null;
let shuttingDown = false;

function printHelp() {
  line('Usage: node src/index.mjs [options]');
  line();
  line('Options:');
  line('  --print    Print the bearer token after detection.');
  line('  --help     Show this help message.');
}

async function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;

  try {
    await activeSession?.cleanup();
  } catch {}

  showCursor();
  process.exit(exitCode);
}

async function main() {
  if (process.argv.includes('--help')) {
    printHelp();
    return;
  }

  hideCursor();
  header();

  const executable = findBrowser();
  if (!executable) {
    throw new Error('Google Chrome, Microsoft Edge, or Chromium was not found.');
  }

  const browserName = getBrowserDisplayName(executable);

  status('●', 'BROWSER', `${browserName} detected`, colors.green);
  status('●', 'SESSION', 'A fresh temporary browser profile will be used', colors.green);
  status('●', 'PRIVACY', 'The token is not uploaded or intentionally saved to a file', colors.green);
  line();
  line(`${colors.bold}${colors.yellow}→ Sign in to minecraft.net in the browser window that opens.${colors.reset}`);
  line(`${colors.bold}${colors.cyan}→ The bearer token will be detected automatically and copied to your clipboard.${colors.reset}`);
  line();

  status('…', 'LAUNCHING', 'Opening the temporary browser...', colors.cyan);

  activeSession = await openTemporaryMinecraftSession(
    executable,
    profileDirectory => {
      status('!', 'CLEANUP', `Could not automatically remove: ${profileDirectory}`, colors.yellow);
    }
  );

  status('✓', 'READY', 'Browser opened — waiting for Minecraft sign-in', colors.green);
  status('…', 'WAITING', 'Looking for bearer_token...', colors.cyan);

  const token = await waitForBearerToken(activeSession);

  line();
  status('✓', 'DETECTED', 'bearer_token found', colors.green);

  const copied = copyToClipboard(token);
  if (copied) {
    status('✓', 'COPIED', 'Bearer token copied to your clipboard', colors.green);
    successBanner();
  } else {
    status('!', 'CLIPBOARD', 'Automatic clipboard copy failed', colors.yellow);
    line(`${colors.yellow}Use --print if you need to display the token in the terminal.${colors.reset}`);
  }

  if (printToken) {
    line();
    line(`${colors.yellow}${colors.bold}TOKEN OUTPUT (--print enabled)${colors.reset}`);
    line(token);
  }

  line();
  status('…', 'CLEANUP', 'Closing the browser and deleting the temporary profile...', colors.cyan);
  await activeSession.cleanup();
  activeSession = null;
  status('✓', 'DONE', 'Temporary session removed', colors.green);
}

process.once('SIGINT', () => {
  void shutdown(130);
});

process.once('SIGTERM', () => {
  void shutdown(143);
});

main()
  .catch(async error => {
    try {
      await activeSession?.cleanup();
    } catch {}

    line();
    status('✕', 'ERROR', error.message, colors.red);
    line(`${colors.dim}No token was intentionally saved by this tool.${colors.reset}`);
    process.exitCode = 1;
  })
  .finally(() => {
    showCursor();
  });
