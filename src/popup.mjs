import getAllCookies from './modules/get_all_cookies.mjs';
import { jsonToNetscapeMapper, FormatMap } from './modules/cookie_formatter.mjs';

/** Promise to get URL of Active Tab */
const getUrlPromise = chrome.tabs.query({ active: true, currentWindow: true }).then(([{ url }]) => new URL(url));


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
  .then((url) => getAllCookies({ url: url.href, partitionKey: { topLevelSite: url.origin } }))
  .then((cookies) => {
    const netscape = jsonToNetscapeMapper(cookies);
    const tableRows = netscape.map((row) => {
      const tr = document.createElement('tr');
      tr.replaceChildren(
        ...row.map((v) => {
          const td = document.createElement('td');
          td.textContent = v;
          return td;
        })
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
  saveToFile(text, url.hostname + '_cookies', format);
});

document.querySelector('#exportAs').addEventListener('click', async () => {
  const url = await getUrlPromise;
  const details = { url: url.href, partitionKey: { topLevelSite: url.origin } };
  const { text, format } = await getCookieText(details);
  saveToFile(text, url.hostname + '_cookies', format, true);
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
  const format = FormatMap[document.querySelector('#format').value];
  if (!format) throw new Error('Invalid format');
  const text = format.serializer(cookies);
  return { text, format };
};

/**
 * Save text data as a file
 * @param {string} text
 * @param {string} name
 * @param {Format} format
 * @param {boolean} saveAs
 */
export const saveToFile = async (text, name, { ext, mimeType }, saveAs = false) => {
  const blob = new Blob([text], { type: mimeType });
  const filename = name + ext;
  const url = URL.createObjectURL(blob);
  await chrome.downloads.download({ url, filename, saveAs }).finally(() => URL.revokeObjectURL(url));
};

/**
 * Copy text data to the clipboard
 * @param {string} text
 */
export const setClipboard = async (text) => {
  await navigator.clipboard.writeText(text);
  document.getElementById('copy').innerText = 'Copied!';
};
