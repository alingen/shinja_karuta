import type { PlayerSide, BoardCard } from "@/features/game/domain/types";
import { SIMULTANEOUS_THRESHOLD_MS } from "@/features/game/domain/constants";

/**
 * 同着判定。
 * 回答時間差が SIMULTANEOUS_THRESHOLD_MS 以内なら同着とみなす。
 * 同着の場合は正解札があった陣の所有者が取得する。
 */
export function judgeSimultaneous(
  playerAnsweredAt: number,
  cpuAnsweredAt: number
): boolean {
  return Math.abs(playerAnsweredAt - cpuAnsweredAt) <= SIMULTANEOUS_THRESHOLD_MS;
}

/**
 * 同着時の取得者：正解札が置かれていた陣の所有者。
 */
export function getSimultaneousWinner(
  board: BoardCard[],
  correctCardId: string
): PlayerSide {
  const bc = board.find((b) => b.card.id === correctCardId);
  // 盤面に存在しない場合はプレイヤー勝利（念のため）
  return bc?.owner ?? "player";
}
