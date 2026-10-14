# mc-bearer-token

Retrieve your own `minecraft.net` bearer token locally using either a browser extension or a temporary browser session.

> [!CAUTION]
> A bearer token is an authentication credential. Anyone who obtains it may be able to act as your Minecraft account while the token is valid. Never share it, commit it, or paste it into untrusted websites or applications.

## Features

- **Chrome / Edge extension** for an existing signed-in `minecraft.net` tab
- **Temporary browser mode** that opens a clean browser profile and detects the token automatically after sign-in
- No token uploads
- No token files
- No persistent token storage
- Temporary browser profile cleanup after use
- Automatic clipboard copy in temporary browser mode

## Repository structure

```text
mc-bearer-token/
├─ .github/
│  ├─ dependabot.yml
│  └─ workflows/
│     └─ ci.yml
├─ extension/
│  ├─ manifest.json
│  └─ popup/
│     ├─ index.html
│     ├─ popup.css
│     └─ popup.js
├─ standalone/
│  ├─ src/
│  │  ├─ browser.mjs
│  │  ├─ clipboard.mjs
│  │  ├─ index.mjs
│  │  └─ ui.mjs
│  ├─ package.json
│  ├─ package-lock.json
│  ├─ run.cmd
│  ├─ run-print-token.cmd
│  └─ run.sh
├─ .editorconfig
├─ .gitattributes
├─ .gitignore
├─ LICENSE
├─ README.md
└─ SECURITY.md
```

## Chrome / Edge extension

The extension reads `bearer_token` from the currently active `minecraft.net` page on demand.

### Install

1. Clone or download this repository.
2. Open `chrome://extensions/` or `edge://extensions/`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the `extension` directory.
6. Sign in to `minecraft.net`.
7. Open the extension and select **Get token**.
8. Select **Copy to clipboard** when you want to copy it.

### Permissions

The extension requests only:

- `activeTab`
- `scripting`

It does not use `chrome.storage` and does not make network requests of its own.

> [!NOTE]
> This mode relies on the token being readable through `document.cookie`. If `minecraft.net` changes the cookie to `HttpOnly` or otherwise changes its authentication flow, the extension may stop working.

## Temporary browser mode

This mode launches an installed Chrome, Edge, or Chromium browser with a fresh temporary profile. After you sign in to `minecraft.net`, the tool watches the temporary browser's cookie store locally and automatically copies the bearer token to your clipboard.

### Requirements

- Node.js 20 or later
- Google Chrome, Microsoft Edge, or Chromium

### Windows

Run:

```text
standalone\run.cmd
```

The first run installs the pinned `playwright-core` dependency with `npm ci`.

### macOS / Linux

From the repository root:

```bash
cd standalone
npm ci
./run.sh
```

If the script is not executable yet:

```bash
chmod +x run.sh
```

### Display the token in the terminal

The normal launcher does **not** print the token. It copies the token to your clipboard instead.

On Windows, use this only when you explicitly want the token printed:

```text
standalone\run-print-token.cmd
```

Or run:

```bash
cd standalone
npm ci
node src/index.mjs --print
```

## Temporary browser behavior

1. Detect an installed Chrome, Edge, or Chromium browser.
2. Create a fresh profile under the operating system's temporary directory.
3. Open `https://www.minecraft.net/`.
4. Wait for you to sign in normally.
5. Detect the `bearer_token` cookie for `minecraft.net`.
6. Copy the token to your clipboard automatically.
7. Close the temporary browser session.
8. Delete the temporary profile.

The tool does not intentionally write the bearer token to disk or send it to a third-party server.

## Security

See [SECURITY.md](SECURITY.md) for the security model and vulnerability reporting guidance.

## Disclaimer

This project is not affiliated with, endorsed by, or sponsored by Mojang Studios or Microsoft.

Use it only with accounts and sessions you are authorized to access.

## License

[MIT](LICENSE)
