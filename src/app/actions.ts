'use server';

import { generateLectureSummary, GenerateLectureSummaryOutput } from '@/ai/flows/generate-lecture-summary';

export type FormState = {
  data: GenerateLectureSummaryOutput | null;
  error: string | null;
  timestamp: number;
};

export async function generateStudyGuide(prevState: FormState, formData: FormData): Promise<FormState> {
  const file = formData.get('audioFile') as File;

  if (!file || file.size === 0) {
    return { data: null, error: 'Please upload an audio file.', timestamp: Date.now() };
  }

  const allowedMimeTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-m4a'];
  if (!allowedMimeTypes.includes(file.type)) {
      return { data: null, error: 'Invalid file type. Please upload an MP3, M4A, or WAV file.', timestamp: Date.now() };
  }
  
  try {
    const buffer = await file.arrayBuffer();
    const base64String = Buffer.from(buffer).toString('base64');
    const audioDataUri = `data:${file.type};base64,${base64String}`;
    
    const result = await generateLectureSummary({ audioDataUri });
    
    return { data: result, error: null, timestamp: Date.now() };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { data: null, error: `Failed to generate study guide. ${errorMessage}`, timestamp: Date.now() };
  }
}
