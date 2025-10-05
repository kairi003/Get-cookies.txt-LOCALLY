/**
 * Save text data as a file
 * @param {string} text
 * @param {string} name
 * @param {Format} format
 * @param {boolean} [saveAs=false]
 * @returns {Promise<number>} Download ID
 */
export default async function saveToFile(
  text,
  name,
  { ext, mimeType },
  saveAs = false,
) {
  const filename = name + ext;
  const url = `data:${mimeType},${encodeURIComponent(text)}`;
  return chrome.downloads.download({ url, filename, saveAs });
}
