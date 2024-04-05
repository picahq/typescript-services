import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { BCode, Panic } from '@libs-private/data-models';
import { BResult } from '@event-inc/types/results';
import { resultErr, resultOk } from '@event-inc/utils/result';

const UNKNOWN_ERROR =
  'Error has no message. Unknown error caught in makeHttpNetworkCall';

export const makeHttpNetworkCall = async <T>(
  config: AxiosRequestConfig,
  retryable = false,
  panicOnFailure: false | Panic = false
): Promise<BResult<AxiosResponse<T>, 'http'>> => {
  try {
    return resultOk(
      await axios<T>({
        ...config,
        headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'UTF-8',
          ...config?.headers,
        },
      })
    );
  } catch (e) {
    if (axios.isAxiosError(e)) {
      if (e.response) {
        return resultErr(
          panicOnFailure,
          `http_${e.response.status}` as BCode<'http'>,
          e.message,
          'buildable-core',
          retryable,
          e.response.data
        );
      } else if (e.request) {
        return resultErr(
          panicOnFailure,
          `http_400`,
          e.message,
          'buildable-core',
          false
        );
      }
    }
    return resultErr(
      panicOnFailure,
      `http_500`,
      e.message ? e.message : UNKNOWN_ERROR,
      'buildable-core',
      retryable
    );
  }
};

export function isAllowedUrl(url: string): boolean {
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

  // If none of the above conditions are met, return true
  return true;
}
