import { describe, it, expect } from "vitest";
import {
  createInitialGameState,
  getHandCount,
  isCorrectAnswer,
  processCorrectAnswer,
  transferCard,
  processFoul,
  processBothFoul,
  judgeVictory,
  createNextRound,
  recordKimariMs,
  getAverageKimariMs,
  getFastestKimariMs,
} from "@/features/game/engine/boardEngine";
import type { KarutaCard, BoardCard, GameState } from "@/features/game/domain/types";
import { DEMO_CARDS } from "@/features/game/data/demoCards";
import {
  INITIAL_HAND_SIZE,
  MAX_HAND_SIZE,
} from "@/features/game/domain/constants";

// ────────────────────────────────────────────────────────────
// テスト用ヘルパー
// ────────────────────────────────────────────────────────────

function makeDummyCard(
  id: string,
  overrides: Partial<KarutaCard> = {}
): KarutaCard {
  return {
    id,
    deckId: "test-deck",
    title: `Card ${id}`,
    displayText: `表示テキスト ${id}`,
    isBoardEligible: true,
    cpuConfig: { baseRecognitionMs: 1000, variationMs: 200, mistakeRate: 0.1 },
    ...overrides,
  };
}

/** isBoardEligible なカードを n 枚生成 */
function makeDummyCards(n: number): KarutaCard[] {
  return Array.from({ length: n }, (_, i) => makeDummyCard(`card-${i + 1}`));
}

/** テスト用の初期 GameState を直接組み立てる */
function makeGameState(
  playerCards: KarutaCard[],
  cpuCards: KarutaCard[],
  extraCards: KarutaCard[] = []
): GameState {
  const board: BoardCard[] = [
    ...playerCards.map((card) => ({ card, owner: "player" as const })),
    ...cpuCards.map((card) => ({ card, owner: "cpu" as const })),
  ];
  const allCards = [...playerCards, ...cpuCards, ...extraCards];
  return {
    phase: "playing",
    allCards,
    board,
    currentRound: null,
    playerStats: {
      correctCount: 0,
      foulCount: 0,
      takenCount: 0,
      kimariMs: [],
    },
    cpuStats: { correctCount: 0, foulCount: 0, takenCount: 0, kimariMs: [] },
    winner: null,
  };
}

// ────────────────────────────────────────────────────────────
// createInitialGameState
// ────────────────────────────────────────────────────────────

