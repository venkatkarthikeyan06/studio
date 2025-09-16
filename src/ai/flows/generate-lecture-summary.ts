'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a summary of a lecture from an audio file.
 *
 * It includes:
 * - `generateLectureSummary`: The main function to trigger the lecture summarization process.
 * - `GenerateLectureSummaryInput`: The input type for the `generateLectureSummary` function, which includes the audio file data URI.
 * - `GenerateLectureSummaryOutput`: The output type for the `generateLectureSummary` function, which includes the generated summary, key terms, and quiz questions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLectureSummaryInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      'The audio file of the lecture, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected typo here
    ),
});
export type GenerateLectureSummaryInput = z.infer<
  typeof GenerateLectureSummaryInputSchema
>;

const GenerateLectureSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the lecture content.'),
  keyTerms: z.array(z.string()).describe('Key terms and concepts from the lecture.'),
  quizQuestions: z.array(z.string()).describe('Quiz questions based on the lecture content.'),
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
  prompt: `You are an AI assistant designed to summarize lecture content, extract key terms, and generate quiz questions.

  Analyze the following lecture transcription and provide:

  1.  A concise summary of the lecture's key points.
  2.  A list of the most important key terms and concepts discussed.
  3.  A set of quiz questions to test understanding of the material.

  Ensure the output is well-structured and easy to understand. Please include progress in the response.

  Lecture Transcription: {{media url=audioDataUri}}
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
