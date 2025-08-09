import type { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { dbAdmin } from '@/lib/firebase-admin';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('Stripe-Signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!dbAdmin) {
    console.error('CRITICAL: Firestore Admin SDK not initialized. Webhook cannot process.');
    return new Response('Webhook Error: Database connection failed.', { status: 500 });
  }

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

      const companyDocRef = doc(dbAdmin, 'companies', companyId);
      await updateDoc(companyDocRef, {
        subscriptionId: subscription.id,
        stripeCustomerId: subscription.customer,
        subscriptionStatus: subscription.status,
        technicianSeatCount: subscription.items.data[0]?.quantity || 1,
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
      
      const companyDocRef = doc(dbAdmin, 'companies', companyId);
      await updateDoc(companyDocRef, {
        subscriptionStatus: subscription.status,
        technicianSeatCount: subscription.items.data[0]?.quantity || 1,
      });

      console.log(`Updated subscription status to ${subscription.status} for company ${companyId}`);
      break;
    }
    
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription;
      
      if(invoice.billing_reason === 'subscription_cycle' && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
        const stripeCustomerId = subscription.customer as string;
        const customer = await stripe.customers.retrieve(stripeCustomerId) as Stripe.Customer;
        const companyId = customer.metadata.companyId;
        
        if (!companyId) {
          console.error(`Webhook Error: No companyId in metadata for customer ${stripeCustomerId} on invoice payment.`);
          break;
        }

        const companyDocRef = doc(dbAdmin, 'companies', companyId);
        await updateDoc(companyDocRef, {
            subscriptionStatus: 'active',
            technicianSeatCount: subscription.items.data[0]?.quantity || 1,
        });
        console.log(`Subscription for company ${companyId} confirmed as active due to successful payment.`);
      }
      break;
    }
    
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription;
      
      if(subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
        const stripeCustomerId = subscription.customer as string;
        const customer = await stripe.customers.retrieve(stripeCustomerId) as Stripe.Customer;
        const companyId = customer.metadata.companyId;

        if (!companyId) {
          console.error(`Webhook Error: No companyId in metadata for customer ${stripeCustomerId} on invoice failure.`);
          break;
        }

        const companyDocRef = doc(dbAdmin, 'companies', companyId);
        const companySnap = await getDoc(companyDocRef);
        if (companySnap.exists() && companySnap.data().subscriptionId === subscriptionId) {
          await updateDoc(companyDocRef, {
            subscriptionStatus: 'past_due',
          });
          console.log(`Subscription for company ${companyId} marked as past_due due to failed payment.`);
        }
      }
      break;
    }


    default:
      // console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(null, { status: 200 });
}

