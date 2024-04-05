import { Bytes, concat } from '@ethersproject/bytes';
import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
import crypto from 'crypto';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from 'crypto';
import { ethers } from 'ethers';
import {
  EventAccessKeyWithPrefix,
  AccessKeyPrefix,
  EventAccessKey,
  EventAccessKeyData,
} from '@libs-private/data-models';
import { BResult } from '@event-inc/types/results';
import { matchResult, resultErr, resultOk } from '@event-inc/utils';
import { ValidAccessKey } from '@event-inc/types';

export const _messagePrefix = '\x19Buildable Signed Message:\n';

export const checkBlacklist = async (ctx: any, params: any) => {
  const { enabled } = await ctx.broker.call('v1.blacklist.check', params, {
    meta: ctx.meta,
  });

  if (enabled) {
    // don't show user they are blacklisted
    console.log('Blacklisted request made: ', params);
    const err: any = new Error('Bad request');
    err.name = 'bad-request';
    err.data = {};
    delete err.code;
    err.status = 400;
    throw err;
  }
};

export function hashMessage(
  message: Bytes | string,
  messagePrefix = _messagePrefix
): string {
  if (typeof message === 'string') {
    message = toUtf8Bytes(message);
  }
  return keccak256(
    concat([
      toUtf8Bytes(messagePrefix),
      toUtf8Bytes(String(message.length)),
      message,
    ])
  );
}

export function hashMessageBase64Url(
  message: Bytes | string,
  messagePrefix = _messagePrefix
): string {
  if (typeof message === 'string') {
    message = toUtf8Bytes(message);
  }

  const _message = concat([
    toUtf8Bytes(messagePrefix),
    toUtf8Bytes(String(message.length)),
    message,
  ]);

  return createHash('sha256').update(_message).digest('base64url');
}

// Create an encrypt and decrypt function
export const encrypt = (text: string, password: string, iv?: string) => {
  const algorithm = 'aes-256-ctr';
  const secretKey = password;
  const _iv = iv ? Buffer.from(iv, 'base64url') : randomBytes(16);

  const cipher = createCipheriv(algorithm, secretKey, _iv);

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return {
    iv: _iv.toString('base64url'),
    content: encrypted.toString('base64url'),
    signature: hashMessage(
      encrypted.toString('base64url') + _iv.toString('base64url') + password
    ).slice(2, 10),
  };
};

export const decrypt = (
  hash: {
    iv: string;
    content: string;
  },
  password: string
) => {
  const algorithm = 'aes-256-ctr';
  const secretKey = password;
  const decipher = createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(hash.iv, 'base64url')
  );

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(hash.content, 'base64url')),
    decipher.final(),
  ]);

  return decrypted.toString();
};

export const generateAccessKey = (
  prefix: AccessKeyPrefix,
  data: string,
  password: string
): ValidAccessKey => {
  const encrypted = encrypt(data, password);
  const hash = hashMessageBase64Url(
    encrypted.content + encrypted.iv + password
  );

  const accessKey =
    `${encrypted.content}%${encrypted.iv}%${hash}` as EventAccessKey;

  const validAccessKey = convertToValidAccessKey(accessKey);

  const accessKeyWithPrefix: ValidAccessKey = `${prefix}_${validAccessKey}`;

  return accessKeyWithPrefix;
};

export const convertToValidAccessKey = (
  accessKey: EventAccessKey
): ValidAccessKey => {
  const validAccessKey = Buffer.from(accessKey).toString(
    'base64url'
  ) as ValidAccessKey;

  return validAccessKey;
};

export const convertFromValidAccessKey = (
  accessKey: ValidAccessKey
): EventAccessKeyWithPrefix => {
  const [type, environment, ...rest] = accessKey.split('_');
  const validAccessKeyWithoutPrefix = rest.join('_') as EventAccessKey;

  const validAccessKey = Buffer.from(
    validAccessKeyWithoutPrefix,
    'base64url'
  ).toString() as EventAccessKey;

  const decryptedAccessKeyWithPrefix =
    `${type}_${environment}_${validAccessKey}` as EventAccessKeyWithPrefix;

  return decryptedAccessKeyWithPrefix;
};

export const validateEventAccessKey = (
  accessKey: ValidAccessKey,
  password: string
): BResult<EventAccessKeyData, 'service'> => {
  const _accessKey = convertFromValidAccessKey(accessKey);

  const [, , ..._key] = _accessKey.split('_');
  const key = _key.join('_');

  const [encryptedContent, encryptedIv, hash] = key.split('%');

  const _hash = hashMessageBase64Url(encryptedContent + encryptedIv + password);

  const resultError = resultErr(
    'PANIC',
    'service_4000',
    'Access denied. Invalid access key',
    'buildable-core',
    false
  );

  if (_hash === hash) {
    const decrypted = decrypt(
      {
        iv: encryptedIv,
        content: encryptedContent,
      },
      password
    );

    const parsedKey = parseDecrypted<EventAccessKeyData>(decrypted);

    const resultType = matchResult(
      parsedKey,
      (data) => resultOk(data),
      () => resultError
    ).unwrap<BResult<EventAccessKeyData, 'service'>>();

    return resultType;
  }

  return resultError;
};

export const parseDecrypted = <T = unknown>(
  decoded: string
): BResult<T, 'lib'> => {
  try {
    const data = JSON.parse(decoded);
    return resultOk(data);
  } catch (error) {
    return resultErr(
      false,
      'lib_400',
      'Failed to parse decrypted data',
      'buildable-core',
      false
    );
  }
};

export const generatePrivateKey = () => `0x${randomBytes(32).toString('hex')}`;

export const getWalletFromPrivateKey = (privateKey: string) => {
  return new ethers.Wallet(privateKey);
};

export const createSignature = ({
  data,
  secret,
  algorithm = 'sha256',
  encoding,
}: {
  data: crypto.BinaryLike;
  secret: string;
  algorithm?: string;
  encoding?: 'hex' | 'base64';
}) => {
  const hmac = crypto.createHmac(algorithm, secret);
  const signature = hmac.update(data).digest(encoding);
  return signature;
};

export const createSignatureHeaderValue = ({
  timestamp,
  data,
  secret,
  algorithm,
  encoding,
}: {
  timestamp: number;
  data: string;
  secret: string;
  algorithm: string;
  encoding: 'hex' | 'base64';
}) => {
  return `t=${timestamp},v1=${createSignature({
    data: `${timestamp}.${data}`,
    secret,
    algorithm,
    encoding,
  })}`;
};
