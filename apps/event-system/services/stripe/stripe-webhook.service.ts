import { ServiceSchema } from 'moleculer';
import Stripe from 'stripe';
import { resultErr, resultOk } from '@event-inc/utils';

export default {
  name: 'stripe-webhook',
  version: 1,

  settings: {},

  actions: {
    async handleWebhook(ctx: any) {
      try {
        const rawBody = ctx?.options?.parentCtx?.params?.req?.rawBody;
        const signature = ctx?.meta?.request?.headers['stripe-signature'];

        if (!rawBody || !signature) {
          throw new Error('Missing raw body or signature');
        }
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const event = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          endpointSecret
        );

        switch (event.type) {
          case 'customer.subscription.updated':
            const subscriptionUpdated = event.data.object;

            const billing = {
              provider: 'stripe',
              customerId: subscriptionUpdated?.customer,
              subscription: {
                id: subscriptionUpdated?.id,
                endDate: subscriptionUpdated?.current_period_end,
                key:
                  (subscriptionUpdated as any)?.plan?.id ===
                  process.env.STRIPE_GROWTH_PLAN_PRICE_ID
                    ? 'sub::growth'
                    : (subscriptionUpdated as any)?.plan?.id ===
                      process.env.STRIPE_RIDICULOUSLY_CHEAP_PRICE_ID
                    ? 'sub::ridiculous'
                    : 'sub::free',
              },
            };

            const updatedClient = await ctx.broker.call(
              'v1.clients.updateBillingByCustomerId',
              {
                customerId: subscriptionUpdated?.customer,
                billing,
              }
            );

            await ctx.broker.call('v1.tracking.public.track', {
              path: 't',
              data: {
                event: 'UPDATED_SUBSCRIPTION',
                properties: subscriptionUpdated,
                userId: updatedClient?.author?._id,
              },
            });

            break;

          case 'customer.subscription.deleted':
            const subscriptionDeleted = event.data.object;

            const subscriptionCreated = await stripe.subscriptions.create({
              customer: subscriptionDeleted?.customer as string,
              items: [
                {
                  price: process.env.STRIPE_FREE_PLAN_ID,
                },
              ],
            });

            const updatedBilling = {
              provider: 'stripe',
              customerId: subscriptionCreated?.customer,
              subscription: {
                id: subscriptionCreated?.id,
                endDate: subscriptionCreated?.current_period_end,
                key: 'sub::free',
              },
            };

            const client = await ctx.broker.call(
              'v1.clients.updateBillingByCustomerId',
              {
                customerId: subscriptionCreated?.customer,
                billing: updatedBilling,
              }
            );

            await ctx.broker.call('v1.tracking.public.track', {
              path: 't',
              data: {
                event: 'DELETED_SUBSCRIPTION',
                properties: subscriptionDeleted,
                userId: client?.author?._id,
              },
            });

            await ctx.broker.call('v1.tracking.public.track', {
              path: 't',
              data: {
                event: 'CREATED_SUBSCRIPTION',
                properties: subscriptionCreated,
                userId: client?.author?._id,
              },
            });

            break;
        }

        return resultOk({ received: true });
      } catch (err) {
        return resultErr<'service'>(
          false,
          'service_4000',
          'Failed to handle webhook',
          'buildable-core',
          false
        );
      }
    },
  },
} as ServiceSchema;

