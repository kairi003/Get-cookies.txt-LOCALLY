/**
 * Convert cookies data to a string array for Netscape format
 * @param {chrome.cookies.Cookie[]} cookies
 * @returns {string[][7]}
 */
export default function cookiesToNetscape (cookies) {
  return cookies.map(({ domain, expirationDate, path, secure, name, value }) => {
    const includeSubDomain = !!domain?.startsWith('.');
    const expiry = expirationDate?.toFixed() ?? '0';
    const arr = [domain, includeSubDomain, path, secure, expiry, name, value];
    return arr.map((v) => (typeof v === 'boolean' ? v.toString().toUpperCase() : v));
  });
};
