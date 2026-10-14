import { spawnSync } from 'node:child_process';
import process from 'node:process';

function commandExists(command) {
  const result = spawnSync('sh', ['-lc', `command -v ${command}`], {
    encoding: 'utf8'
  });

  return result.status === 0;
}

export function copyToClipboard(text) {
  try {
    if (process.platform === 'win32') {
      const result = spawnSync(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-Command', '$input | Set-Clipboard'],
        {
          input: text,
          encoding: 'utf8',
          windowsHide: true
        }
      );

      return result.status === 0;
    }

    if (process.platform === 'darwin') {
      return spawnSync('pbcopy', [], { input: text }).status === 0;
    }

    if (commandExists('wl-copy')) {
      return spawnSync('wl-copy', [], { input: text }).status === 0;
    }

    if (commandExists('xclip')) {
      return spawnSync('xclip', ['-selection', 'clipboard'], { input: text }).status === 0;
    }
  } catch {
    // Clipboard support is best-effort and failure is handled by the caller.
  }

  return false;
}
