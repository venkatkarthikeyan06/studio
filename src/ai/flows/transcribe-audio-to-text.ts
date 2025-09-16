'use server';
/**
 * @fileOverview A flow that transcribes audio to text using AssemblyAI.
 *
 * - transcribeAudio - A function that handles the audio transcription process.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the audio file.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

const assemblyAiTool = ai.defineTool({
  name: 'assemblyAiTranscriber',
  description: 'Transcribes audio to text using the AssemblyAI API.',
  inputSchema: z.object({
    audioDataUri: z
      .string()
      .describe(
        "An audio file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      ),
  }),
  outputSchema: z.string(),
  async handler(input) {
    const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

    if (!ASSEMBLYAI_API_KEY) {
      throw new Error('AssemblyAI API key is missing. Please set the ASSEMBLYAI_API_KEY environment variable.');
    }

    const audioData = input.audioDataUri.split(',')[1];
    const buffer = Buffer.from(audioData, 'base64');

    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      body: buffer,
      headers: {
        Authorization: ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/octet-stream',
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`AssemblyAI upload failed with status: ${uploadResponse.status}`);
    }

    const uploadResult = await uploadResponse.json();
    const uploadUrl = uploadResult.upload_url;

    const transcriptionResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      body: JSON.stringify({
        audio_url: uploadUrl,
      }),
      headers: {
        Authorization: ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!transcriptionResponse.ok) {
      throw new Error(`AssemblyAI transcription request failed with status: ${transcriptionResponse.status}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcriptId = transcriptionResult.id;

    // Poll AssemblyAI for the transcription result.
    async function pollForTranscription(transcriptId: string): Promise<string> {
      while (true) {
        const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: {
            Authorization: ASSEMBLYAI_API_KEY,
          },
        });

        if (!pollingResponse.ok) {
          throw new Error(`AssemblyAI polling failed with status: ${pollingResponse.status}`);
        }

        const pollingResult = await pollingResponse.json();
        const status = pollingResult.status;

        if (status === 'completed') {
          return pollingResult.text;
        } else if (status === 'error') {
          throw new Error(`AssemblyAI transcription failed: ${pollingResult.error}`);
        }

        // Wait for 5 seconds before polling again.
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    return await pollForTranscription(transcriptId);
  },
});

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async input => {
    const transcription = await assemblyAiTool(input);
    return {transcription};
  }
);
