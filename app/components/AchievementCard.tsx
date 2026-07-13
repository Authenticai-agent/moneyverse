'use client';

import { useState } from 'react';
import { achievements } from '@/app/lib/achievements';

export default function AchievementCard() {
  const [selected, setSelected] = useState(achievements[0]);
  const [nickname, setNickname] = useState('');
  const [shared, setShared] = useState(false);

  const safeNickname = nickname.trim().slice(0, 20).replace(/[^a-zA-Z0-9 ]/g, '');
  const cardText = `I earned the ${selected.badge} badge in MoneyVerse for learning ${selected.skill.toLowerCase()}.${safeNickname ? ` —${safeNickname}` : ''}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: selected.badge, text: cardText, url: window.location.href });
      } catch {
        // user canceled
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${cardText} ${window.location.href}`);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-mv-lavender">
      <h1 className="text-3xl md:text-4xl font-bold text-mv-primary mb-2">Achievement Cards</h1>
      <p className="text-mv-dark/70 mb-8">
        Celebrate a money skill without sharing personal information.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {achievements.map((achievement) => (
          <button
            key={achievement.id}
            onClick={() => setSelected(achievement)}
            className={`text-left px-4 py-3 rounded-lg border-2 transition-colors ${
              selected.id === achievement.id
                ? 'border-mv-primary bg-mv-lavender/30'
                : 'border-mv-lavender hover:bg-mv-lavender/20'
            }`}
          >
            <span className="text-2xl mr-2">{achievement.icon}</span>
            <span className="font-medium text-mv-dark">{achievement.badge}</span>
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label htmlFor="nickname" className="block text-sm font-medium text-mv-dark mb-1">
          Non-identifying nickname (optional)
        </label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          placeholder="Money Whiz"
          className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
        />
        <p className="text-xs text-mv-dark/60 mt-1">
          Keep it fun and safe. Avoid real names, school names, or locations.
        </p>
      </div>

      <div
        className="p-8 rounded-2xl mb-6 text-center border border-mv-lavender"
        style={{ backgroundColor: selected.color + '15' }}
      >
        <div className="text-5xl mb-3">{selected.icon}</div>
        <p className="text-sm font-medium uppercase tracking-wide text-mv-dark/60 mb-1">MoneyVerse</p>
        <h2 className="text-2xl font-bold text-mv-dark mb-2">{selected.badge}</h2>
        <p className="text-mv-dark/80 mb-4">Skill: {selected.skill}</p>
        <p className="text-lg font-medium text-mv-dark">
          {safeNickname ? `${safeNickname} earned this` : 'Earned this badge'}
        </p>
      </div>

      <button
        onClick={handleShare}
        className="px-6 py-3 rounded-lg bg-mv-primary text-white font-medium hover:bg-mv-primary/90"
      >
        {shared ? 'Copied!' : 'Share card'}
      </button>

      <p className="text-xs text-mv-dark/60 mt-4">
        No real money, school, location, or user ID is shown on this card.
      </p>
    </div>
  );
}
