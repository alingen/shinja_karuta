'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/features/game/context/GameContext';
import { getHandCards } from '@/features/game/engine/boardEngine';

const RESULT_LABELS: Record<string, string> = {
  player_correct: '✅ 正解！',
  cpu_correct: '❌ CPU が取りました',
  player_foul: '⚠️ お手つき',
  cpu_foul: '🤖 CPU お手つき',
  both_foul: '⚠️ 両者お手つき',
  simultaneous: '⚡ 同着',
  karuta_nashi: '🃏 空札',
  timeout: '⏱️ 時間切れ',
};

export default function PlayPage() {
  const { gameState, roundResult, handlePlayerAnswer } = useGame();
  const router = useRouter();

  useEffect(() => {
    if (!gameState) { router.replace('/'); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!gameState) return null;

  const round = gameState.currentRound;
  const playerCards = getHandCards(gameState.board, 'player');
  const cpuCards = getHandCards(gameState.board, 'cpu');
  const readCard = round
    ? gameState.allCards.find((c) => c.id === round.readCardId)
    : null;
  const canAnswer = round !== null && round.phase === 'reading' && !roundResult;

  return (
    <div className="relative min-h-screen bg-stone-50 p-4">
      {/* Header */}
      <header className="mb-4 flex items-center justify-between text-sm text-stone-500">
        <span>
          ラウンド {round?.roundNumber ?? 0}
        </span>
        <span className="font-semibold">
          CPU {gameState.cpuStats.correctCount}取 ／ あなた {gameState.playerStats.correctCount}取
        </span>
        <span>
          CPU {cpuCards.length}枚 ／ あなた {playerCards.length}枚
        </span>
      </header>

      {/* Read card display */}
      <div className="mb-6 rounded-xl border-2 border-indigo-400 bg-white p-5 text-center shadow">
        <p className="mb-1 text-xs font-semibold text-indigo-500 uppercase tracking-wide">
          読み上げ
        </p>
        {readCard ? (
          <>
            <p className="text-2xl font-bold text-stone-800">{readCard.displayText}</p>
            {round?.isKarutaNashi && (
              <p className="mt-1 text-xs text-amber-600">（空札 — 押さないでください）</p>
            )}
          </>
        ) : (
          <p className="text-stone-400">待機中…</p>
        )}
      </div>

      {/* CPU hand */}
      <section className="mb-4">
        <p className="mb-1 text-xs font-semibold text-stone-400 uppercase tracking-wide">
          CPU の手 ({cpuCards.length}枚)
        </p>
        <div className="grid grid-cols-5 gap-2">
          {cpuCards.map(({ card }) => (
            <div
              key={card.id}
              className="h-14 rounded-lg bg-stone-300 shadow-sm"
              aria-hidden="true"
            />
          ))}
        </div>
      </section>

      {/* Player hand */}
      <section>
        <p className="mb-1 text-xs font-semibold text-stone-400 uppercase tracking-wide">
          あなたの手 ({playerCards.length}枚)
        </p>
        <div className="grid grid-cols-5 gap-2">
          {playerCards.map(({ card }) => {
            const isReadCard = card.id === round?.readCardId && !round?.isKarutaNashi;
            return (
              <button
                key={card.id}
                disabled={!canAnswer}
                onClick={() => handlePlayerAnswer(card.id)}
                className={[
                  'rounded-lg border-2 p-2 text-center shadow-sm transition',
                  'active:scale-95 disabled:cursor-not-allowed',
                  isReadCard
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300'
                    : 'border-stone-200 bg-white hover:border-indigo-300 hover:bg-indigo-50',
                  !canAnswer ? 'opacity-60' : '',
                ].join(' ')}
              >
                <p className="text-xs font-semibold text-stone-700 truncate">
                  {card.title}
                </p>
                <p className="mt-1 text-xs text-stone-500 leading-tight line-clamp-2">
                  {card.displayText}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Round result overlay */}
      {roundResult && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="rounded-2xl bg-white px-12 py-8 text-center shadow-2xl">
            <p className="text-3xl font-bold text-stone-800">
              {RESULT_LABELS[roundResult.result] ?? roundResult.result}
            </p>
            {roundResult.readCardTitle && (
              <p className="mt-2 text-sm text-stone-500">
                「{roundResult.readCardTitle}」
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
