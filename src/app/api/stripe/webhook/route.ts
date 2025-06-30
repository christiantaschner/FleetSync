
import type { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('Stripe-Signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret is not set.');
    return new Response('Webhook secret not configured.', { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as any;

  switch (event.type) {
    case 'checkout.session.completed': {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      if (checkoutSession.mode !== 'subscription') break;

      const subscriptionId = checkoutSession.subscription;
      const stripeCustomerId = checkoutSession.customer;

      if (!subscriptionId || !stripeCustomerId) {
        console.error('Missing subscription or customer ID in checkout session');
        break;
      }
      
      const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
      
      const customer = await stripe.customers.retrieve(stripeCustomerId as string) as Stripe.Customer;
      const companyId = customer.metadata.companyId;

      if (!companyId) {
          console.error(`Webhook Error: No companyId in metadata for customer ${stripeCustomerId}`);
          break;
      }

      const companyDocRef = doc(db, 'companies', companyId);
      await updateDoc(companyDocRef, {
        subscriptionId: subscription.id,
        stripeCustomerId: subscription.customer,
        subscriptionStatus: subscription.status,
      });

      console.log(`Updated subscription for company ${companyId}`);
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = subscription.customer as string;

      const customer = await stripe.customers.retrieve(stripeCustomerId) as Stripe.Customer;
      const companyId = customer.metadata.companyId;
       if (!companyId) {
          console.error(`Webhook Error: No companyId in metadata for customer ${stripeCustomerId}`);
          break;
      }
      
      const companyDocRef = doc(db, 'companies', companyId);
       await updateDoc(companyDocRef, {
        subscriptionStatus: subscription.status,
      });

      console.log(`Updated subscription status to ${subscription.status} for company ${companyId}`);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(null, { status: 200 });
}
