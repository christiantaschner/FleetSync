import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    // Reverting to the default googleAI() plugin. With the correct IAM roles
    // and APIs enabled, this should use the environment's Application Default Credentials
    // without conflicting with the Firebase Admin SDK.
    googleAI(),
  ],
});
