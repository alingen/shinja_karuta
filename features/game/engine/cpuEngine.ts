import type { KarutaCard, CpuDifficulty, BoardCard } from "@/features/game/domain/types";
import {
  CPU_DIFFICULTY_CONFIGS,
  DEFAULT_CPU_DIFFICULTY,
} from "@/features/game/domain/constants";
import { pickRandom, randomIntInRange } from "./utils";

/**
 * CPU の回答時間を計算する（ミリ秒）。
 * baseRecognitionMs ± variationMs の範囲で乱数を返す。
 */
export function calcCpuAnswerTime(
  card: KarutaCard,
  difficulty: CpuDifficulty = DEFAULT_CPU_DIFFICULTY
): number {
  const config = CPU_DIFFICULTY_CONFIGS[difficulty];
  const base = card.cpuConfig.baseRecognitionMs * config.speedMultiplier;
  const variation = card.cpuConfig.variationMs;
  const raw = base + randomIntInRange(-variation, variation);
  return Math.max(100, Math.round(raw)); // 最低100ms
}

/**
 * CPU が誤答するかどうかを判定する。
 * 沼札の場合は追加補正がかかる。
 */
export function doesCpuMistake(
  card: KarutaCard,
  isConfusionCard: boolean,
  difficulty: CpuDifficulty = DEFAULT_CPU_DIFFICULTY
): boolean {
  const config = CPU_DIFFICULTY_CONFIGS[difficulty];
  let rate = card.cpuConfig.mistakeRate * config.mistakeRateMultiplier;
  if (isConfusionCard) {
    rate = Math.min(1.0, rate + config.confusionMistakeBonus);
  }
  return Math.random() < rate;
}

/**
 * 空札時に CPU がお手つきするかを判定する。
 */
export function doesCpuFoulOnKarutaNashi(
  difficulty: CpuDifficulty = DEFAULT_CPU_DIFFICULTY
): boolean {
  const config = CPU_DIFFICULTY_CONFIGS[difficulty];
  return Math.random() < config.karutaNashiMistakeRate;
}

/**
 * CPU が誤答した場合に押す（存在する）カードをランダムに選ぶ。
 * 正解カード以外から選ぶ。
 */
export function pickCpuWrongCard(
  board: BoardCard[],
  correctCardId: string
): BoardCard | undefined {
  const candidates = board.filter((b) => b.card.id !== correctCardId);
  return pickRandom(candidates);
}

/**
 * CPU の1ラウンドの行動を決定する。
 */
export type CpuAction =
  | { type: "correct"; cardId: string; answerTimeMs: number }
  | { type: "wrong"; cardId: string; answerTimeMs: number }
  | { type: "no_answer" };

export function decideCpuAction(
  board: BoardCard[],
  readCardId: string,
  isKarutaNashi: boolean,
  difficulty: CpuDifficulty = DEFAULT_CPU_DIFFICULTY
): CpuAction {
  const readCard = board.find((b) => b.card.id === readCardId)?.card;

  if (isKarutaNashi) {
    if (doesCpuFoulOnKarutaNashi(difficulty)) {
      const wrongCard = pickRandom(board);
      if (wrongCard) {
        const answerTimeMs = randomIntInRange(500, 2000);
        return { type: "wrong", cardId: wrongCard.card.id, answerTimeMs };
      }
    }
    return { type: "no_answer" };
  }

  if (!readCard) {
    // 盤面にない（空札的状況）
    return { type: "no_answer" };
  }

  const isConfusion = readCard.confusionGroupId !== undefined;
  const answerTimeMs = calcCpuAnswerTime(readCard, difficulty);

  if (doesCpuMistake(readCard, isConfusion, difficulty)) {
    const wrongCard = pickCpuWrongCard(board, readCardId);
    if (wrongCard) {
      return { type: "wrong", cardId: wrongCard.card.id, answerTimeMs };
    }
  }

  return { type: "correct", cardId: readCardId, answerTimeMs };
}
