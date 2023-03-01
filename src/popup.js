/** @typedef {import('./types.d.ts').*} * */

const getUrl = chrome.tabs.query({ active: true, currentWindow: true })
  .then(([{ url }]) => url);

getUrl.then(url => {
  const location = document.querySelector('#location');
  location.textContent = location.href = new URL(url).href;
});

/**
 * @param {CookieJson[]} jsonData 
 * @returns {string[][7]}
 */
const jsonToNetscapeMapper = (jsonData) => {
  return jsonData.map(({ domain, expirationDate, path, secure, name, value }) => {
    const includeSubDomain = !!domain?.startsWith('.');
    const arr = [domain, includeSubDomain, path,
      secure, (parseInt(expirationDate) ?? '').toString(), name, value];
    return arr.map(v => (typeof v === 'boolean') ?
      v.toString().toUpperCase() : v.toString());
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
 * @param {string} text 
 * @param {Format} format 
 */
const save = async (text, { ext, mimeType }) => {
  const { hostname } = new URL(await getUrl);
  const a = document.createElement('a');
  a.href = `data:${mimeType},${encodeURIComponent(text)}`;
  a.download = `${hostname}_cookies${ext}`;
  a.click();
}

/**
 * @param {string} text 
 * @param {Format} format 
 */
const saveAs = async (text, { ext, mimeType }) => {
  const { hostname } = new URL(await getUrl);
  const opts = {
    suggestedName: `${hostname}_cookies${ext}`,
    types: [{
      description: 'Cookie file',
      accept: { [mimeType]: [ext] },
    }],
  };
  window.showSaveFilePicker(opts).then(async handle => {
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
  });
}

/**
 * @param {string} text
 */
const setClipboard = async (text) => {
  const type = 'text/plain';
  const blob = new Blob([text], { type });
  const data = [new ClipboardItem({ [type]: blob })];
  navigator.clipboard.write(data);
}

/**
 * @param {Format} format 
 * @param {chrome.cookies.GetAllDetails} details 
 * @returns {string}
 */
const getCookieText = async (format, details) => {
  const cookies = await chrome.cookies.getAll(details);
  return format.serializer(cookies);
}

document.querySelector('#export').addEventListener('click', async () => {
  const format = FormatMap[document.querySelector('#format').value];
  const text = await getCookieText(format, { url: await getUrl });
  save(text, format);
});

document.querySelector('#exportAs').addEventListener('click', async () => {
  const format = FormatMap[document.querySelector('#format').value];
  const text = await getCookieText(format, { url: await getUrl });
  saveAs(text, format);
});

document.querySelector('#copy').addEventListener('click', async () => {
  const format = FormatMap[document.querySelector('#format').value];
  const text = await getCookieText(format, { url: await getUrl });
  setClipboard(text);
});

document.querySelector('#exportAll').addEventListener('click', async () => {
  const format = FormatMap[document.querySelector('#format').value];
  const text = await getCookieText(format, {});
  save(text, format);
});

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