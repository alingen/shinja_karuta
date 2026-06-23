import type {
  KarutaCard,
  GameState,
  BoardCard,
  PlayerSide,
  PlayerStats,
  RoundState,
} from "@/features/game/domain/types";
import {
  INITIAL_HAND_SIZE,
  MAX_HAND_SIZE,
} from "@/features/game/domain/constants";
import { shuffle, pickRandom } from "./utils";

// ────────────────────────────────────────────────────────────
// Initial state
// ────────────────────────────────────────────────────────────

const emptyStats = (): PlayerStats => ({
  correctCount: 0,
  foulCount: 0,
  takenCount: 0,
  kimariMs: [],
});

/**
 * カード一覧から初期盤面を生成する。
 * - isBoardEligible === true のカードを対象に INITIAL_HAND_SIZE * 2 枚を選ぶ
 * - プレイヤー側 / CPU 側に INITIAL_HAND_SIZE 枚ずつ割り当て
 * - 同じカードが両陣に重複しない
 */
export function createInitialGameState(allCards: KarutaCard[]): GameState {
  const eligible = allCards.filter((c) => c.isBoardEligible);
  if (eligible.length < INITIAL_HAND_SIZE * 2) {
    throw new Error(
      `isBoardEligible なカードが ${INITIAL_HAND_SIZE * 2} 枚未満です`
    );
  }

  const picked = shuffle(eligible).slice(0, INITIAL_HAND_SIZE * 2);
  const board: BoardCard[] = [
    ...picked.slice(0, INITIAL_HAND_SIZE).map((card) => ({
      card,
      owner: "player" as PlayerSide,
    })),
    ...picked.slice(INITIAL_HAND_SIZE).map((card) => ({
      card,
      owner: "cpu" as PlayerSide,
    })),
  ];

  return {
    phase: "memorizing",
    allCards,
    board,
    currentRound: null,
    playerStats: emptyStats(),
    cpuStats: emptyStats(),
    winner: null,
  };
}

// ────────────────────────────────────────────────────────────
// Board helpers
// ────────────────────────────────────────────────────────────

export function getHandCards(
  board: BoardCard[],
  owner: PlayerSide
): BoardCard[] {
  return board.filter((b) => b.owner === owner);
}

export function getHandCount(board: BoardCard[], owner: PlayerSide): number {
  return getHandCards(board, owner).length;
}

function findBoardCard(
  board: BoardCard[],
  cardId: string
): BoardCard | undefined {
  return board.find((b) => b.card.id === cardId);
}

// ────────────────────────────────────────────────────────────
// Answer judging
// ────────────────────────────────────────────────────────────

/**
 * 答えた cardId が正解かどうかを判定する。
 * - 盤面に存在しないカードID → 不正解
 * - 読み上げカードが盤面に存在しないラウンド（空札）→ 常に不正解
 */
export function isCorrectAnswer(
  board: BoardCard[],
  readCardId: string,
  answeredCardId: string,
  isKarutaNashi: boolean
): boolean {
  if (isKarutaNashi) return false;
  return answeredCardId === readCardId && findBoardCard(board, readCardId) !== undefined;
}

// ────────────────────────────────────────────────────────────
// Correct answer processing
// ────────────────────────────────────────────────────────────

/**
 * 正解処理：盤面から正解札を取り除く。
 * 返り値は「送り札が必要かどうか」と新しい board。
 *
 * - 自陣の札を取った場合: 除去するだけ
 * - 敵陣の札を取った場合: 除去＋送り札が必要
 */
export function processCorrectAnswer(
  state: GameState,
  answerer: PlayerSide,
  cardId: string
): {
  newBoard: BoardCard[];
  requiresTransfer: boolean;
  transferFrom: PlayerSide;
  transferTo: PlayerSide;
} {
  const bc = findBoardCard(state.board, cardId);
  if (!bc) throw new Error(`カードが盤面にありません: ${cardId}`);

  const newBoard = state.board.filter((b) => b.card.id !== cardId);
  const takenFromOwnSide = bc.owner === answerer;

  if (takenFromOwnSide) {
    return {
      newBoard,
      requiresTransfer: false,
      transferFrom: answerer,
      transferTo: answerer,
    };
  } else {
    // 敵陣を取った → 自陣から1枚を相手に送る
    return {
      newBoard,
      requiresTransfer: true,
      transferFrom: answerer,
      transferTo: bc.owner,
    };
  }
}

/**
 * 送り札を実行する：`from` 側の指定カードを `to` 側に移す。
 */
export function transferCard(
  board: BoardCard[],
  cardIdToTransfer: string,
  to: PlayerSide
): BoardCard[] {
  return board.map((b) =>
    b.card.id === cardIdToTransfer ? { ...b, owner: to } : b
  );
}

// ────────────────────────────────────────────────────────────
// Foul processing
// ────────────────────────────────────────────────────────────

/**
 * お手つき処理：相手側が選んだカード1枚を fouler 側に送る。
 * CPU がお手つきした場合 → プレイヤーが選ぶ（UI 側で選択）。
 * プレイヤーがお手つきした場合 → CPU が自動選択（ここで実行）。
 */
