'use server';

import {transcribeAudio} from '@/ai/flows/transcribe-audio-to-text';
import {generateLectureSummary} from '@/ai/flows/generate-lecture-summary';
import {extractKeyTerms} from '@/ai/flows/extract-key-terms';
import {generateQuizQuestions} from '@/ai/flows/generate-quiz-questions';
import ytdl from 'ytdl-core';
import {PassThrough} from 'stream';

export type StudyGuide = {
  summary: string;
  keyTerms: string[];
  quizQuestions: string[];
};

export type FormState = {
  data: StudyGuide | null;
  error: string | null;
  timestamp: number;
};

async function getStudyGuideFromTranscript(transcript: string): Promise<StudyGuide> {
  const [summaryResult, keyTermsResult, quizQuestionsResult] =
    await Promise.all([
      generateLectureSummary({transcript}),
      extractKeyTerms({transcript}),
      generateQuizQuestions({transcript}),
    ]);
  return {
    summary: summaryResult.summary,
    keyTerms: keyTermsResult.keyTerms,
    quizQuestions: quizQuestionsResult.quizQuestions,
  };
}

export async function generateStudyGuide(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const file = formData.get('audioFile') as File;
  const youtubeUrl = formData.get('youtubeUrl') as string;

  if ((!file || file.size === 0) && !youtubeUrl) {
    return {data: null, error: 'Please upload an audio file or provide a YouTube URL.', timestamp: Date.now()};
  }
  
  if (file && file.size > 0 && youtubeUrl) {
    return {data: null, error: 'Please provide either a file or a YouTube URL, not both.', timestamp: Date.now()};
  }

  try {
    let transcript = '';

    if (youtubeUrl) {
        if (!ytdl.validateURL(youtubeUrl)) {
            return { data: null, error: 'Invalid YouTube URL.', timestamp: Date.now() };
        }
        
        const audioStream = ytdl(youtubeUrl, { filter: 'audioonly' });
        const chunks: Buffer[] = [];
        
        const streamToBuffer = (stream: PassThrough): Promise<Buffer> => {
            return new Promise((resolve, reject) => {
              stream.on('data', chunk => chunks.push(chunk));
              stream.on('error', reject);
              stream.on('end', () => resolve(Buffer.concat(chunks)));
            });
          };

        const buffer = await streamToBuffer(audioStream);
        const base64String = buffer.toString('base64');
        const audioDataUri = `data:audio/mp4;base64,${base64String}`;
        
        const transcriptionResult = await transcribeAudio({ audioDataUri });
        transcript = transcriptionResult.transcription;

    } else if (file && file.size > 0) {
        const allowedMimeTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-m4a'];
        if (!allowedMimeTypes.includes(file.type)) {
            return { data: null, error: 'Invalid file type. Please upload an MP3, M4A, or WAV file.', timestamp: Date.now() };
        }
    
        const buffer = await file.arrayBuffer();
        const base64String = Buffer.from(buffer).toString('base64');
        const audioDataUri = `data:${file.type};base64,${base64String}`;
        
        const transcriptionResult = await transcribeAudio({ audioDataUri });
        transcript = transcriptionResult.transcription;
    }

    if (!transcript) {
        return { data: null, error: 'Could not extract text from the provided source.', timestamp: Date.now() };
    }

    const result = await getStudyGuideFromTranscript(transcript);

    return {data: result, error: null, timestamp: Date.now()};
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return {data: null, error: `Failed to generate study guide. ${errorMessage}`, timestamp: Date.now()};
  }
}
