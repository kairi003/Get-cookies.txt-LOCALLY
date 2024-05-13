/**
 * Retrieves both cookies with and without a partition key and returns the merged list
 * @param {chrome.cookies.GetAllDetails} details
 * @returns {chrome.cookies.Cookie[]}
 */
const getAllCookies = async (details) => {
  const { partitionKey, ...detailsWithoutPartitionKey } = details;
  const cookiesWithPartitionKey = partitionKey ? await chrome.cookies.getAll(details) : [];
  const cookies = await chrome.cookies.getAll(detailsWithoutPartitionKey);
  return [...cookies, ...cookiesWithPartitionKey];
};

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'requestAllCookies') {
    const { details } = message;
    getAllCookies(details).then(sendResponse);
    return true;
  }
  return false;
});

/**
 * Update icon badge counter on active page
 */
const updateBadgeCounter = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    return;
  }
  const { id: tabId, url: urlString } = tab;
  if (!urlString) {
    chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }
  const url = new URL(urlString);
  const cookies = await getAllCookies({ url: url.href, partitionKey: { topLevelSite: url.origin } });
  const text = cookies.length.toFixed();
  chrome.action.setBadgeText({ tabId, text });
};

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
      buttons: [{ title: 'Github Releases' }, { title: 'Uninstall' }]
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
          url: 'https://github.com/kairi003/Get-cookies.txt-LOCALLY/releases'
        });
        break;
      case 1:
        chrome.management.uninstallSelf({ showConfirmDialog: true });
        break;
    }
  }
});
