/**
 * Save text data as a file using Data URL
 * @param {string} text
 * @param {string} name
 * @param {Format} format
 * @param {boolean} [saveAs=false]
 * @returns {Promise<number>} Download ID
 */
export async function saveToFile(
  text,
  name,
  { ext, mimeType },
  saveAs = false,
) {
  const filename = name + ext;
  const url = `data:${mimeType},${encodeURIComponent(text)}`;
  return chrome.downloads.download({ url, filename, saveAs });
}

/**
 * Save text data as a file using Blob Object URL
 * @param {string} text
 * @param {string} name
 * @param {Format} format
 * @param {boolean} saveAs
 */
export async function saveToFileWithBlob(
  text,
  name,
  { ext, mimeType },
  saveAs = false,
) {
  const blob = new Blob([text], { type: mimeType });
  const filename = name + ext;
  const url = URL.createObjectURL(blob);
  const id = await chrome.downloads.download({ url, filename, saveAs });

  /** @param {chrome.downloads.DownloadDelta} delta  */
  const onChange = (delta) => {
    if (delta.id === id && delta.state?.current !== 'in_progress') {
      chrome.downloads.onChanged.removeListener(onChange);
      URL.revokeObjectURL(url);
    }
  };

  chrome.downloads.onChanged.addListener(onChange);
}
