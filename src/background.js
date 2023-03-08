/**
 * Update icon badge counter on active page
 * @param {number} tabId 
 * @param {string | undefined} url 
 */
const updateBadgeCounter = async () => {
  const [{ tabId, url } = {}] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!url) return;
  const text = (await chrome.cookies.getAll({ url })).length.toFixed();
  chrome.action.setBadgeText({ tabId, text });
}

chrome.cookies.onChanged.addListener(updateBadgeCounter);
chrome.tabs.onUpdated.addListener(updateBadgeCounter);
chrome.tabs.onActivated.addListener(updateBadgeCounter);
