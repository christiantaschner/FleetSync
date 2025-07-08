import {genkit} from 'genkit';
// import {googleAI} from '@genkit-ai/googleai'; // Deactivated for troubleshooting

export const ai = genkit({
  plugins: [
    // googleAI(), // Deactivated for troubleshooting
  ],
});
