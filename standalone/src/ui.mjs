import process from 'node:process';

const supportsColor = Boolean(process.stdout.isTTY) && process.env.NO_COLOR === undefined;

export const colors = {
  reset: supportsColor ? '\x1b[0m' : '',
  dim: supportsColor ? '\x1b[2m' : '',
  bold: supportsColor ? '\x1b[1m' : '',
  cyan: supportsColor ? '\x1b[36m' : '',
  green: supportsColor ? '\x1b[32m' : '',
  yellow: supportsColor ? '\x1b[33m' : '',
  red: supportsColor ? '\x1b[31m' : ''
};

export function line(text = '') {
  console.log(text);
}

export function header() {
  line(`${colors.cyan}╭────────────────────────────────────────────────────╮${colors.reset}`);
  line(`${colors.cyan}│${colors.reset} ${colors.bold}Minecraft Bearer Token${colors.reset}                            ${colors.cyan}│${colors.reset}`);
  line(`${colors.cyan}│${colors.reset} ${colors.dim}Temporary browser session • Local token handling${colors.reset} ${colors.cyan}│${colors.reset}`);
  line(`${colors.cyan}╰────────────────────────────────────────────────────╯${colors.reset}`);
  line();
}

export function status(icon, label, message, color = colors.cyan) {
  line(`${color}${icon}${colors.reset} ${colors.bold}${label.padEnd(11)}${colors.reset} ${message}`);
}

export function successBanner() {
  line();
  line(`${colors.green}${colors.bold}╭────────────────────────────────────────────────────╮${colors.reset}`);
  line(`${colors.green}${colors.bold}│       SUCCESS — TOKEN COPIED TO CLIPBOARD          │${colors.reset}`);
  line(`${colors.green}${colors.bold}╰────────────────────────────────────────────────────╯${colors.reset}`);
  line(`${colors.dim}Paste it only into a destination you trust. Do not share it.${colors.reset}`);
}

export function hideCursor() {
  if (!process.stdout.isTTY) return;
  try {
    process.stdout.write('\x1b[?25l');
  } catch {}
}

export function showCursor() {
  if (!process.stdout.isTTY) return;
  try {
    process.stdout.write('\x1b[?25h');
  } catch {}
}
