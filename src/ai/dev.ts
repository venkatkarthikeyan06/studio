import { config } from 'dotenv';
config();

import '@/ai/flows/generate-lecture-summary.ts';
import '@/ai/flows/generate-quiz-questions.ts';
import '@/ai/flows/extract-key-terms.ts';
import '@/ai/flows/transcribe-audio-to-text.ts';