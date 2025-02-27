import { ServiceSchema } from 'moleculer';
import Stripe from 'stripe';
import { resultErr, resultOk, makeHttpNetworkCall } from '@event-inc/utils';

const TRACK_EVENT = `${process.env.CONNECTIONS_API_BASE_URL}v1/public/mark`;

const context = {
  locale: "",
  page: {
    path: "",
    search: "",
    title: "",
    url: ""
  },
  userAgent: "",
}

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

        function analyzeSubscription(subscriptionData: Stripe.SubscriptionItem[]): string {
          const priceIds = new Set(subscriptionData.map((item) => item.price.id));

          if (priceIds.has(process.env.STRIPE_PRO_PLAN_PRICE_ID)) {
            return 'sub::pro';
          }

          if (priceIds.has(process.env.STRIPE_FREE_PLAN_PRICE_ID)) {
            return 'sub::free';
          }

          return "sub::unknown";

        }

        switch (event.type) {

          case 'customer.subscription.created':

          const subscriptionCreated = event.data.object;
          const key = analyzeSubscription(event.data.object?.items?.data);

          if (key && subscriptionCreated?.status === 'active') {
            const billing = {
              throughput: parseInt(process.env.DEFAULT_CLIENT_THROUGHPUT) || 500,
              provider: 'stripe',
              customerId: subscriptionCreated?.customer,
              subscription: {
                id: subscriptionCreated.id,
                endDate: subscriptionCreated.current_period_end,
                valid: true,
                key,
              }
            }

            const client = await ctx.broker.call('v1.clients.updateBillingByCustomerId', {
              customerId: subscriptionCreated?.customer,
              billing
            });

            await makeHttpNetworkCall({
              url: TRACK_EVENT,
              method: 'POST',
              data: {
                path: 't',
                data: {
                  event: 'Created Subscription',
                  properties: {
                    ...subscriptionCreated,
                    version: "pica-1.0.0"
                  },
                  context,
                  userId: client?.author?._id
                }
              }
            });
          }

          break;

          case 'customer.subscription.updated':
            const subscriptionUpdated = event.data.object;

            const subscriptionKey = analyzeSubscription(subscriptionUpdated?.items?.data);

            const billing = {
              throughput: parseInt(process.env.DEFAULT_CLIENT_THROUGHPUT) || 500,
              provider: 'stripe',
              customerId: subscriptionUpdated?.customer,
              subscription: {
                id: subscriptionUpdated?.id,
                endDate: subscriptionUpdated?.current_period_end,
                valid: true,
                key: subscriptionKey,
              },
            };

            const updatedClient = await ctx.broker.call(
              'v1.clients.updateBillingByCustomerId',
              {
                customerId: subscriptionUpdated?.customer,
                billing,
              }
            );

            await makeHttpNetworkCall({
              url: TRACK_EVENT,
              method: 'POST',
              data: {
                path: 't',
                data: {
                  event: 'Updated Subscription',
                  properties: {
                    ...subscriptionUpdated,
                    version: "pica-1.0.0"
                  },
                  context,
                  userId: updatedClient?.author?._id,
                }
              }
            });

            break;

          case 'customer.subscription.deleted':
            const subscriptionDeleted = event.data.object;

            const activeSubscriptions = await stripe.subscriptions.list({
              customer: subscriptionDeleted?.customer as string,
              status: 'active',
            });

            if (activeSubscriptions?.data?.length === 0) {
              const subscriptionCreated = await stripe.subscriptions.create({
                customer: subscriptionDeleted?.customer as string,
                items: [
                  {
                    price: process.env.STRIPE_FREE_PLAN_PRICE_ID,
                  },
                ],
              });
  
              const updatedBilling = {
                throughput: parseInt(process.env.DEFAULT_CLIENT_THROUGHPUT) || 500,
                provider: 'stripe',
                customerId: subscriptionCreated?.customer,
                subscription: {
                  id: subscriptionCreated?.id,
                  endDate: subscriptionCreated?.current_period_end,
                  key: 'sub::free',
                  valid: true,
                },
              };
  
              const client = await ctx.broker.call(
                'v1.clients.updateBillingByCustomerId',
                {
                  customerId: subscriptionCreated?.customer,
                  billing: updatedBilling,
                }
              );

              await makeHttpNetworkCall({
                url: TRACK_EVENT,
                method: 'POST',
                data: {
                  path: 't',
                  data: {
                    event: 'Created Subscription',
                    properties: {
                      ...subscriptionCreated,
                      version: "pica-1.0.0"
                    },
                    context,
                    userId: client?.author?._id,
                  }
                }
              });
            }

            const client = await ctx.broker.call(
              'v1.clients.getByCustomerId',
              {
                customerId: subscriptionDeleted?.customer,
              }
            );

            await makeHttpNetworkCall({
              url: TRACK_EVENT,
              method: 'POST',
              data: {
                path: 't',
                data: {
                  event: 'Deleted Subscription',
                  properties: {
                    ...subscriptionDeleted,
                    version: "pica-1.0.0"
                  },
                  context,
                  userId: client?.author?._id,
                }
              }
            });

            break;

          case 'invoice.payment_failed':
            const invoicePaymentFailed = event.data.object;

            const currentSubscription = await stripe.subscriptions.retrieve(
              invoicePaymentFailed?.subscription as string
            );

            if (currentSubscription?.status !== 'active') {
              await ctx.broker.call('v1.clients.updateOnInvoicePaymentFailed', {
                customerId: invoicePaymentFailed?.customer,
              });
            }

            const currentClient = await ctx.broker.call(
              'v1.clients.getByCustomerId',
              {
                customerId: invoicePaymentFailed?.customer,
              }
            );

            await makeHttpNetworkCall({
              url: TRACK_EVENT,
              method: 'POST',
              data: {
                path: 't',
                data: {
                  event: 'Failed Invoice Payment',
                  properties: {
                    ...invoicePaymentFailed,
                    version: "pica-1.0.0"
                  },
                  context,
                  userId: currentClient?.author?._id,
                }
              }
            });

            break;
          case 'invoice.payment_succeeded':
            const invoicePaymentSucceeded = event.data.object;

            const subscription = await stripe.subscriptions.retrieve(
              invoicePaymentSucceeded?.subscription as string
            );

            const succeededInvoiceClient = await ctx.broker.call(
              'v1.clients.updateOnInvoicePaymentSuccess',
              {
                customerId: invoicePaymentSucceeded?.customer,
                endDate: subscription?.current_period_end,
              }
            );

            await makeHttpNetworkCall({
              url: TRACK_EVENT,
              method: 'POST',
              data: {
                path: 't',
                data: {
                  event: 'Successful Invoice Payment',
                  properties: {
                    ...invoicePaymentSucceeded,
                    version: "pica-1.0.0"
                  },
                  context,
                  userId: succeededInvoiceClient?.author?._id,
                }
              }
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


