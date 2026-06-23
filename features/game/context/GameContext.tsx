'use client';

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type {
  GameState,
  PlayerSide,
  RoundResult,
  BoardCard,
} from '@/features/game/domain/types';
import {
  MEMORIZATION_DURATION_MS,
  KARUTA_NASHI_TIMEOUT_MS,
  SIMULTANEOUS_THRESHOLD_MS,
  DEFAULT_CPU_DIFFICULTY,
  DEMO_DECK_ID,
} from '@/features/game/domain/constants';
import {
  createInitialGameState,
  createNextRound,
  isCorrectAnswer,
  processCorrectAnswer,
  processFoul,
  pickCpuFoulSendCard,
  processBothFoul,
  judgeVictory,
  transferCard,
  getHandCards,
  recordKimariMs,
} from '@/features/game/engine/boardEngine';
import { decideCpuAction, type CpuAction } from '@/features/game/engine/cpuEngine';
import { judgeSimultaneous, getSimultaneousWinner } from '@/features/game/engine/simultaneousJudge';
import { pickRandom } from '@/features/game/engine/utils';
import { getDemoCards } from '@/features/game/data/demoCards';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export type RoundResultInfo = {
  result: RoundResult;
  readCardTitle: string;
};

type RoundTiming = {
  startedAt: number;
  cpuAction: CpuAction;
  cpuWillAnswerAt: number;
  playerAnsweredAt: number | null;
  cpuAnsweredAt: number | null;
  cpuAnsweredCardId: string | null;
  resolved: boolean;
};

type GameContextValue = {
  gameState: GameState | null;
  roundResult: RoundResultInfo | null;
  startGame: () => void;
  handlePlayerAnswer: (cardId: string) => void;
};

// ────────────────────────────────────────────────────────────
// Context
// ────────────────────────────────────────────────────────────

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}

// ────────────────────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────────────────────

