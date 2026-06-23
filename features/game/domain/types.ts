// ────────────────────────────────────────────────────────────
// Card
// ────────────────────────────────────────────────────────────

export type CpuCardConfig = {
  /** 基本認識時間（ミリ秒） */
  baseRecognitionMs: number;
  /** ±この範囲でランダムにブレる（ミリ秒） */
  variationMs: number;
  /** 誤答率 0.0〜1.0 */
  mistakeRate: number;
};

export type KarutaCard = {
  id: string;
  deckId: string;
  title: string;
  /** 読み上げ・表示テキスト */
  displayText: string;
  imageUrl?: string;
  audioUrl?: string;
  category?: string;
  /** 同じ ID の札は沼札グループ */
  confusionGroupId?: string;
  /** true なら盤面に配置可能、false なら空札専用 */
  isBoardEligible: boolean;
  cpuConfig: CpuCardConfig;
};

// ────────────────────────────────────────────────────────────
// Board
// ────────────────────────────────────────────────────────────

export type PlayerSide = "player" | "cpu";

export type BoardCard = {
  card: KarutaCard;
  owner: PlayerSide;
};

// ────────────────────────────────────────────────────────────
// Round
// ────────────────────────────────────────────────────────────

export type RoundPhase =
  | "memorizing"
  | "reading"
  | "waiting_transfer"
  | "round_end";

export type RoundResult =
  | "player_correct"
  | "cpu_correct"
  | "player_foul"
  | "cpu_foul"
  | "both_foul"
  | "simultaneous"
  | "karuta_nashi" // 空札
  | "timeout";

export type TransferReason = "correct_enemy" | "foul";

export type PendingTransfer = {
  reason: TransferReason;
  /** 送り元 */
  from: PlayerSide;
  /** 送り先 */
  to: PlayerSide;
};

export type RoundState = {
  roundNumber: number;
  phase: RoundPhase;
  readCardId: string;
  isKarutaNashi: boolean;
  /** ラウンド開始（音声再生開始）のタイムスタンプ（ms） */
  startedAt: number | null;
  playerAnsweredAt: number | null;
  cpuAnsweredAt: number | null;
  result: RoundResult | null;
  pendingTransfer: PendingTransfer | null;
};

// ────────────────────────────────────────────────────────────
// Stats
// ────────────────────────────────────────────────────────────

export type PlayerStats = {
  correctCount: number;
  foulCount: number;
  takenCount: number;
  /** 決まり秒記録（ミリ秒） */
  kimariMs: number[];
};

// ────────────────────────────────────────────────────────────
// Game State
// ────────────────────────────────────────────────────────────

export type GamePhase =
  | "idle"
  | "memorizing"
  | "playing"
  | "finished";

export type GameState = {
  phase: GamePhase;
  /** 全デッキカード（盤面外を含む） */
  allCards: KarutaCard[];
  /** 現在の盤面 */
  board: BoardCard[];
  /** 現在のラウンド */
  currentRound: RoundState | null;
  playerStats: PlayerStats;
  cpuStats: PlayerStats;
  winner: PlayerSide | null;
};

// ────────────────────────────────────────────────────────────
// CPU Difficulty
// ────────────────────────────────────────────────────────────

export type CpuDifficulty = "easy" | "normal" | "hard";

export type CpuDifficultyConfig = {
  mistakeRateMultiplier: number;
  confusionMistakeBonus: number;
  karutaNashiMistakeRate: number;
  speedMultiplier: number;
};

// ────────────────────────────────────────────────────────────
// Answer
// ────────────────────────────────────────────────────────────

export type AnswerTarget =
  | { type: "card"; cardId: string }
  | { type: "no_answer" };
