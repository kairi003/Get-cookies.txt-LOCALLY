/**
 * Offscreen document for handling file operations that require DOM APIs
 */

chrome.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
  const { type, data } = message;

  if (type === 'createObjectURL') {
    const { text, mimeType } = data;
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    sendResponse({ url });
    return;
  }

  if (type === 'revokeObjectURL') {
    const { url } = data;
    URL.revokeObjectURL(url);
    sendResponse({ success: true });
    return;
  }
});
