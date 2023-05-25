/** @typedef {import('./types.d.ts').*} * */

/** Promise to get URL of Active Tab */
const getUrl = chrome.tabs.query({ active: true, currentWindow: true })
  .then(([{ url }]) => url);


/**
 * Convert Chrome's JSON format cookies data to a string array for Netscape format
 * @param {CookieJson[]} jsonData 
 * @returns {string[][7]}
 */
const jsonToNetscapeMapper = (jsonData) => {
  return jsonData.map(({ domain, expirationDate, path, secure, name, value }) => {
    const includeSubDomain = !!domain?.startsWith('.');
    const expiry = expirationDate?.toFixed() ?? '0';
    const arr = [domain, includeSubDomain, path, secure, expiry, name, value];
    return arr.map(v => (typeof v === 'boolean') ? v.toString().toUpperCase() : v);
  });
}

/** @type {Record<string, Format>} */
const FormatMap = {
  'netscape': {
    ext: '.txt',
    mimeType: 'text/plain',
    serializer: (jsonData) => {
      const netscapeTable = jsonToNetscapeMapper(jsonData);
      const nsText = [
        '# Netscape HTTP Cookie File',
        '# http://curl.haxx.se/rfc/cookie_spec.html',
        '# This is a generated file!  Do not edit.',
        '',
        ...netscapeTable.map(row => row.join('\t'))].join('\n')
      return nsText;
    }
  },
  'json': {
    ext: '.json',
    mimeType: 'application/json',
    serializer: JSON.stringify
  }
}

/**
 * Save text data as a file
 * @param {string} text
 * @param {string} name
 * @param {Format} format
 * @param {boolean} saveAs
 */
const save = async (text, name, { ext, mimeType }, saveAs = false) => {
  const blob = new Blob([text], { 'type': mimeType });
  const filename = name + ext;
  const url = URL.createObjectURL(blob);
  const downloadId = await chrome.downloads.download({ url, filename, saveAs });
  URL.revokeObjectURL(url);
}

/**
 * Copy text data to the clipboard
 * @param {string} text
 */
const setClipboard = async (text) => {
  await navigator.clipboard.writeText(text);
  document.getElementById('copy').innerText = 'Copied!';
}

/**
 * Serialize and retrieve Cookies data into text data in a specific format
 * @param {Format} format
 * @param {chrome.cookies.GetAllDetails} details
 * @returns {string}
 */
const getCookieText = async (format, details) => {
  const cookies = await chrome.cookies.getAll(details);
  return format.serializer(cookies);
}


/** Set URL in the header */
getUrl.then(url => {
  const location = document.querySelector('#location');
  location.textContent = location.href = new URL(url).href;
});

/** Set Cookies data to the table */
getUrl.then(url => chrome.cookies.getAll({ url })).then(cookies => {
  const netscape = jsonToNetscapeMapper(cookies);
  const tableRows = netscape.map(row => {
    const tr = document.createElement('tr');
    tr.replaceChildren(...row.map(v => {
      const td = document.createElement('td');
      td.textContent = v;
      return td;
    }));
    return tr;
  });
  document.querySelector('table tbody').replaceChildren(...tableRows);
});

document.querySelector('#export').addEventListener('click', async () => {
  const format = FormatMap[document.querySelector('#format').value];
  const url = new URL(await getUrl);
  const text = await getCookieText(format, { url: url.href });
  save(text, url.hostname + '_cookies', format);
});

document.querySelector('#exportAs').addEventListener('click', async () => {
  const format = FormatMap[document.querySelector('#format').value];
  const url = new URL(await getUrl);
  const text = await getCookieText(format, { url: url.href });
  save(text, url.hostname + '_cookies', format, true);
});

document.querySelector('#copy').addEventListener('click', async () => {
  const format = FormatMap[document.querySelector('#format').value];
  const text = await getCookieText(format, { url: await getUrl });
  setClipboard(text);
});

document.querySelector('#exportAll').addEventListener('click', async () => {
  const format = FormatMap[document.querySelector('#format').value];
  const text = await getCookieText(format, {});
  save(text, 'cookies', format);
});

