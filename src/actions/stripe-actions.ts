
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { stripe } from '@/lib/stripe';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { Company } from '@/types';
import type Stripe from 'stripe';

const CreateCheckoutSessionInputSchema = z.object({
  companyId: z.string(),
  uid: z.string(),
  email: z.string(),
  priceId: z.string(),
});
type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionInputSchema>;

export async function createCheckoutSessionAction(
  input: CreateCheckoutSessionInput
): Promise<{ sessionId: string } | { error: string }> {
  try {
    const validatedInput = CreateCheckoutSessionInputSchema.parse(input);
    const { companyId, uid, email, priceId } = validatedInput;

    const companyDocRef = doc(db, 'companies', companyId);
    const companyDocSnap = await getDoc(companyDocRef);

    if (!companyDocSnap.exists()) {
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
      await updateDoc(companyDocRef, { stripeCustomerId });
    }
    
    // Get the current number of technicians to set the initial quantity
    const techQuery = query(collection(db, 'technicians'), where('companyId', '==', companyId));
    const techSnapshot = await getDocs(techQuery);
    const technicianCount = techSnapshot.size > 0 ? techSnapshot.size : 1; // Start with at least 1 seat

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL is not set.');

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{
        price: priceId,
        quantity: technicianCount, // Set quantity based on number of technicians
      }],
      subscription_data: {
        proration_behavior: 'create_prorations', // Handle proration correctly
      },
      success_url: `${appUrl}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings`,
    });

    if (!checkoutSession.id) {
        throw new Error('Could not create Stripe Checkout Session.');
    }

    return { sessionId: checkoutSession.id };

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error('Error creating checkout session:', e);
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
        const validatedInput = CreatePortalSessionInputSchema.parse(input);
        const { companyId } = validatedInput;

        const companyDocRef = doc(db, 'companies', companyId);
        const companyDocSnap = await getDoc(companyDocRef);

        if (!companyDocSnap.exists()) {
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
        console.error('Error creating portal session:', e);
        return { error: `Failed to create billing portal session. ${errorMessage}` };
    }
}

const UpdateSubscriptionQuantityInputSchema = z.object({
    companyId: z.string(),
    quantity: z.number().min(0),
});
type UpdateSubscriptionQuantityInput = z.infer<typeof UpdateSubscriptionQuantityInputSchema>;

export async function updateSubscriptionQuantityAction(
  input: UpdateSubscriptionQuantityInput
): Promise<{ error: string | null }> {
    try {
        const { companyId, quantity } = UpdateSubscriptionQuantityInputSchema.parse(input);

        const companyDocRef = doc(db, 'companies', companyId);
        const companyDocSnap = await getDoc(companyDocRef);
        if (!companyDocSnap.exists()) {
            // Not an error, just means company doesn't exist to update.
            return { error: null };
        }

        const company = companyDocSnap.data() as Company;
        if (!company.subscriptionId || company.subscriptionStatus !== 'active') {
            // Not subscribed or not active, so no need to update quantity
            return { error: null };
        }

        const subscription = await stripe.subscriptions.retrieve(company.subscriptionId);
        const subscriptionItemId = subscription.items.data[0]?.id;

        if (!subscriptionItemId) {
            throw new Error('No subscription item found to update.');
        }
        
        if (subscription.items.data[0].quantity === quantity) {
            // No change needed
            return { error: null };
        }
        
        // Update the quantity on the existing subscription item
        await stripe.subscriptionItems.update(subscriptionItemId, {
            quantity,
            proration_behavior: 'create_prorations',
        });
        
        return { error: null };
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        console.error('Error updating subscription quantity:', e);
        return { error: `Failed to update subscription. ${errorMessage}` };
    }
}
