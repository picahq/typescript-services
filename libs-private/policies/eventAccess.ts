import { Context } from 'moleculer';
import { MAXIMUM_SECRET_KEYS_LIMIT } from '../constants';
import { Ownership } from '@libs-private/data-models';
import { resultErr } from '@event-inc/utils/result';

export const EventAccessPolicyGenerator = (
  ctx: Context,
  ownership: Ownership
) => ({
  async handleMaximumAllowedSecretKeys(createdSecretCount: number) {
    if (createdSecretCount > MAXIMUM_SECRET_KEYS_LIMIT) {
      return resultErr<'service'>(
        false,
        'service_4000',
        'You have reached the maximum number of API Keys (1000) that can be created.',
        'buildable-core',
        false
      );
    }
  },
});
