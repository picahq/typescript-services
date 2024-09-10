import { Context } from 'moleculer';
import { Ownership } from '@libs-private/data-models';
import Stripe from 'stripe';
import { BResult } from '@event-inc/types';
import { resultErr, resultOk } from '@event-inc/utils';
import { ClientRecord } from '@event-inc/types/generic';
import { useSettingsService } from '../settings/useSettingsService';

export const useOnboardingService = (ctx: Context, ownership: Ownership) => {
  return {
    async init({
      id,
      name,
      email,
    }: {
      id: string;
      name: string;
      email?: string;
    }): Promise<BResult<boolean, 'service', unknown>> {
      try {

        const { updateNonOauthPlatforms } = useSettingsService(ctx, ownership);

        // Update non oauth platform
        await updateNonOauthPlatforms();

        // Create stripe customer
        const response: {
          customer: Stripe.Customer;
          subscription: Stripe.Subscription;
        } = await ctx.broker.call('v1.stripe.public.createCustomer', {
          name,
          email,
        });

        const billing = {
          customerId: response?.customer?.id,
          subscription: {
            id: response?.subscription?.id,
            endDate: response?.subscription?.current_period_end,
            key: 'sub::free',
            valid: true,
          },
        };

        // Update user billing
        const client: ClientRecord = await ctx.broker.call('v1.clients.updateBillingByUserId', {
          id,
          billing,
        });

        // Track customer creation
        await ctx.broker.call('v1.tracking.public.track', {
          path: 't',
          data: {
            event: 'Created Customer',
            properties: response?.customer,
            userId: client?.author?._id
          }
        });

        return resultOk(true);
      } catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          'Failed to initialize user',
          'buildable-core',
          false
        );
      }
    },
  };
};

