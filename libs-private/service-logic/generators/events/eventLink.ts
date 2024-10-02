import { CreateEventLinkPayload, EventLink } from '@event-inc/types';
import { Ownership } from '@event-inc/types/generic';
import { generateId } from '@libs-private/utils';

export const generateEventLinkRecord = async ({
  version = '1.0.0_04.44_18-04-2023T10-33-00',
  identity,
  identityType,
  group,
  label,
  ttl,
  ownership,
  environment,
  usageSource,
}: CreateEventLinkPayload & {
  ownership: Ownership;
}): Promise<EventLink> => {
  const tokenId = await generateId('ln_tk');

  return {
    _type: 'event-link',
    version,
    ownership,
    identity,
    identityType,
    group,
    label,
    token: tokenId,
    createdAt: Date.now(),
    createdDate: new Date(),
    expiresAt: new Date().getTime() + ttl,
    environment,
    usageSource,
  };
};
