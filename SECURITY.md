# Security

## Security model

`mc-bearer-token` handles an authentication credential, so the project is intentionally designed to keep token handling local and short-lived.

### Browser extension

- Runs only when the user opens the extension and requests the token.
- Accepts only active `https://minecraft.net` or `https://*.minecraft.net` pages.
- Reads the token from page cookies in the active tab.
- Keeps the retrieved token only in popup memory.
- Does not use extension storage.
- Does not make token-related network requests.

Closing the popup clears its in-memory state naturally.

### Temporary browser mode

- Uses a fresh browser profile inside the operating system's temporary directory.
- Connects to that browser through a loopback-only Chrome DevTools Protocol endpoint.
- Looks only for a `bearer_token` cookie belonging to `minecraft.net` or one of its subdomains.
- Copies the token to the local clipboard when possible.
- Does not intentionally print the token unless `--print` is supplied.
- Does not intentionally save the token to a file.
- Removes the temporary browser profile during cleanup.

## Important limitations

- A copied token remains in your system clipboard until it is replaced or cleared.
- Browser crashes, operating-system failures, forced process termination, or filesystem locks may prevent immediate temporary-profile cleanup.
- The Minecraft website and authentication flow can change at any time and may break this project.

## Reporting a vulnerability

Please avoid posting bearer tokens, session cookies, credentials, or other secrets in public issues.

For a security-sensitive bug, open a GitHub Security Advisory for the repository when possible. For non-sensitive bugs, use a normal GitHub issue.
