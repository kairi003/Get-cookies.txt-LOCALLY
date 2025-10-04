/**
 * Create offscreen document
 */
async function createOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');
  await chrome.offscreen.createDocument({
    url: offscreenUrl,
    reasons: ['BLOBS'],
    justification: 'Create object URLs for file downloads',
  });
}

/**
 * Close offscreen document
 */
async function closeOffscreenDocument() {
  await chrome.offscreen.closeDocument();
}

/**
 * Save text data as a file
 * Creates and destroys offscreen document for each operation
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
  // Create offscreen document
  await createOffscreenDocument();
  const filename = name + ext;
  try {
    // Create object URL using offscreen document
    const { url } = await chrome.runtime.sendMessage({
      type: 'createObjectURL',
      data: { text, mimeType },
    });
    await chrome.downloads.download({ url, filename, saveAs });
  } finally {
    // Close offscreen document for cleanup
    await closeOffscreenDocument();
  }
}