export function GameProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResultInfo | null>(null);

  const timing = useRef<RoundTiming | null>(null);
  const cpuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const karutaNashiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const memTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest state without triggering re-renders in closures
  const gsRef = useRef<GameState | null>(null);
  // Forward reference for beginNextRound (defined after resolveRound)
  const beginNextRoundRef = useRef<((state: GameState) => void) | null>(null);

  const clearRoundTimers = useCallback(() => {
    [cpuTimer, karutaNashiTimer].forEach((r) => {
      if (r.current) { clearTimeout(r.current); r.current = null; }
    });
  }, []);

  // ────────────────────────────────────────────────────────────
  // Auto-pick helper
  // ────────────────────────────────────────────────────────────

  function autoPickCard(board: BoardCard[], side: PlayerSide): BoardCard | undefined {
    return pickRandom(getHandCards(board, side));
  }

  // ────────────────────────────────────────────────────────────
  // Round resolution
  // ────────────────────────────────────────────────────────────

  const resolveRound = useCallback(
    (
      state: GameState,
      playerAnsweredAt: number | null,
      playerCardId: string | null,
      cpuAnsweredAt: number | null,
      cpuCardId: string | null
    ) => {
      if (!state.currentRound) return;
      const { readCardId, isKarutaNashi, startedAt } = state.currentRound;
      if (startedAt === null) return;

      clearRoundTimers();

      const playerCorrect =
        playerCardId !== null &&
        isCorrectAnswer(state.board, readCardId, playerCardId, isKarutaNashi);
      const cpuCorrect =
        cpuCardId !== null &&
        isCorrectAnswer(state.board, readCardId, cpuCardId, isKarutaNashi);
      const playerFoul = playerCardId !== null && !playerCorrect;
      const cpuFoul = cpuCardId !== null && !cpuCorrect;

      let result: RoundResult;
      let newBoard = state.board;
      let newPlayerStats = state.playerStats;
      let newCpuStats = state.cpuStats;

      const simultaneous =
        playerAnsweredAt !== null &&
        cpuAnsweredAt !== null &&
        judgeSimultaneous(playerAnsweredAt, cpuAnsweredAt) &&
        playerCorrect &&
        cpuCorrect;

      if (simultaneous) {
        const winner = getSimultaneousWinner(state.board, readCardId);
        result = 'simultaneous';
        const sim = processCorrectAnswer(state, winner, readCardId);
        newBoard = sim.newBoard;
        if (sim.requiresTransfer) {
          const tc = autoPickCard(newBoard, sim.transferFrom);
          if (tc) newBoard = transferCard(newBoard, tc.card.id, sim.transferTo);
        }
        if (winner === 'player') {
          newPlayerStats = {
            ...recordKimariMs(newPlayerStats, startedAt, playerAnsweredAt!),
            correctCount: newPlayerStats.correctCount + 1,
            takenCount: newPlayerStats.takenCount + 1,
          };
        } else {
          newCpuStats = {
            ...newCpuStats,
            correctCount: newCpuStats.correctCount + 1,
            takenCount: newCpuStats.takenCount + 1,
          };
        }
      } else if (
        playerCorrect &&
        (!cpuAnsweredAt || (playerAnsweredAt !== null && playerAnsweredAt < cpuAnsweredAt))
      ) {
        result = 'player_correct';
        const proc = processCorrectAnswer(state, 'player', readCardId);
        newBoard = proc.newBoard;
        if (proc.requiresTransfer) {
          const tc = autoPickCard(newBoard, 'player');
          if (tc) newBoard = transferCard(newBoard, tc.card.id, 'cpu');
        }
        newPlayerStats = {
          ...recordKimariMs(newPlayerStats, startedAt, playerAnsweredAt!),
          correctCount: newPlayerStats.correctCount + 1,
          takenCount: newPlayerStats.takenCount + 1,
        };
        if (cpuFoul) {
          newCpuStats = { ...newCpuStats, foulCount: newCpuStats.foulCount + 1 };
          const tc = autoPickCard(newBoard, 'player');
          if (tc) newBoard = transferCard(newBoard, tc.card.id, 'cpu');
        }
      } else if (
        cpuCorrect &&
        (!playerAnsweredAt || (cpuAnsweredAt !== null && cpuAnsweredAt < playerAnsweredAt))
      ) {
        result = 'cpu_correct';
        const proc = processCorrectAnswer(state, 'cpu', readCardId);
        newBoard = proc.newBoard;
        if (proc.requiresTransfer) {
          const tc = autoPickCard(newBoard, 'cpu');
          if (tc) newBoard = transferCard(newBoard, tc.card.id, 'player');
        }
        newCpuStats = {
          ...newCpuStats,
          correctCount: newCpuStats.correctCount + 1,
          takenCount: newCpuStats.takenCount + 1,
        };
        if (playerFoul) {
          newPlayerStats = { ...newPlayerStats, foulCount: newPlayerStats.foulCount + 1 };
          const tc = autoPickCard(newBoard, 'cpu');
          if (tc) newBoard = transferCard(newBoard, tc.card.id, 'player');
        }
      } else if (playerFoul && cpuFoul) {
        result = 'both_foul';
        newPlayerStats = { ...newPlayerStats, foulCount: newPlayerStats.foulCount + 1 };
        newCpuStats = { ...newCpuStats, foulCount: newCpuStats.foulCount + 1 };
        const bf = processBothFoul(state);
        newBoard = bf.newBoard;
      } else if (playerFoul) {
        result = 'player_foul';
        newPlayerStats = { ...newPlayerStats, foulCount: newPlayerStats.foulCount + 1 };
        const cpuSend = pickCpuFoulSendCard(state.board);
        if (cpuSend) newBoard = processFoul(state.board, 'player', cpuSend.card.id);
      } else if (cpuFoul) {
        result = 'cpu_foul';
        newCpuStats = { ...newCpuStats, foulCount: newCpuStats.foulCount + 1 };
        const playerSend = autoPickCard(state.board, 'player');
        if (playerSend) newBoard = processFoul(state.board, 'cpu', playerSend.card.id);
      } else {
        result = isKarutaNashi ? 'karuta_nashi' : 'timeout';
      }

      const winner = judgeVictory(newBoard);
      const readCard = state.allCards.find((c) => c.id === readCardId);

      const nextState: GameState = {
        ...state,
        board: newBoard,
        playerStats: newPlayerStats,
        cpuStats: newCpuStats,
        winner,
        currentRound: {
          ...state.currentRound!,
          phase: 'round_end',
          result,
          playerAnsweredAt,
          cpuAnsweredAt,
        },
      };
      gsRef.current = nextState;
      setGameState(nextState);
      setRoundResult({ result, readCardTitle: readCard?.title ?? '' });

      resultTimer.current = setTimeout(() => {
        setRoundResult(null);
        if (winner) {
          const finished: GameState = { ...nextState, phase: 'finished' };
          gsRef.current = finished;
          setGameState(finished);
          router.push('/game/result');
        } else {
          beginNextRoundRef.current?.(nextState);
        }
      }, 1500);
    },
    [clearRoundTimers, router]
  );

  // ────────────────────────────────────────────────────────────
  // Begin a new round
  // ────────────────────────────────────────────────────────────

  const beginNextRound = useCallback(
    (state: GameState) => {
      const roundNumber = (state.currentRound?.roundNumber ?? 0) + 1;
      const round = createNextRound(state.allCards, state.board, roundNumber);
      const now = Date.now();

      const cpuAction = decideCpuAction(
        state.board,
        round.readCardId,
        round.isKarutaNashi,
        DEFAULT_CPU_DIFFICULTY
      );
      const cpuWillAnswerAt =
        cpuAction.type !== 'no_answer' ? now + cpuAction.answerTimeMs : Infinity;

      timing.current = {
        startedAt: now,
        cpuAction,
        cpuWillAnswerAt,
        playerAnsweredAt: null,
        cpuAnsweredAt: null,
        cpuAnsweredCardId: null,
        resolved: false,
      };

      const newState: GameState = {
        ...state,
        currentRound: { ...round, startedAt: now },
      };
      gsRef.current = newState;
      setGameState(newState);

      if (cpuAction.type !== 'no_answer') {
        cpuTimer.current = setTimeout(() => {
          const t = timing.current;
          if (!t || t.resolved) return;
          t.cpuAnsweredAt = now + cpuAction.answerTimeMs;
          t.cpuAnsweredCardId = cpuAction.cardId;
          if (t.playerAnsweredAt === null) {
            t.resolved = true;
            resolveRound(gsRef.current!, null, null, t.cpuAnsweredAt, cpuAction.cardId);
          }
        }, cpuAction.answerTimeMs);
      }

      karutaNashiTimer.current = setTimeout(() => {
        const t = timing.current;
        if (!t || t.resolved) return;
        t.resolved = true;
        resolveRound(gsRef.current!, null, null, null, null);
      }, KARUTA_NASHI_TIMEOUT_MS + 500);
    },
    [resolveRound]
  );

  // Wire forward reference
  useEffect(() => {
    beginNextRoundRef.current = beginNextRound;
  }, [beginNextRound]);

  // ────────────────────────────────────────────────────────────
  // Start game
  // ────────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    if (memTimer.current) clearTimeout(memTimer.current);
    if (resultTimer.current) clearTimeout(resultTimer.current);
    clearRoundTimers();
    timing.current = null;

    const allCards = getDemoCards(DEMO_DECK_ID);
    const state = createInitialGameState(allCards);
    gsRef.current = state;
    setGameState(state);
    setRoundResult(null);

    router.push('/game/memorize');

    memTimer.current = setTimeout(() => {
      const playingState: GameState = { ...(gsRef.current ?? state), phase: 'playing' };
      gsRef.current = playingState;
      setGameState(playingState);
      router.push('/game/play');
      beginNextRound(playingState);
    }, MEMORIZATION_DURATION_MS);
  }, [router, beginNextRound, clearRoundTimers]);

  // ────────────────────────────────────────────────────────────
  // Player answer
  // ────────────────────────────────────────────────────────────

  const handlePlayerAnswer = useCallback(
    (cardId: string) => {
      const t = timing.current;
      const state = gsRef.current;
      if (!t || t.resolved || !state) return;

      const now = Date.now();
      t.playerAnsweredAt = now;

      if (t.cpuAnsweredAt !== null && t.cpuAnsweredCardId !== null) {
        // CPU already fired
        if (!t.resolved) {
          t.resolved = true;
          resolveRound(state, now, cardId, t.cpuAnsweredAt, t.cpuAnsweredCardId);
        }
      } else if (now >= t.cpuWillAnswerAt - SIMULTANEOUS_THRESHOLD_MS) {
        // Within simultaneous window
        clearRoundTimers();
        t.cpuAnsweredAt = t.cpuWillAnswerAt;
        t.cpuAnsweredCardId = t.cpuAction.type !== 'no_answer' ? t.cpuAction.cardId : null;
        t.resolved = true;
        resolveRound(state, now, cardId, t.cpuAnsweredAt, t.cpuAnsweredCardId);
      } else {
        // Player clearly first
        clearRoundTimers();
        t.resolved = true;
        resolveRound(state, now, cardId, null, null);
      }
    },
    [resolveRound, clearRoundTimers]
  );

  return (
    <GameContext.Provider value={{ gameState, roundResult, startGame, handlePlayerAnswer }}>
      {children}
    </GameContext.Provider>
  );
}
