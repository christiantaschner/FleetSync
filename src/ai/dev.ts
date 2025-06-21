import { config } from 'dotenv';
config();

import '@/ai/flows/optimize-routes.ts';
import '@/ai/flows/allocate-job.ts';
import '@/ai/flows/suggest-job-skills.ts';
