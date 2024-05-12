/**
 * Retrieves both cookies with and without a partition key and returns the merged list
 * @param {chrome.cookies.GetAllDetails} details
 * @returns {chrome.cookies.Cookie[]}
 */
const getAllCookies = async (details) => {
  const { partitionKey, ...detailsWithoutPartitionKey } = details;
  const cookiesWithPartitionKey = await chrome.cookies.getAll(details);
  const cookies = await chrome.cookies.getAll(detailsWithoutPartitionKey);
  return [...cookies, ...cookiesWithPartitionKey]
}

/**
 * Update icon badge counter on active page
 */
const updateBadgeCounter = async () => {
  const [{ tabId, url } = {}] = await chrome.tabs.query({ active: true, currentWindow: true });
  const text = url ? (await getAllCookies({ url: url, partitionKey: { topLevelSite: url.origin }})).length.toFixed() : '';
  chrome.action.setBadgeText({ tabId, text });
}

chrome.cookies.onChanged.addListener(updateBadgeCounter);
chrome.tabs.onUpdated.addListener(updateBadgeCounter);
chrome.tabs.onActivated.addListener(updateBadgeCounter);
chrome.windows.onFocusChanged.addListener(updateBadgeCounter);


// Update notification
chrome.runtime.onInstalled.addListener(({ previousVersion, reason }) => {
  if (reason === 'update') {
    const currentVersion = chrome.runtime.getManifest().version;
    chrome.notifications.create('updated', {
      type: 'basic',
      title: 'Get cookies.txt LOCALLY',
      message: `Updated from ${previousVersion} to ${currentVersion}`,
      iconUrl: '/images/icon128.png',
      buttons: [
        { title: 'Github Releases' },
        { title: 'Uninstall' }]
    });
  }
});

// Update notification's button handler
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  console.log(notificationId, buttonIndex);
  if (notificationId === 'updated') {
    switch (buttonIndex) {
      case 0:
        chrome.tabs.create({
          url: "https://github.com/kairi003/Get-cookies.txt-LOCALLY/releases"
        });
        break;
      case 1:
        chrome.management.uninstallSelf({ showConfirmDialog: true });
        break;
    }
  }
});