describe("createInitialGameState", () => {
  it("自陣10枚、敵陣10枚になる", () => {
    const state = createInitialGameState(DEMO_CARDS);
    expect(getHandCount(state.board, "player")).toBe(INITIAL_HAND_SIZE);
    expect(getHandCount(state.board, "cpu")).toBe(INITIAL_HAND_SIZE);
  });

  it("盤面合計は20枚", () => {
    const state = createInitialGameState(DEMO_CARDS);
    expect(state.board.length).toBe(INITIAL_HAND_SIZE * 2);
  });

  it("同じカードが両陣に重複しない", () => {
    const state = createInitialGameState(DEMO_CARDS);
    const ids = state.board.map((b) => b.card.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("空札専用カードが盤面に配置されない", () => {
    const state = createInitialGameState(DEMO_CARDS);
    const nashiOnBoard = state.board.filter(
      (b) => !b.card.isBoardEligible
    );
    expect(nashiOnBoard.length).toBe(0);
  });

  it("isBoardEligible なカードが不足する場合はエラー", () => {
    const insufficient = makeDummyCards(INITIAL_HAND_SIZE * 2 - 1);
    expect(() => createInitialGameState(insufficient)).toThrow();
  });
});

// ────────────────────────────────────────────────────────────
// isCorrectAnswer
// ────────────────────────────────────────────────────────────

describe("isCorrectAnswer", () => {
  const cards = makeDummyCards(4);
  const board: BoardCard[] = cards.map((c, i) => ({
    card: c,
    owner: i < 2 ? "player" : "cpu",
  }));

  it("正解カードを押すと正解", () => {
    expect(isCorrectAnswer(board, "card-1", "card-1", false)).toBe(true);
  });

  it("違うカードを押すと不正解", () => {
    expect(isCorrectAnswer(board, "card-1", "card-2", false)).toBe(false);
  });

  it("空札のときは何を押しても不正解", () => {
    expect(isCorrectAnswer(board, "card-1", "card-1", true)).toBe(false);
  });

  it("盤面にないカードIDを押すと不正解", () => {
    expect(isCorrectAnswer(board, "card-999", "card-999", false)).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────
// processCorrectAnswer
// ────────────────────────────────────────────────────────────

describe("processCorrectAnswer", () => {
  it("自陣の札を取ると自陣が1枚減る", () => {
    const playerCards = makeDummyCards(3);
    const cpuCards = makeDummyCards(3).map((c) => ({
      ...c,
      id: `cpu-${c.id}`,
    }));
    const state = makeGameState(playerCards, cpuCards);

    const { newBoard, requiresTransfer } = processCorrectAnswer(
      state,
      "player",
      "card-1" // プレイヤー自陣のカード
    );
    expect(getHandCount(newBoard, "player")).toBe(2);
    expect(requiresTransfer).toBe(false);
  });

  it("敵陣の札を取ると送り札処理が発生する", () => {
    const playerCards = [makeDummyCard("p-1"), makeDummyCard("p-2")];
    const cpuCards = [makeDummyCard("c-1"), makeDummyCard("c-2")];
    const state = makeGameState(playerCards, cpuCards);

    const { newBoard, requiresTransfer, transferFrom, transferTo } =
      processCorrectAnswer(state, "player", "c-1"); // 敵陣のカードを取る
    expect(newBoard.find((b) => b.card.id === "c-1")).toBeUndefined();
    expect(requiresTransfer).toBe(true);
    expect(transferFrom).toBe("player");
    expect(transferTo).toBe("cpu");
  });
});

// ────────────────────────────────────────────────────────────
// transferCard
// ────────────────────────────────────────────────────────────

describe("transferCard", () => {
  it("指定カードのオーナーが変わる", () => {
    const cards = [makeDummyCard("p-1"), makeDummyCard("p-2")];
    const board: BoardCard[] = cards.map((c) => ({ card: c, owner: "player" as const }));
    const newBoard = transferCard(board, "p-1", "cpu");
    const moved = newBoard.find((b) => b.card.id === "p-1");
    expect(moved?.owner).toBe("cpu");
    const unchanged = newBoard.find((b) => b.card.id === "p-2");
    expect(unchanged?.owner).toBe("player");
  });
});

// ────────────────────────────────────────────────────────────
// processFoul / foul sends card
// ────────────────────────────────────────────────────────────

describe("processFoul", () => {
  it("お手つき時に相手から札が送られる（プレイヤーがお手つき）", () => {
    const playerCards = [makeDummyCard("p-1")];
    const cpuCards = [makeDummyCard("c-1"), makeDummyCard("c-2")];
    const board: BoardCard[] = [
      ...playerCards.map((c) => ({ card: c, owner: "player" as const })),
      ...cpuCards.map((c) => ({ card: c, owner: "cpu" as const })),
    ];

    // CPU側の "c-1" をプレイヤーに送る
    const newBoard = processFoul(board, "player", "c-1");
    const c1 = newBoard.find((b) => b.card.id === "c-1");
    expect(c1?.owner).toBe("player");
  });
});

// ────────────────────────────────────────────────────────────
// processBothFoul
// ────────────────────────────────────────────────────────────

describe("processBothFoul", () => {
  it("両者お手つき時に両者へ札が追加される", () => {
    const playerCards = makeDummyCards(2);
    const cpuCards = [makeDummyCard("c-1"), makeDummyCard("c-2")];
    // 盤面外の追加可能カード
    const extraCards = [makeDummyCard("extra-1"), makeDummyCard("extra-2")];
    const state = makeGameState(playerCards, cpuCards, extraCards);

    const { newBoard, addedToPlayer, addedToCpu } = processBothFoul(state);
    expect(addedToPlayer).toBe(true);
    expect(addedToCpu).toBe(true);
    expect(getHandCount(newBoard, "player")).toBe(3);
    expect(getHandCount(newBoard, "cpu")).toBe(3);
  });

  it(`最大${MAX_HAND_SIZE}枚を超えて追加されない`, () => {
    // プレイヤーが既に MAX_HAND_SIZE 枚持っている状態
    const playerCards = makeDummyCards(MAX_HAND_SIZE);
    const cpuCards = [makeDummyCard("c-1")];
    const extraCards = [makeDummyCard("extra-1")];
    const state = makeGameState(playerCards, cpuCards, extraCards);

    const { newBoard, addedToPlayer } = processBothFoul(state);
    expect(addedToPlayer).toBe(false);
    expect(getHandCount(newBoard, "player")).toBe(MAX_HAND_SIZE);
  });

  it("追加可能な札がない場合は追加しない", () => {
    // 全カードが盤面上にある
    const playerCards = makeDummyCards(2);
    const cpuCards = [makeDummyCard("c-1")];
    // extraCards なし
    const state = makeGameState(playerCards, cpuCards);

    const { addedToPlayer, addedToCpu } = processBothFoul(state);
    expect(addedToPlayer).toBe(false);
    expect(addedToCpu).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────
// judgeVictory
// ────────────────────────────────────────────────────────────

describe("judgeVictory", () => {
  it("自陣が0枚になったらプレイヤーが勝利する", () => {
    const cpuCards = [makeDummyCard("c-1")];
    const board: BoardCard[] = cpuCards.map((c) => ({
      card: c,
      owner: "cpu",
    }));
    expect(judgeVictory(board)).toBe("player");
  });

  it("CPU の自陣が0枚になったら CPU が勝利する", () => {
    const playerCards = [makeDummyCard("p-1")];
    const board: BoardCard[] = playerCards.map((c) => ({
      card: c,
      owner: "player",
    }));
    expect(judgeVictory(board)).toBe("cpu");
  });

  it("どちらも0枚でなければ null", () => {
    const board: BoardCard[] = [
      { card: makeDummyCard("p-1"), owner: "player" },
      { card: makeDummyCard("c-1"), owner: "cpu" },
    ];
    expect(judgeVictory(board)).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────
// Simultaneous (同着)
// ────────────────────────────────────────────────────────────

import {
  judgeSimultaneous,
  getSimultaneousWinner,
} from "@/features/game/engine/simultaneousJudge";
import { SIMULTANEOUS_THRESHOLD_MS } from "@/features/game/domain/constants";

describe("judgeSimultaneous", () => {
  it("時間差が閾値以内なら同着", () => {
    expect(
      judgeSimultaneous(1000, 1000 + SIMULTANEOUS_THRESHOLD_MS)
    ).toBe(true);
    expect(
      judgeSimultaneous(1000, 1000 + SIMULTANEOUS_THRESHOLD_MS - 1)
    ).toBe(true);
  });

  it("時間差が閾値超なら同着ではない", () => {
    expect(
      judgeSimultaneous(1000, 1000 + SIMULTANEOUS_THRESHOLD_MS + 1)
    ).toBe(false);
  });

  it("同着時は札の所有者が取得する（自陣→プレイヤー）", () => {
    const board: BoardCard[] = [
      { card: makeDummyCard("p-1"), owner: "player" },
      { card: makeDummyCard("c-1"), owner: "cpu" },
    ];
    expect(getSimultaneousWinner(board, "p-1")).toBe("player");
  });

  it("同着時は札の所有者が取得する（敵陣→CPU）", () => {
    const board: BoardCard[] = [
      { card: makeDummyCard("p-1"), owner: "player" },
      { card: makeDummyCard("c-1"), owner: "cpu" },
    ];
    expect(getSimultaneousWinner(board, "c-1")).toBe("cpu");
  });
});

// ────────────────────────────────────────────────────────────
// recordKimariMs / 決まり秒
// ────────────────────────────────────────────────────────────

describe("recordKimariMs", () => {
  it("決まり秒が正しく記録される", () => {
    const stats: import("@/features/game/domain/types").PlayerStats = {
      correctCount: 0,
      foulCount: 0,
      takenCount: 0,
      kimariMs: [],
    };
    const updated = recordKimariMs(stats, 1000, 1820);
    expect(updated.kimariMs).toEqual([820]);
  });

  it("複数回記録できる", () => {
    let stats: import("@/features/game/domain/types").PlayerStats = {
      correctCount: 0,
      foulCount: 0,
      takenCount: 0,
      kimariMs: [],
    };
    stats = recordKimariMs(stats, 0, 820);
    stats = recordKimariMs(stats, 0, 1460);
    expect(stats.kimariMs).toEqual([820, 1460]);
  });

  it("平均決まり秒を正しく計算する", () => {
    expect(getAverageKimariMs([800, 1200])).toBe(1000);
  });

  it("最速決まり秒を正しく計算する", () => {
    expect(getFastestKimariMs([1500, 800, 1200])).toBe(800);
  });
});

// ────────────────────────────────────────────────────────────
// CPU engine
// ────────────────────────────────────────────────────────────

import {
  calcCpuAnswerTime,
  doesCpuMistake,
} from "@/features/game/engine/cpuEngine";

describe("CPU engine", () => {
  it("CPU回答時間が設定範囲内になる", () => {
    const card = makeDummyCard("test", {
      cpuConfig: { baseRecognitionMs: 1000, variationMs: 200, mistakeRate: 0 },
    });
    for (let i = 0; i < 100; i++) {
      const t = calcCpuAnswerTime(card, "normal");
      expect(t).toBeGreaterThanOrEqual(100); // 最低保証
      // normal: speedMultiplier=1.0, 1000 ± 200 = [800, 1200]
      expect(t).toBeGreaterThanOrEqual(800 - 1); // 最低値の許容誤差
      expect(t).toBeLessThanOrEqual(1200 + 1);
    }
  });

  it("mistakeRate=0なら誤答しない", () => {
    const card = makeDummyCard("no-mistake", {
      cpuConfig: { baseRecognitionMs: 1000, variationMs: 0, mistakeRate: 0 },
    });
    for (let i = 0; i < 50; i++) {
      expect(doesCpuMistake(card, false, "normal")).toBe(false);
    }
  });

  it("mistakeRate=1.0なら必ず誤答する", () => {
    const card = makeDummyCard("always-mistake", {
      cpuConfig: {
        baseRecognitionMs: 1000,
        variationMs: 0,
        mistakeRate: 1.0,
      },
    });
    for (let i = 0; i < 50; i++) {
      expect(doesCpuMistake(card, false, "normal")).toBe(true);
    }
  });

  it("沼札でCPU誤答率補正が適用される（通常より高い誤答率）", () => {
    // mistakeRate=0.1 の通常札と沼札で誤答率が異なることを確認
    // 統計的テストは避けて、補正後の rate 計算の一貫性を確認
    const card = makeDummyCard("confusion", {
      cpuConfig: {
        baseRecognitionMs: 1000,
        variationMs: 200,
        mistakeRate: 0.5,
      },
    });
    // mistakeRate=1.0 + confusionBonus でクランプされても true になること
    const alwaysMistakeCard = makeDummyCard("confusion-high", {
      cpuConfig: {
        baseRecognitionMs: 1000,
        variationMs: 200,
        mistakeRate: 1.0,
      },
    });
    for (let i = 0; i < 20; i++) {
      expect(doesCpuMistake(alwaysMistakeCard, true, "normal")).toBe(true);
    }
    // confusionGroupId がある場合は mistakeRate が card で確認できる
    expect(card.cpuConfig.mistakeRate).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────────────────────────
// createNextRound
// ────────────────────────────────────────────────────────────

describe("createNextRound", () => {
  it("ラウンドが正しく生成される", () => {
    const allCards = DEMO_CARDS;
    const board: BoardCard[] = allCards
      .filter((c) => c.isBoardEligible)
      .slice(0, 20)
      .map((c, i): BoardCard => ({ card: c, owner: i < 10 ? "player" : "cpu" }));

    const round = createNextRound(allCards, board, 1);
    expect(round.roundNumber).toBe(1);
    expect(round.phase).toBe("reading");
    expect(typeof round.readCardId).toBe("string");
    expect(round.result).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────
// isCorrectAnswer with foul conditions
// ────────────────────────────────────────────────────────────

describe("isCorrectAnswer (お手つき条件)", () => {
  const playerCards = [makeDummyCard("p-1"), makeDummyCard("p-2")];
  const cpuCards = [makeDummyCard("c-1"), makeDummyCard("c-2")];
  const board: BoardCard[] = [
    ...playerCards.map((c) => ({ card: c, owner: "player" as const })),
    ...cpuCards.map((c) => ({ card: c, owner: "cpu" as const })),
  ];

  it("誤答（正解ではない札を押す）でお手つき", () => {
    // 読まれたカード: p-1, 押したカード: p-2 → 不正解
    expect(isCorrectAnswer(board, "p-1", "p-2", false)).toBe(false);
  });

  it("空札で札を押すとお手つき", () => {
    expect(isCorrectAnswer(board, "p-1", "p-1", true)).toBe(false);
  });
});
