import { BError, handleBuildableError } from './errors';

export const walk = (obj: any, fn: Function) => {
  const seen = new WeakSet();
  return (function _walk(obj) {
    if (obj && typeof obj === 'object') {
      if (seen.has(obj)) {
        return;
      }
      seen.add(obj);
      obj = fn(obj);
      Object.keys(obj).forEach(function (k) {
        obj[k] = _walk(obj[k]);
      });
    } else {
      obj = fn(obj);
    }
    return obj;
  })(obj);
};

export function isValidUrl(url: string): boolean {
  // Regular expression to match an IP address
  const ipRegex =
    /(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/;

  const ipv6Regex =
    /(?:(?:[0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((?::[0-9a-fA-F]{1,4}){1,6})|:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)|(?:[0-9a-fA-F]{1,4}:){7}:[0-9a-fA-F]{1,4})/;

  const localhostRegex = /^(https?:\/\/)?localhost(:\d+)?(\/.*)?$/;

  // Check if the URL is an IP address or localhost
  if (ipRegex.test(url) || localhostRegex.test(url) || ipv6Regex.test(url)) {
    return false;
  }

  // Check if the URL includes buildable.dev or buildable.io
  if (url.includes('buildable.dev') || url.includes('buildable.io')) {
    return false;
  }

  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i'
  ); // fragment locator

  return !!pattern.test(url);
}

export function isAlphanumericUnderscore(str: string): boolean {
  return /^[a-zA-Z0-9_]+$/.test(str);
}

export function makeId(length: number) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export function checkIfKeyOrIdExists(
  id?: string,
  key?: string,
  message?: string
) {
  if (!key && !id) {
    handleBuildableError(
      BError(false, 'http_422', message, 'client-destination', false)
    );
  }

  return true;
}
