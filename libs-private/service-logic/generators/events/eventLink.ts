import { CreateEventLinkPayload, EventLink } from '@event-inc/types';
import { Ownership } from '@event-inc/types/generic';
import { generateId } from '@integrationos/rust-utils';

export const generateEventLinkRecord = ({
  version = '1.0.0_04.44_18-04-2023T10-33-00',
  label,
  group,
  ttl,
  ownership,
  environment,
  usageSource,
}: CreateEventLinkPayload & {
  ownership: Ownership;
}): EventLink => {
  return {
    _type: 'event-link',
    version,
    ownership,
    label,
    group,
    token: generateId('ln_tk'),
    createdAt: Date.now(),
    createdDate: new Date(),
    expiresAt: new Date().getTime() + ttl,
    environment,
    usageSource,
  };
};
