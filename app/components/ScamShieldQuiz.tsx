'use client';

import { useState } from 'react';
import { scamScenarios } from '@/app/lib/scam-scenarios';
import ScamShieldShareCard from './ScamShieldShareCard';

export default function ScamShieldQuiz() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const scenario = scamScenarios[currentIndex];

  const handleAnswer = (index: number) => {
    if (answered) return;
    setSelectedIndex(index);
    setAnswered(true);
    if (index === scenario.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < scamScenarios.length - 1) {
      setCurrentIndex((i) => i + 1);
      setAnswered(false);
      setSelectedIndex(null);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setAnswered(false);
    setSelectedIndex(null);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-mv-lavender">
        <h1 className="text-3xl md:text-4xl font-bold text-mv-primary mb-4">Scam Shield Score</h1>
        <p className="text-2xl font-semibold text-mv-dark mb-4">
          You got {score} out of {scamScenarios.length} right.
        </p>
        <p className="text-mv-dark/70 mb-8">
          {score === 10
            ? 'Excellent! You are ready to spot scams and stay safe online.'
            : score >= 7
            ? 'Great job. Review the explanations to sharpen your scam radar.'
            : 'Good start. Scams can be tricky — keep learning and stay cautious.'}
        </p>

        <ScamShieldShareCard score={score} total={scamScenarios.length} />

        <div className="mt-8 p-4 bg-mv-light rounded-xl">
          <h2 className="font-semibold text-mv-dark mb-2">Parent / teacher tips</h2>
          <ul className="list-disc list-inside text-sm text-mv-dark/80 space-y-1">
            <li>Talk through scams as a family or class and practice pausing before acting.</li>
            <li>Make a rule: never share passwords, codes, or personal details online.</li>
            <li>Encourage kids to ask a trusted adult whenever something feels too urgent or too good to be true.</li>
          </ul>
        </div>

        <button
          onClick={handleRestart}
          className="mt-8 px-6 py-3 rounded-lg bg-mv-primary text-white font-medium hover:bg-mv-primary/90"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-mv-lavender">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-mv-primary">Scam Shield</h1>
        <span className="text-sm font-medium text-mv-dark/60">
          Question {currentIndex + 1} of {scamScenarios.length}
        </span>
      </div>

      <div className="mb-4 h-2 w-full bg-mv-lavender/50 rounded-full">
        <div
          className="h-2 bg-mv-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + (answered ? 1 : 0)) / scamScenarios.length) * 100}%` }}
        />
      </div>

      <p className="text-lg text-mv-dark mb-6">{scenario.question}</p>

      <div className="space-y-3 mb-6">
        {scenario.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = index === scenario.correctIndex;
          const showResult = answered && isCorrect;
          const showWrong = answered && isSelected && !isCorrect;

          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={answered}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                showResult
                  ? 'border-mv-green bg-mv-green/10'
                  : showWrong
                  ? 'border-red-400 bg-red-50'
                  : isSelected
                  ? 'border-mv-primary bg-mv-lavender/30'
                  : 'border-mv-lavender hover:bg-mv-lavender/20'
              }`}
            >
              <span className="font-medium text-mv-dark">{option}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mb-6 p-4 bg-mv-light rounded-xl">
          <p className="font-medium text-mv-dark mb-1">{selectedIndex === scenario.correctIndex ? 'Correct!' : 'Not quite.'}</p>
          <p className="text-mv-dark/80">{scenario.explanation}</p>
          <p className="text-sm text-mv-dark/60 mt-2">{scenario.tip}</p>
        </div>
      )}

      {answered && (
        <button
          onClick={handleNext}
          className="px-6 py-3 rounded-lg bg-mv-primary text-white font-medium hover:bg-mv-primary/90"
        >
          {currentIndex < scamScenarios.length - 1 ? 'Next question' : 'See results'}
        </button>
      )}
    </div>
  );
}
