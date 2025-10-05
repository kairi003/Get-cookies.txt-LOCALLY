import { formatMap, jsonToNetscapeMapper } from './modules/cookie_format.mjs';
import getAllCookies from './modules/get_all_cookies.mjs';
import _saveToFile from './modules/save_to_file.mjs';

/** Promise to get URL of Active Tab */
const getUrlPromise = chrome.tabs
  .query({ active: true, currentWindow: true })
  .then(([{ url }]) => new URL(url));

// ----------------------------------------------
// Functions
// ----------------------------------------------

/**
 * Get Stringified Cookies Text and Format Data
 * @param {chrome.cookies.GetAllDetails} details
 * @returns {Promise<{ text: string, format: Format }>}
 */
const getCookieText = async (details) => {
  const cookies = await getAllCookies(details);
  const format = formatMap[document.querySelector('#format').value];
  if (!format) throw new Error('Invalid format');
  const text = format.serializer(cookies);
  return { text, format };
};

// TODO: use offscreen API to integrate implementation in chrome and firefox
/**
 * Save text data as a file
 * Firefox cannot use saveAs in a popup, so the background script handles it.
 * @param {string} text
 * @param {string} name
 * @param {Format} format
 * @param {boolean} saveAs
 */
const saveToFile = async (text, name, { ext, mimeType }, saveAs = false) => {
  const format = { ext, mimeType };
  const isFirefox =
    chrome.runtime.getManifest().browser_specific_settings !== undefined;
  if (isFirefox) {
    await chrome.runtime.sendMessage({
      type: 'save',
      target: 'background',
      data: { text, name, format, saveAs },
    });
  } else {
    await _saveToFile(text, name, format, saveAs);
  }
};

/**
 * Copy text data to the clipboard
 * @param {string} text
 */
const setClipboard = async (text) => {
  await navigator.clipboard.writeText(text);
  const copyButton = document.getElementById('copy');
  copyButton.classList.add('copied');
  setTimeout(() => {
    copyButton.classList.remove('copied');
  }, 2000);
};

// ----------------------------------------------
// Actions after resolving the promise
// ----------------------------------------------

/** Set URL in the header */
getUrlPromise.then((url) => {
  const location = document.querySelector('#location');
  location.textContent = location.href = url.href;
});

/** Set Cookies data to the table */
getUrlPromise
  .then((url) =>
    getAllCookies({
      url: url.href,
      partitionKey: { topLevelSite: url.origin },
    }),
  )
  .then((cookies) => {
    const netscape = jsonToNetscapeMapper(cookies);
    const tableRows = netscape.map((row) => {
      const tr = document.createElement('tr');
      tr.replaceChildren(
        ...row.map((v) => {
          const td = document.createElement('td');
          td.textContent = v;
          return td;
        }),
      );
      return tr;
    });
    document.querySelector('table tbody').replaceChildren(...tableRows);
  });

// ----------------------------------------------
// Event Listeners
// ----------------------------------------------

document.querySelector('#export').addEventListener('click', async () => {
  const url = await getUrlPromise;
  const details = { url: url.href, partitionKey: { topLevelSite: url.origin } };
  const { text, format } = await getCookieText(details);
  saveToFile(text, `${url.hostname}_cookies`, format);
});

document.querySelector('#exportAs').addEventListener('click', async () => {
  const url = await getUrlPromise;
  const details = { url: url.href, partitionKey: { topLevelSite: url.origin } };
  const { text, format } = await getCookieText(details);
  saveToFile(text, `${url.hostname}_cookies`, format, true);
});

document.querySelector('#copy').addEventListener('click', async () => {
  const url = await getUrlPromise;
  const details = { url: url.href, partitionKey: { topLevelSite: url.origin } };
  const { text } = await getCookieText(details);
  setClipboard(text);
});

document.querySelector('#exportAll').addEventListener('click', async () => {
  const { text, format } = await getCookieText({ partitionKey: {} });
  saveToFile(text, 'cookies', format);
});

/** Set last used format value */
const formatSelect = document.querySelector('#format');

const selectedFormat = localStorage.getItem('selectedFormat');
if (selectedFormat) {
  formatSelect.value = selectedFormat;
}

formatSelect.addEventListener('change', () => {
  localStorage.setItem('selectedFormat', formatSelect.value);
});
