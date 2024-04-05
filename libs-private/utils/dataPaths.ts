import _ from 'lodash';
import Mustache from 'mustache';

export function extractPathData(
  paths: Record<string, string>,
  payload: Record<string, unknown>
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key in _.omit(paths, [
    'payload',
    'event',
    'signature',
    'id',
    'webhookId',
  ])) {
    const path = paths[key];
    result[key] = path ? extractOrReturn(payload, path) : null;
  }

  return result;
}

export const extractData = <T = unknown>(
  data: Record<string, T>,
  path: string
) => {
  const _data = { _: data };
  if (!path.startsWith('_.') && !path.includes('{{')) {
    return path;
  } else if (path.includes('{{')) {
    return Mustache.render(path, _data);
  }
  const extracted = _.get(_data, path, null);
  if (typeof extracted === 'object') {
    return JSON.stringify(extracted);
  }
  return extracted;
};

const extractOrReturn = <T = unknown>(
  data: Record<string, T>,
  path: string
) => {
  const splittedPath = path.split(',').map((path) => path.trim());
  if (splittedPath.length > 1) {
    return splittedPath.map((path) => extractData(data, path)).join('::');
  } else {
    return extractData(data, path);
  }
};
