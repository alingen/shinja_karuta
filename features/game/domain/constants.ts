import type { CpuDifficulty, CpuDifficultyConfig } from "./types";

// ────────────────────────────────────────────────────────────
// ゲームルール定数
// ────────────────────────────────────────────────────────────

/** 初期手札枚数 */
export const INITIAL_HAND_SIZE = 10;

/** 手札最大枚数（両者お手つき時の上限） */
export const MAX_HAND_SIZE = 15;

/** 暗記時間（ミリ秒） */
export const MEMORIZATION_DURATION_MS = 20_000;

/**
 * 同着判定の閾値（ミリ秒）
 * この時間以内の回答差は同着とみなす
 */
export const SIMULTANEOUS_THRESHOLD_MS = 50;

/** 空札タイムアウト（ミリ秒） */
export const KARUTA_NASHI_TIMEOUT_MS = 5_000;

// ────────────────────────────────────────────────────────────
// CPU 難易度設定
// ────────────────────────────────────────────────────────────

export const CPU_DIFFICULTY_CONFIGS: Record<
  CpuDifficulty,
  CpuDifficultyConfig
> = {
  easy: {
    mistakeRateMultiplier: 1.5,
    confusionMistakeBonus: 0.2,
    karutaNashiMistakeRate: 0.3,
    speedMultiplier: 1.5,
  },
  normal: {
    mistakeRateMultiplier: 1.0,
    confusionMistakeBonus: 0.15,
    karutaNashiMistakeRate: 0.15,
    speedMultiplier: 1.0,
  },
  hard: {
    mistakeRateMultiplier: 0.5,
    confusionMistakeBonus: 0.05,
    karutaNashiMistakeRate: 0.05,
    speedMultiplier: 0.6,
  },
};

/** MVP で使用する CPU 難易度 */
export const DEFAULT_CPU_DIFFICULTY: CpuDifficulty = "normal";

// ────────────────────────────────────────────────────────────
// MVP デッキ ID
// ────────────────────────────────────────────────────────────

export const DEMO_DECK_ID = "demo-deck-v1";
