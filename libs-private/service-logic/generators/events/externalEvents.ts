import { Event, EventCreateInitialPayload } from '@libs-private/data-models';
import { getTopicDetails } from '../../../utils/events';
import {
  generateId,
  generatePrivateKey,
  getWalletFromPrivateKey,
  hashMessage,
} from '../../service-helper';

export const generateExternalEvent = async ({
  environment,
  eventAccess,
  headers,
  ownership,
  body,
  query,
  secret,
  topic,
}: EventCreateInitialPayload): Promise<Event> => {
  const privateKey = generatePrivateKey();
  const wallet = getWalletFromPrivateKey(privateKey);

  const _body = typeof body === 'string' ? body : JSON.stringify(body);

  const { type, group } = getTopicDetails(topic);

  const shortEventPrint = JSON.stringify({
    topic,
    environment,
    body: _body,
  });

  const eventId = await generateId('evt');
  const eventKeyId = await generateId('evt_k');

  const event: Event = {
    _id: eventId,
    key: eventKeyId,
    topic,
    environment,
    body: _body,
    ...(headers ? { headers: JSON.stringify(headers) } : {}),
    ...(query ? { query: JSON.stringify(query) } : {}),
    arrivedAt: Date.now(),
    arrivedDate: new Date(),
    state: 'pending',
    ttl: Date.now() + 60 * 24 * 60 * 60 * 1000,
    _v: 1,
    ownership,
    hashes: [
      {
        type: 'body',
        hash: hashMessage(_body),
      },
      {
        type: 'event',
        hash: hashMessage(shortEventPrint),
      },
      {
        type: 'model::body',
        hash: hashMessage(`${type}:${group}:${_body}`),
      },
    ],
    address: wallet?.address,
    privateKey: wallet?.privateKey,
    publicKey: wallet?.publicKey,
    // pathMetadata: {}
  };

  const signature = await wallet?.signMessage(JSON.stringify(event));

  const serializedEvent = Buffer.from(JSON.stringify(event), 'utf8');
  const eventByteLength = serializedEvent.byteLength;

  event.signature = signature;
  event.eventByteLength = eventByteLength;

  return event;
};
