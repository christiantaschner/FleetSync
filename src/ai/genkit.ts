
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    // In a Google Cloud environment, googleAI() will automatically use the
    // Application Default Credentials (ADC), which is the recommended approach.
    // This avoids conflicts with the Firebase Admin SDK.
    googleAI(),
  ],
});
