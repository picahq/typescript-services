import crypto from 'crypto';

export const randomCode = (length: number) => {
  return crypto.randomBytes(length / 2).toString('hex');
};

export const getFirstAndLastNameFromName = (name: string) => {
  return typeof name === 'string' ? name.split(' ') : [];
};
