import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    // Temporarily disabled to resolve server-side authentication conflict.
    // googleAI(),
  ],
});
