/**
 * Save text data as a file
 * Firefox fails if revoked during download.
 * Firefox cannot use saveAs in a popup, so the background script handles it.
 * @param {string} text
 * @param {string} name
 * @param {Format} format
 * @param {boolean} saveAs
 */
export default async function saveToFile(
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
