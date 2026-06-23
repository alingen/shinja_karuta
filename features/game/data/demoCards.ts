import type { KarutaCard } from "@/features/game/domain/types";
import { DEMO_DECK_ID } from "@/features/game/domain/constants";

const D = DEMO_DECK_ID;

/**
 * 動作確認用仮カードデータ
 *
 * - 通常札: 12枚
 * - 沼札: 4組8枚 (confusionGroupId: "mud-A"〜"mud-D")
 * - 空札専用 (isBoardEligible: false): 5枚
 * 合計: 25枚
 */
export const DEMO_CARDS: KarutaCard[] = [
  // ──────────────────────────────
  // 通常札 12枚
  // ──────────────────────────────
  {
    id: "card-01",
    deckId: D,
    title: "初配信の決意",
    displayText: "今日から毎日配信していくぞ！",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 900, variationMs: 200, mistakeRate: 0.05 },
  },
  {
    id: "card-02",
    deckId: D,
    title: "まじか〜",
    displayText: "え〜〜まじか〜〜！！",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 800, variationMs: 150, mistakeRate: 0.05 },
  },
  {
    id: "card-03",
    deckId: D,
    title: "ありがとう三千人",
    displayText: "三千人ありがとうございます！",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 1000, variationMs: 250, mistakeRate: 0.08 },
  },
  {
    id: "card-04",
    deckId: D,
    title: "寝落ちしそう",
    displayText: "ちょっと待ってほんとに眠い、寝落ちしそう",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 1100, variationMs: 300, mistakeRate: 0.06 },
  },
  {
    id: "card-05",
    deckId: D,
    title: "ガチで泣いてる",
    displayText: "うそ、ガチで泣いてるんだけど",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 850, variationMs: 200, mistakeRate: 0.07 },
  },
  {
    id: "card-06",
    deckId: D,
    title: "切り抜いていいよ",
    displayText: "これ切り抜いていいよ、絶対バズるから",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 950, variationMs: 200, mistakeRate: 0.06 },
  },
  {
    id: "card-07",
    deckId: D,
    title: "スパチャ読み",
    displayText: "スーパーチャットありがとうございます！",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 900, variationMs: 150, mistakeRate: 0.05 },
  },
  {
    id: "card-08",
    deckId: D,
    title: "神ゲー宣言",
    displayText: "このゲーム神ゲーすぎる、やばい",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 780, variationMs: 180, mistakeRate: 0.07 },
  },
  {
    id: "card-09",
    deckId: D,
    title: "コメント追えない",
    displayText: "コメント速すぎて全然追えない！",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 1050, variationMs: 250, mistakeRate: 0.08 },
  },
  {
    id: "card-10",
    deckId: D,
    title: "本当にありがとう",
    displayText: "みんな本当にありがとう、大好き",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 920, variationMs: 200, mistakeRate: 0.05 },
  },
  {
    id: "card-11",
    deckId: D,
    title: "クリップで草",
    displayText: "クリップで草生えてる",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 700, variationMs: 150, mistakeRate: 0.06 },
  },
  {
    id: "card-12",
    deckId: D,
    title: "エンドカード",
    displayText: "また来てね、ばいばい！",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 800, variationMs: 200, mistakeRate: 0.05 },
  },

  // ──────────────────────────────
  // 沼札 A組（似た喜び系）
  // ──────────────────────────────
  {
    id: "card-mud-a1",
    deckId: D,
    title: "やったー！",
    displayText: "やったー！！！",
    confusionGroupId: "mud-A",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 750, variationMs: 180, mistakeRate: 0.18 },
  },
  {
    id: "card-mud-a2",
    deckId: D,
    title: "やばー！",
    displayText: "やばー！！！",
    confusionGroupId: "mud-A",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 750, variationMs: 180, mistakeRate: 0.18 },
  },

  // ──────────────────────────────
  // 沼札 B組（似た驚き系）
  // ──────────────────────────────
  {
    id: "card-mud-b1",
    deckId: D,
    title: "え？なんで？",
    displayText: "え？なんで？なんで？",
    confusionGroupId: "mud-B",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 850, variationMs: 200, mistakeRate: 0.2 },
  },
  {
    id: "card-mud-b2",
    deckId: D,
    title: "え？どういうこと？",
    displayText: "え？どういうこと？どういうこと？",
    confusionGroupId: "mud-B",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 870, variationMs: 200, mistakeRate: 0.2 },
  },

  // ──────────────────────────────
  // 沼札 C組（似た感謝系）
  // ──────────────────────────────
  {
    id: "card-mud-c1",
    deckId: D,
    title: "ありがとうね",
    displayText: "ありがとうね、本当に",
    confusionGroupId: "mud-C",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 900, variationMs: 220, mistakeRate: 0.16 },
  },
  {
    id: "card-mud-c2",
    deckId: D,
    title: "ありがとうございます",
    displayText: "ありがとうございます、本当に",
    confusionGroupId: "mud-C",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 920, variationMs: 220, mistakeRate: 0.16 },
  },

  // ──────────────────────────────
  // 沼札 D組（似た否定系）
  // ──────────────────────────────
  {
    id: "card-mud-d1",
    deckId: D,
    title: "むり〜",
    displayText: "むり〜！！これ無理〜！！",
    confusionGroupId: "mud-D",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 800, variationMs: 200, mistakeRate: 0.17 },
  },
  {
    id: "card-mud-d2",
    deckId: D,
    title: "もう〜！",
    displayText: "もう〜！！これもう〜！！",
    confusionGroupId: "mud-D",
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 810, variationMs: 200, mistakeRate: 0.17 },
  },

  // ──────────────────────────────
  // 空札専用 5枚 (isBoardEligible: false)
  // ──────────────────────────────
  {
    id: "card-nashi-01",
    deckId: D,
    title: "空札：あのさ",
    displayText: "あのさ、ちょっと聞いていい？",
    isBoardEligible: false,
    cpuConfig: { baseRecognitionMs: 0, variationMs: 0, mistakeRate: 0 },
  },
  {
    id: "card-nashi-02",
    deckId: D,
    title: "空札：待って",
    displayText: "待って待って待って！",
    isBoardEligible: false,
    cpuConfig: { baseRecognitionMs: 0, variationMs: 0, mistakeRate: 0 },
  },
  {
    id: "card-nashi-03",
    deckId: D,
    title: "空札：ほんとに",
    displayText: "ほんとに？ほんとに？",
    isBoardEligible: false,
    cpuConfig: { baseRecognitionMs: 0, variationMs: 0, mistakeRate: 0 },
  },
  {
    id: "card-nashi-04",
    deckId: D,
    title: "空札：え〜〜",
    displayText: "え〜〜〜〜〜！",
    isBoardEligible: false,
    cpuConfig: { baseRecognitionMs: 0, variationMs: 0, mistakeRate: 0 },
  },
  {
    id: "card-nashi-05",
    deckId: D,
    title: "空札：おやすみ",
    displayText: "おやすみなさい！",
    isBoardEligible: false,
    cpuConfig: { baseRecognitionMs: 0, variationMs: 0, mistakeRate: 0 },
  },
];

/** deckId でフィルタ（将来 Supabase に差し替えるときはここを変更） */
export function getDemoCards(deckId: string): KarutaCard[] {
  return DEMO_CARDS.filter((c) => c.deckId === deckId);
}
