
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    // Explicitly using the API key for the googleAI plugin to prevent
    // conflicts with the Firebase Admin SDK's Application Default Credentials.
    googleAI({apiKey: process.env.GOOGLE_API_KEY}),
  ],
});
