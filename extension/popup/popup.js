const statusElement = document.getElementById('status');
const tokenElement = document.getElementById('token');
const getButton = document.getElementById('get');
const copyButton = document.getElementById('copy');

function setStatus(message, type = '') {
  statusElement.textContent = message;

  if (type) {
    statusElement.dataset.type = type;
  } else {
    delete statusElement.dataset.type;
  }
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tab;
}

function isMinecraftUrl(urlString) {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    return url.protocol === 'https:' &&
      (hostname === 'minecraft.net' || hostname.endsWith('.minecraft.net'));
  } catch {
    return false;
  }
}

async function readBearerToken(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const prefix = 'bearer_token=';
      const bearerCookie = document.cookie
        .split(';')
        .map(part => part.trim())
        .find(part => part.startsWith(prefix));

      return bearerCookie ? bearerCookie.slice(prefix.length) : null;
    }
  });

  return result || null;
}

async function getToken() {
  tokenElement.value = '';
  copyButton.disabled = true;
  setStatus('Checking the active tab...');

  try {
    const tab = await getCurrentTab();

    if (!tab?.id || !isMinecraftUrl(tab.url || '')) {
      setStatus('Open a signed-in minecraft.net page and try again.', 'error');
      return;
    }

    const token = await readBearerToken(tab.id);

    if (!token) {
      setStatus('bearer_token was not found. Confirm that you are signed in and reload the page.', 'error');
      return;
    }

    tokenElement.value = token;
    copyButton.disabled = false;
    setStatus('Token found. It has not been uploaded or saved. Use Copy to clipboard when ready.', 'success');
  } catch (error) {
    console.error(error);
    setStatus('Could not read the token. Reload minecraft.net and try again.', 'error');
  }
}

async function copyToken() {
  if (!tokenElement.value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(tokenElement.value);
  } catch {
    tokenElement.select();
    document.execCommand('copy');
  }

  setStatus('Token copied to your clipboard.', 'success');
}

getButton.addEventListener('click', getToken);
copyButton.addEventListener('click', copyToken);

// The token exists only in this popup's memory and disappears when the popup closes.
