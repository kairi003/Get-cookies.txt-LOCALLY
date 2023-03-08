type Format = {
  ext: string;
  mimeType: string;
  serializer: (jsonData: CookieJson) => string;
}
type CookieJson = {
  "domain": string;
  "expirationDate": number | undefined;
  "hostOnly": boolean;
  "httpOnly": boolean;
  "name": string;
  "path": string;
  "sameSite": string,
  "secure": boolean,
  "session": boolean,
  "storeId": string,
  "value": string
}
type CookieNetscape = string[][7];