export function processFoul(
  board: BoardCard[],
  fouler: PlayerSide,
  cardIdToSend: string
): BoardCard[] {
  // 相手側のカードを fouler 側に移す（ただし盤面上限はゲーム全体で管理）
  return transferCard(board, cardIdToSend, fouler);
}

/**
 * CPU のお手つき時に自動で送るカードを選ぶ。
 * CPU 自陣からランダムに1枚選ぶ。
 */
export function pickCpuFoulSendCard(
  board: BoardCard[]
): BoardCard | undefined {
  const cpuCards = getHandCards(board, "cpu");
  return pickRandom(cpuCards);
}

// ────────────────────────────────────────────────────────────
// Both foul processing
// ────────────────────────────────────────────────────────────

/**
 * 両者お手つき処理：
 * 盤面に存在せず使用可能な札からランダムで両者に1枚ずつ追加。
 * MAX_HAND_SIZE を超えないように制限する。
 */
export function processBothFoul(
  state: GameState
): { newBoard: BoardCard[]; addedToPlayer: boolean; addedToCpu: boolean } {
  const boardIds = new Set(state.board.map((b) => b.card.id));
  const notOnBoard = state.allCards.filter(
    (c) => c.isBoardEligible && !boardIds.has(c.id)
  );

  let newBoard = [...state.board];
  let addedToPlayer = false;
  let addedToCpu = false;

  // プレイヤーに追加
  if (
    getHandCount(newBoard, "player") < MAX_HAND_SIZE &&
    notOnBoard.length > 0
  ) {
    const card = pickRandom(notOnBoard);
    if (card) {
      newBoard = [...newBoard, { card, owner: "player" }];
      addedToPlayer = true;
      // 追加したカードは次の CPU への追加候補から除外
      notOnBoard.splice(notOnBoard.indexOf(card), 1);
    }
  }

  // CPU に追加
  if (
    getHandCount(newBoard, "cpu") < MAX_HAND_SIZE &&
    notOnBoard.length > 0
  ) {
    const card = pickRandom(notOnBoard);
    if (card) {
      newBoard = [...newBoard, { card, owner: "cpu" }];
      addedToCpu = true;
    }
  }

  return { newBoard, addedToPlayer, addedToCpu };
}

// ────────────────────────────────────────────────────────────
// Victory
// ────────────────────────────────────────────────────────────

/**
 * 勝敗判定。自陣が0枚になったプレイヤーが勝者。
 * 両者0枚は理論上発生しないが念のため先手番優先。
 */
export function judgeVictory(board: BoardCard[]): PlayerSide | null {
  const playerCount = getHandCount(board, "player");
  const cpuCount = getHandCount(board, "cpu");
  if (playerCount === 0) return "player";
  if (cpuCount === 0) return "cpu";
  return null;
}

// ────────────────────────────────────────────────────────────
// Round management
// ────────────────────────────────────────────────────────────

/**
 * 次ラウンドのカードを選ぶ。
 * - 盤面のカードから1枚（空札候補も含む）をランダムに選ぶ
 * - 空札の場合は isKarutaNashi = true
 *
 * 空札出題確率: 盤面20枚に対して使用可能な空札専用カードが存在する場合、
 * 盤面カード: 空札 = 4:1 の割合で選ぶ（約20%）
 */
export function pickNextReadCard(
  allCards: KarutaCard[],
  board: BoardCard[]
): { readCard: KarutaCard; isKarutaNashi: boolean } {
  const karutaNashiCards = allCards.filter((c) => !c.isBoardEligible);
  const boardCards = board.map((b) => b.card);

  // 空札出題確率: 空札専用カードがあれば約20%の確率で空札を選ぶ
  const useKarutaNashi =
    karutaNashiCards.length > 0 && Math.random() < 0.2;

  if (useKarutaNashi) {
    const card = pickRandom(karutaNashiCards)!;
    return { readCard: card, isKarutaNashi: true };
  }

  const card = pickRandom(boardCards);
  if (!card) throw new Error("盤面にカードがありません");
  return { readCard: card, isKarutaNashi: false };
}

/**
 * 次ラウンドの RoundState を生成する。
 */
export function createNextRound(
  allCards: KarutaCard[],
  board: BoardCard[],
  roundNumber: number
): RoundState {
  const { readCard, isKarutaNashi } = pickNextReadCard(allCards, board);
  return {
    roundNumber,
    phase: "reading",
    readCardId: readCard.id,
    isKarutaNashi,
    startedAt: null,
    playerAnsweredAt: null,
    cpuAnsweredAt: null,
    result: null,
    pendingTransfer: null,
  };
}

// ────────────────────────────────────────────────────────────
// Kimari seconds
// ────────────────────────────────────────────────────────────

/**
 * 決まり秒を PlayerStats に記録する。
 */
export function recordKimariMs(
  stats: PlayerStats,
  startedAt: number,
  answeredAt: number
): PlayerStats {
  const ms = answeredAt - startedAt;
  return {
    ...stats,
    kimariMs: [...stats.kimariMs, ms],
  };
}

export function getAverageKimariMs(kimariMs: number[]): number {
  if (kimariMs.length === 0) return 0;
  return kimariMs.reduce((a, b) => a + b, 0) / kimariMs.length;
}

export function getFastestKimariMs(kimariMs: number[]): number {
  if (kimariMs.length === 0) return 0;
  return Math.min(...kimariMs);
}
