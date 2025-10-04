
'use server';

import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { stripe } from '@/lib/stripe';
import type { Company, StripeProduct } from '@/types';
import type Stripe from 'stripe';

const CreateCheckoutSessionInputSchema = z.object({
  companyId: z.string(),
  uid: z.string(),
  email: z.string(),
  priceId: z.string(),
  quantity: z.number().min(1, 'Quantity must be at least 1.'),
});
type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionInputSchema>;

export async function createCheckoutSessionAction(
  input: CreateCheckoutSessionInput
): Promise<{ sessionId: string } | { error: string }> {
  try {
    if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
    const validatedInput = CreateCheckoutSessionInputSchema.parse(input);
    const { companyId, uid, email, priceId, quantity } = validatedInput;

    const companyDocRef = doc(dbAdmin, 'companies', companyId);
    const companyDocSnap = await companyDocRef.get();

    if (!companyDocSnap.exists) {
      throw new Error('Company not found.');
    }
    const company = companyDocSnap.data() as Company;

    let stripeCustomerId = company.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email,
        name: company.name,
        metadata: {
          companyId: companyId,
          firebaseUID: uid,
        },
      });
      stripeCustomerId = customer.id;
      await companyDocRef.update({ stripeCustomerId });
    }
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL is not set.');
    
    // Check if the company has an active subscription already
    if (company.subscriptionId && ['active', 'trialing'].includes(company.subscriptionStatus || '')) {
         const subscription = await stripe.subscriptions.retrieve(company.subscriptionId);
         // If they have a subscription, create a portal session instead of a new checkout
         if (subscription) {
            const portalSession = await stripe.billingPortal.sessions.create({
                customer: stripeCustomerId,
                return_url: `${appUrl}/settings?tab=billing`,
            });
            // This is a special case: we return a URL to redirect to the portal
            return { sessionId: portalSession.url };
         }
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{
        price: priceId,
        quantity: quantity,
      }],
      // Only add trial if the company status is actually 'trialing'
      subscription_data: company.subscriptionStatus === 'trialing' ? {
        trial_period_days: 30,
        proration_behavior: 'create_prorations',
      } : {
        proration_behavior: 'create_prorations',
      },
      success_url: `${appUrl}/settings?session_id={CHECKOUT_SESSION_ID}&subscription_success=true`,
      cancel_url: `${appUrl}/settings?tab=billing&subscription_cancelled=true`,
    });

    if (!checkoutSession.id) {
        throw new Error('Could not create Stripe Checkout Session.');
    }

    return { sessionId: checkoutSession.id };

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(JSON.stringify({
        message: 'Error creating checkout session',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
    return { error: `Failed to create checkout session. ${errorMessage}` };
  }
}

const CreatePortalSessionInputSchema = z.object({
  companyId: z.string(),
});
type CreatePortalSessionInput = z.infer<typeof CreatePortalSessionInputSchema>;


export async function createPortalSessionAction(
    input: CreatePortalSessionInput
): Promise<{ url: string } | { error: string }> {
    try {
        if (!dbAdmin) throw new Error("Firestore Admin SDK has not been initialized. Check server logs for details.");
        const validatedInput = CreatePortalSessionInputSchema.parse(input);
        const { companyId } = validatedInput;

        const companyDocRef = doc(dbAdmin, 'companies', companyId);
        const companyDocSnap = await companyDocRef.get();

        if (!companyDocSnap.exists) {
            throw new Error('Company not found.');
        }

        const company = companyDocSnap.data() as Company;
        const stripeCustomerId = company.stripeCustomerId;

        if (!stripeCustomerId) {
            throw new Error('Stripe Customer ID not found for this company.');
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL;
        if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL is not set.');
        
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${appUrl}/settings?tab=billing`,
        });

        return { url: portalSession.url };

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        console.error(JSON.stringify({
            message: 'Error creating portal session',
            error: {
                message: errorMessage,
                stack: e instanceof Error ? e.stack : undefined,
            },
            severity: "ERROR"
        }));
        return { error: `Failed to create billing portal session. ${errorMessage}` };
    }
}

export async function getStripeProductsAction(): Promise<{
  data: StripeProduct[] | null;
  error: string | null;
}> {
  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
      type: 'recurring',
    });

    if (!prices.data) {
      return { data: [], error: null };
    }

    const productsWithPrices = prices.data
      .map((price): StripeProduct | null => {
        const product = price.product as Stripe.Product;
        if (!product || !product.active) {
            return null;
        }

        let unitAmount: number | null = null;
        if (price.billing_scheme === 'per_unit' && price.unit_amount !== null) {
            unitAmount = price.unit_amount;
        } else if (price.billing_scheme === 'tiered' && price.tiers && price.tiers.length > 0 && price.tiers[0].unit_amount !== null) {
            unitAmount = price.tiers[0].unit_amount;
        } else if (price.billing_scheme === 'tiered' && !price.tiers) {
             unitAmount = null; 
        }

        if (unitAmount === null && price.billing_scheme !== 'tiered') {
             return null;
        }
        
        if(price.billing_scheme === 'tiered' && price.tiers && price.tiers[0].unit_amount) {
            unitAmount = price.tiers[0].unit_amount;
        }

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          features: (product.metadata.features || "").split(',').map(f => f.trim()).filter(f => f),
          price: {
            id: price.id,
            amount: unitAmount,
            currency: price.currency,
            interval: price.recurring?.interval ?? null,
          },
        };
      })
      .filter((p): p is StripeProduct => p !== null);
      
    productsWithPrices.sort((a, b) => (a.price.amount || 0) - (b.price.amount || 0));

    return { data: productsWithPrices, error: null };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(JSON.stringify({
        message: 'Error fetching Stripe products',
        error: {
            message: errorMessage,
            stack: e instanceof Error ? e.stack : undefined,
        },
        severity: "ERROR"
    }));
    return { data: null, error: `Failed to fetch products. ${errorMessage}` };
  }
}
