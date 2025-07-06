
'use server';

import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { CompanySettingsSchema } from '@/types';

const UpdateCompanyInputSchema = z.object({
    companyId: z.string().min(1),
    name: z.string().min(2, 'Company name must be at least 2 characters.'),
    settings: CompanySettingsSchema,
});
export type UpdateCompanyInput = z.infer<typeof UpdateCompanyInputSchema>;

export async function updateCompanyAction(
  input: UpdateCompanyInput
): Promise<{ error: string | null }> {
  try {
    if (!dbAdmin) {
      throw new Error('Firestore Admin SDK not initialized. Check server logs for details.');
    }
    const validatedInput = UpdateCompanyInputSchema.parse(input);

    const companyDocRef = doc(dbAdmin, 'companies', validatedInput.companyId);

    // Make sure to unpack the settings object correctly
    const updatePayload = {
        name: validatedInput.name,
        settings: {
            address: validatedInput.settings.address,
            timezone: validatedInput.settings.timezone,
            businessHours: validatedInput.settings.businessHours,
            co2EmissionFactorKgPerKm: validatedInput.settings.co2EmissionFactorKgPerKm,
        },
        updatedAt: serverTimestamp(),
    };
    
    await updateDoc(companyDocRef, updatePayload);

    return { error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors.map((err) => err.message).join(', ') };
    }
    console.error('Error in updateCompanyAction:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    return { error: `Failed to update company settings. ${errorMessage}` };
  }
}
