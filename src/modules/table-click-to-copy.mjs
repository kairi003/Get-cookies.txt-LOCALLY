/** Link tag referring to 'modules/table-click-to-copy.mjs' */
export const styleSheet = document.getElementById('clickToCopyStyleSheet');
styleSheet.disabled = true;

/** ID of the 'Click to Copy' checkbox */
export const checkboxId = 'clickToCopyOption';

const selector = '#netscapeTable > tbody > tr > td';

/**
 * Copy text data to the clipboard
 * @param {string} text
 */
export const setClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    document.getElementById('copy').innerText = 'Copied!';
}

/**
 * Callback function for td elements' 'click' event listeners
 * @param {object} event
 */
const tableCellEventListenerCallback = (event) => {
    setClipboard(event.target.innerText);
}

/**
 * Assign a 'click' event listener to each cell in the netscape table
 */
export const addTableCellsEventListeners = () => {
    for (let td of document.querySelectorAll(selector)) {
        td.addEventListener('click', tableCellEventListenerCallback);
    }
}

/**
 * Make 'Click to Copy' checkbox set its renewed state in browser storage;
 * Toggle stylesheet and event listeners for netscape table cells
 */
document.getElementById(checkboxId).addEventListener('change', (event) => {
    const checkboxChecked = event.target.checked;
    chrome.storage.sync.set({[checkboxId]: checkboxChecked}, () => {
        styleSheet.disabled = !checkboxChecked;
        if (checkboxChecked) {
            addTableCellsEventListeners();
        }
        else {
            for (let td of document.querySelectorAll(selector)) {
                td.removeEventListener('click', tableCellEventListenerCallback);
            }
        }
    });
})