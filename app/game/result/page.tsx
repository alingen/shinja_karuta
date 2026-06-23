'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/features/game/context/GameContext';
import {
  getAverageKimariMs,
  getFastestKimariMs,
} from '@/features/game/engine/boardEngine';

function fmt(ms: number): string {
  return (ms / 1000).toFixed(2) + '秒';
}

export default function ResultPage() {
  const { gameState, startGame } = useGame();
  const router = useRouter();

  useEffect(() => {
    if (!gameState) router.replace('/');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!gameState) return null;

  const { winner, playerStats, cpuStats } = gameState;
  const playerAvg = getAverageKimariMs(playerStats.kimariMs);
  const playerFastest = getFastestKimariMs(playerStats.kimariMs);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-stone-50 p-8">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-6 text-center text-3xl font-bold text-stone-900">
          {winner === 'player'
            ? '🎉 あなたの勝ち！'
            : winner === 'cpu'
            ? '😢 CPU の勝ち'
            : '引き分け'}
        </h1>

        <div className="mb-6 grid grid-cols-2 gap-3 text-center text-sm">
          <div className="rounded-lg bg-stone-100 py-3">
            <p className="text-xs text-stone-400">正解数</p>
            <p className="text-2xl font-bold text-stone-800">{playerStats.correctCount}</p>
          </div>
          <div className="rounded-lg bg-stone-100 py-3">
            <p className="text-xs text-stone-400">お手つき</p>
            <p className="text-2xl font-bold text-stone-800">{playerStats.foulCount}</p>
          </div>
          {playerStats.kimariMs.length > 0 && (
            <>
              <div className="rounded-lg bg-stone-100 py-3">
                <p className="text-xs text-stone-400">平均決まり秒</p>
                <p className="text-xl font-bold text-stone-800">{fmt(playerAvg)}</p>
              </div>
              <div className="rounded-lg bg-stone-100 py-3">
                <p className="text-xs text-stone-400">最速決まり秒</p>
                <p className="text-xl font-bold text-stone-800">{fmt(playerFastest)}</p>
              </div>
            </>
          )}
        </div>

        <div className="mb-6 rounded-lg bg-amber-50 p-3 text-center text-sm text-stone-600">
          <p className="font-semibold text-amber-700">CPU の結果</p>
          <p>正解: {cpuStats.correctCount} / お手つき: {cpuStats.foulCount}</p>
        </div>

        <button
          onClick={startGame}
          className="w-full rounded-full bg-indigo-600 py-3 text-lg font-bold text-white transition hover:bg-indigo-500 active:scale-95"
        >
          もう一度
        </button>
      </div>
    </main>
  );
}
