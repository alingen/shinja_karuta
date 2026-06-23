'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/features/game/context/GameContext';
import { getHandCards } from '@/features/game/engine/boardEngine';
import { MEMORIZATION_DURATION_MS } from '@/features/game/domain/constants';

export default function MemorizePage() {
  const { gameState } = useGame();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(MEMORIZATION_DURATION_MS / 1000);

  useEffect(() => {
    if (!gameState) { router.replace('/'); return; }

    const end = Date.now() + MEMORIZATION_DURATION_MS;
    const tick = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(tick);
    }, 200);
    return () => clearInterval(tick);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!gameState) return null;

  const playerCards = getHandCards(gameState.board, 'player');
  const cpuCards = getHandCards(gameState.board, 'cpu');

  return (
    <div className="min-h-screen bg-stone-50 p-4">
      <header className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-stone-700">暗記フェーズ</h2>
        <div
          className={`text-3xl font-mono font-bold tabular-nums ${
            timeLeft <= 5 ? 'text-red-600' : 'text-indigo-600'
          }`}
        >
          {timeLeft}秒
        </div>
      </header>

      <section className="mb-6">
        <h3 className="mb-2 text-sm font-semibold text-stone-500 uppercase tracking-wide">
          あなたの手 ({playerCards.length}枚)
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {playerCards.map(({ card }) => (
            <div
              key={card.id}
              className="rounded-lg border-2 border-indigo-300 bg-white p-2 text-center shadow-sm"
            >
              <p className="text-xs font-semibold text-indigo-700 truncate">{card.title}</p>
              <p className="mt-1 text-xs text-stone-600 leading-tight line-clamp-2">
                {card.displayText}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-stone-500 uppercase tracking-wide">
          CPU の手 ({cpuCards.length}枚)
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {cpuCards.map(({ card }) => (
            <div
              key={card.id}
              className="rounded-lg border-2 border-amber-300 bg-white p-2 text-center shadow-sm"
            >
              <p className="text-xs font-semibold text-amber-700 truncate">{card.title}</p>
              <p className="mt-1 text-xs text-stone-600 leading-tight line-clamp-2">
                {card.displayText}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
