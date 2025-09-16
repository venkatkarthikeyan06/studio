
'use client';

import StudyGuideGenerator from '@/components/study-guide-generator';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';

function Copyright() {
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return <p>&copy; {year} StudyWise AI. All rights reserved.</p>;
}

export default function Home() {
  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto px-4">
        <main className="min-h-screen flex flex-col items-center py-8 sm:py-12">
          <header className="w-full max-w-4xl text-center mb-8 md:mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline font-bold text-primary tracking-tight">
              StudyWise AI
            </h1>
            <p className="mt-3 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform audio lectures into comprehensive study guides instantly. 🎓
            </p>
          </header>
          <StudyGuideGenerator />
        </main>
        <Separator className="my-4" />
        <footer className="text-center py-6 text-muted-foreground text-sm">
          <Copyright />
          <p>Powered by Next.js and Generative AI.</p>
        </footer>
      </div>
    </div>
  );
}
