
import { config } from 'dotenv';
config();

import '@/ai/flows/optimize-routes.ts';
import '@/ai/flows/allocate-job.ts';
import '@/ai/flows/suggest-job-skills.ts';
import '@/ai/flows/suggest-job-parts.ts';
import '@/ai/flows/predict-next-technician.ts';
import '@/ai/flows/suggest-job-priority.ts';
import '@/ai/flows/predict-schedule-risk.ts';
import '@/ai/flows/generate-customer-notification-flow.ts';
import '@/ai/flows/suggest-next-appointment-flow.ts';
