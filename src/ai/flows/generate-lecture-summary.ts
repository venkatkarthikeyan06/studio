'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a summary of a lecture from text.
 *
 * It includes:
 * - `generateLectureSummary`: The main function to trigger the lecture summarization process.
 * - `GenerateLectureSummaryInput`: The input type for the `generateLectureSummary` function.
 * - `GenerateLectureSummaryOutput`: The output type for the `generateLectureSummary` function, which includes the generated summary.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLectureSummaryInputSchema = z.object({
  transcript: z
    .string()
    .describe('The transcript of the lecture to summarize.'),
});
export type GenerateLectureSummaryInput = z.infer<
  typeof GenerateLectureSummaryInputSchema
>;

const GenerateLectureSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the lecture content.'),
});
export type GenerateLectureSummaryOutput = z.infer<
  typeof GenerateLectureSummaryOutputSchema
>;

export async function generateLectureSummary(
  input: GenerateLectureSummaryInput
): Promise<GenerateLectureSummaryOutput> {
  return generateLectureSummaryFlow(input);
}

const generateLectureSummaryPrompt = ai.definePrompt({
  name: 'generateLectureSummaryPrompt',
  input: {schema: GenerateLectureSummaryInputSchema},
  output: {schema: GenerateLectureSummaryOutputSchema},
  prompt: `You are an AI assistant designed to summarize lecture content.

  Analyze the following lecture transcription and provide a concise summary of the lecture's key points.

  Lecture Transcription: {{{transcript}}}
  `,
});

const generateLectureSummaryFlow = ai.defineFlow(
  {
    name: 'generateLectureSummaryFlow',
    inputSchema: GenerateLectureSummaryInputSchema,
    outputSchema: GenerateLectureSummaryOutputSchema,
  },
  async input => {
    const {output} = await generateLectureSummaryPrompt(input);
    return output!;
  }
);
