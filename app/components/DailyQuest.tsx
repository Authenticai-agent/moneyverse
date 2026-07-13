'use client';

import { useEffect, useState } from 'react';
import { getTodaysQuest, Quest } from '@/app/lib/daily-quests';

export default function DailyQuest() {
  const [quest, setQuest] = useState<Quest>(() => getTodaysQuest());
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('moneyverse-quest-streak');
    if (saved) setStreak(Number(saved));
  }, []);

  const handleAnswer = (index: number) => {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    if (index === quest.correctIndex) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem('moneyverse-quest-streak', String(newStreak));
    } else {
      setStreak(0);
      localStorage.setItem('moneyverse-quest-streak', '0');
    }
  };

  const handleNext = () => {
    const next = getTodaysQuest();
    setQuest(next);
    setSelected(null);
    setAnswered(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-mv-lavender">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-mv-primary">Daily Money Quest</h1>
        <div className="text-right">
          <p className="text-xs text-mv-dark/60">Streak</p>
          <p className="text-xl font-bold text-mv-primary">{streak} 🔥</p>
        </div>
      </div>

      <p className="text-sm font-medium text-mv-dark/70 mb-2">{quest.title}</p>
      <p className="text-lg text-mv-dark mb-6">{quest.question}</p>

      <div className="space-y-3 mb-6">
        {quest.options.map((option, index) => {
          const isCorrect = index === quest.correctIndex;
          const isSelected = selected === index;
          const showCorrect = answered && isCorrect;
          const showWrong = answered && isSelected && !isCorrect;

          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={answered}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                showCorrect
                  ? 'border-mv-green bg-mv-green/10'
                  : showWrong
                  ? 'border-red-400 bg-red-50'
                  : isSelected
                  ? 'border-mv-primary bg-mv-lavender/30'
                  : 'border-mv-lavender hover:bg-mv-lavender/20'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mb-6 p-4 bg-mv-light rounded-xl">
          <p className="font-semibold text-mv-dark mb-1">
            {selected === quest.correctIndex ? 'Great job!' : 'Good try.'}
          </p>
          <p className="text-mv-dark/80">{quest.explanation}</p>
        </div>
      )}

      {answered && (
        <button
          onClick={handleNext}
          className="px-6 py-3 rounded-lg bg-mv-primary text-white font-medium hover:bg-mv-primary/90"
        >
          Next quest
        </button>
      )}
    </div>
  );
}
