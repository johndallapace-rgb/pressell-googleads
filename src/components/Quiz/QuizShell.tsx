'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/data/products';
import QuizQuestion from './QuizQuestion';
import QuizProgress from './QuizProgress';
import { trackEvent } from '@/lib/tracking';
import { Locale } from '@/i18n/i18n-config';
import { Dictionary } from '@/i18n/getDictionary';

export default function QuizShell({ product, lang, dict }: { product: Product; lang: Locale; dict: Dictionary }) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const t = product.translations[lang] || product.translations['en'];
  const questions = t.quiz.questions;
  const currentQuestion = questions[currentIndex];

  const handleAnswer = (value: string) => {
    // Track answer
    trackEvent('quiz_answer', {
      question_id: currentQuestion.id,
      answer: value,
      product: product.slug,
      lang: lang
    });

    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishQuiz(newAnswers);
    }
  };

  const finishQuiz = (finalAnswers: Record<string, string>) => {
    setIsAnalyzing(true);
    trackEvent('quiz_complete', {
      product: product.slug,
      answers: finalAnswers,
      lang: lang
    });

    // Simulate analysis
    setTimeout(() => {
      router.push(`/${lang}/p/${product.slug}/review`);
    }, 2000);
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{dict.common.analyzing}</h2>
        <p className="text-gray-500">{dict.common.findingMatch}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-lg border border-gray-100 my-8">
      <QuizProgress current={currentIndex} total={questions.length} />
      <QuizQuestion 
        question={currentQuestion} 
        onAnswer={handleAnswer} 
      />
    </div>
  );
}
