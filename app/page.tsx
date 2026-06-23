'use client';

import { GameProvider, useGame } from '@/features/game/context/GameContext';

function StartButton() {
  const { startGame } = useGame();
  return (
    <button
      onClick={startGame}
      className="rounded-full bg-indigo-600 px-10 py-4 text-xl font-bold text-white shadow-lg transition hover:bg-indigo-500 active:scale-95"
    >
      ゲーム開始
    </button>
  );
}

export default function HomePage() {
  return (
    <GameProvider>
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-stone-50 p-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-stone-900">
            信者カルタ
          </h1>
          <p className="mt-3 text-lg text-stone-500">
            1 対 1 で対戦するデジタルかるた
          </p>
        </div>
        <StartButton />
        <p className="text-sm text-stone-400">
          盤面 20 枚 ／ 暗記 20 秒 ／ CPU 難易度：ふつう
        </p>
      </main>
    </GameProvider>
  );
}
