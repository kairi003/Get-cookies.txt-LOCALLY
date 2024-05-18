type Format = {
  ext: string;
  mimeType: string;
  serializer: (cookies: chrome.cookies.Cookie[]) => string;
};
