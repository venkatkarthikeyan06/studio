'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { generateStudyGuide, FormState } from '@/app/actions';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookOpen, HelpCircle, List, Loader2, UploadCloud, Wand2, FileAudio, Download, Youtube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useReactToPrint } from 'react-to-print';
import { marked } from 'marked';

const initialState: FormState = {
  data: null,
  error: null,
  timestamp: 0,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto" size="lg">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-5 w-5" />
          Generate Study Guide
        </>
      )}
    </Button>
  );
}

function StudyGuideDisplay({ state }: { state: FormState }) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'StudyWise-AI-Study-Guide',
  });

  if (!state.data) return null;
  
  const { summary, keyTerms, quizQuestions } = state.data;

  const markdownContent = `
# StudyWise AI Study Guide

## 📝 Summary
${summary}

## 🔑 Key Terms
${keyTerms.map(term => `- **${term}**`).join('\n')}

## 🤔 Quiz Questions
${quizQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
  `;

  const htmlContent = marked.parse(markdownContent);

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-headline font-bold text-primary">Your Study Guide is Ready!</h2>
        <Button onClick={handlePrint} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <div ref={componentRef} className="printable-content p-8 bg-white text-black rounded-lg">
        <style type="text/css" media="print">
          {`
            @page { size: auto; margin: 20mm; }
            body { -webkit-print-color-adjust: exact; }
            .printable-content {
                font-family: 'Inter', sans-serif;
                color: #000;
            }
            .printable-content h1 {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 2.5rem;
                color: #673AB7;
                text-align: center;
                margin-bottom: 2rem;
            }
            .printable-content h2 {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 1.75rem;
                color: #673AB7;
                border-bottom: 2px solid #00BCD4;
                padding-bottom: 0.5rem;
                margin-top: 2rem;
                margin-bottom: 1rem;
            }
            .printable-content ul, .printable-content ol {
                padding-left: 2rem;
            }
             .printable-content li {
                margin-bottom: 0.5rem;
            }
             .printable-content strong {
                font-weight: 700;
            }
          `}
        </style>

        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>


      {/* Display for web view */}
      <div className="web-view space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center gap-2">
              <BookOpen className="text-primary" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90 leading-relaxed">{summary}</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center gap-2">
              <List className="text-primary" />
              Key Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {keyTerms.map((term, index) => (
                <Badge key={index} variant="secondary" className="text-sm py-1 px-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                  {term}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center gap-2">
              <HelpCircle className="text-primary" />
              Quiz Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 list-decimal list-inside text-foreground/90">
              {quizQuestions.map((question, index) => (
                <li key={index} className="pl-2">{question}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


function GeneratorFormContent({ state }: { state: FormState }) {
  const { pending } = useFormStatus();
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const lastToastTimestamp = useRef(0);

  useEffect(() => {
    if (state.error && state.timestamp > lastToastTimestamp.current) {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: state.error,
      });
      lastToastTimestamp.current = state.timestamp;
    }
  }, [state.error, state.timestamp, toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? null);
  };

  const handleLabelClick = () => {
    fileInputRef.current?.click();
  };
  
  const showResults = !pending && state.data;

  return (
    <>
      <Card className={`shadow-lg border-2 border-transparent transition-all duration-500 ${showResults ? 'border-primary/20' : ''}`}>
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <UploadCloud className="text-primary" />
            Upload Your Lecture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <label
                onClick={handleLabelClick}
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent/10 transition-colors"
                htmlFor="audio-upload"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                  <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">MP3, M4A, or WAV</p>
                  {fileName && (
                    <div className="mt-4 flex items-center text-sm font-medium text-foreground bg-secondary px-3 py-1.5 rounded-full">
                      <FileAudio className="mr-2 h-4 w-4 text-primary"/>
                      {fileName}
                    </div>
                  )}
                </div>
                <Input
                  ref={fileInputRef}
                  id="audio-upload"
                  type="file"
                  name="audioFile"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".mp3,.m4a,.wav,audio/*"
                  disabled={pending}
                />
              </label>
            </div>
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-muted-foreground"></div>
              <span className="flex-shrink mx-4 text-muted-foreground text-sm">OR</span>
              <div className="flex-grow border-t border-muted-foreground"></div>
            </div>
            <div className="space-y-2">
              <label htmlFor="youtube-url" className="text-sm font-medium flex items-center gap-2">
                <Youtube className="text-primary" />
                YouTube URL
              </label>
              <Input
                id="youtube-url"
                name="youtubeUrl"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={pending}
              />
            </div>
            <div className="flex justify-center">
              <SubmitButton />
            </div>
          </div>
        </CardContent>
      </Card>

      {pending && (
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-muted-foreground">
            AI is working its magic...
          </p>
          <p className="text-sm text-muted-foreground max-w-md">
            Transcribing, summarizing, and generating your study guide. This might take a few moments.
          </p>
        </div>
      )}

      {showResults && <StudyGuideDisplay state={state} />}
    </>
  );
}


export default function StudyGuideGenerator() {
    const [state, formAction] = useFormState(generateStudyGuide, initialState);
    
    const [formKey, setFormKey] = useState(Date.now());
    const lastSuccessTimestamp = useRef(0);

    useEffect(() => {
        if (state.data && state.timestamp > lastSuccessTimestamp.current) {
            setFormKey(Date.now());
            lastSuccessTimestamp.current = state.timestamp;
        }
    }, [state.data, state.timestamp]);
    
    return (
        <form key={formKey} action={formAction} className="w-full max-w-4xl space-y-8">
            <GeneratorFormContent state={state} />
        </form>
    );
}
