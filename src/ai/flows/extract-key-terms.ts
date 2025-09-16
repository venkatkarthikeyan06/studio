'use server';

/**
 * @fileOverview A flow that extracts key terms from a lecture transcript.
 *
 * - extractKeyTerms - A function that extracts key terms from a lecture transcript.
 * - ExtractKeyTermsInput - The input type for the extractKeyTerms function.
 * - ExtractKeyTermsOutput - The return type for the extractKeyTerms function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractKeyTermsInputSchema = z.object({
  transcript: z
    .string()
    .describe('The transcript of the lecture to extract key terms from.'),
});
export type ExtractKeyTermsInput = z.infer<typeof ExtractKeyTermsInputSchema>;

const ExtractKeyTermsOutputSchema = z.object({
  keyTerms: z
    .array(z.string())
    .describe('The key terms extracted from the lecture transcript.'),
});
export type ExtractKeyTermsOutput = z.infer<typeof ExtractKeyTermsOutputSchema>;

export async function extractKeyTerms(input: ExtractKeyTermsInput): Promise<ExtractKeyTermsOutput> {
  return extractKeyTermsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractKeyTermsPrompt',
  input: {schema: ExtractKeyTermsInputSchema},
  output: {schema: ExtractKeyTermsOutputSchema},
  prompt: `You are an expert in identifying key terms from lecture transcripts.

  Given the following lecture transcript, extract the key terms and concepts discussed.

  Transcript: {{{transcript}}}
  \n  Return the key terms as a JSON array of strings.
  `,
});

const extractKeyTermsFlow = ai.defineFlow(
  {
    name: 'extractKeyTermsFlow',
    inputSchema: ExtractKeyTermsInputSchema,
    outputSchema: ExtractKeyTermsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
