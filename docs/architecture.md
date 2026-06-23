# 信者カルタ — アーキテクチャ

## ディレクトリ構成

```
app/                    # Next.js App Router（ページ）
  page.tsx              # トップページ
  game/
    prepare/page.tsx    # CPU対戦準備画面
    memorize/page.tsx   # 暗記画面
    play/page.tsx       # 対戦画面
    result/page.tsx     # 結果画面

components/             # 汎用 UI コンポーネント

features/game/
  domain/               # ドメイン型・定数
  engine/               # 純粋関数ゲームエンジン
  hooks/                # React ゲーム状態 hooks
  components/           # ゲーム専用 UI コンポーネント
  data/                 # 仮カードデータ
  tests/                # 単体テスト

lib/                    # 汎用ユーティリティ
types/                  # グローバル型定義
docs/                   # ドキュメント
```

## ゲームエンジン (`features/game/engine/`)

- **副作用なし**の純粋関数のみ
- 入力：現在の `GameState` + アクション
- 出力：新しい `GameState`
- UI・React・タイマーに依存しない
- 将来のオンライン対戦でもサーバーサイドで再利用可能

主要関数：

| 関数                      | 責務                         |
| ------------------------- | ---------------------------- |
| `createInitialGameState`  | 初期盤面生成                 |
| `judgeAnswer`             | 正誤判定                     |
| `processCorrectAnswer`    | 正解時の盤面更新             |
| `processFoul`             | お手つき処理                 |
| `processBothFoul`         | 両者お手つき処理             |
| `transferCard`            | 送り札移動                   |
| `judgeVictory`            | 勝敗判定                     |
| `createNextRound`         | 次ラウンド生成               |
| `recordKimariSeconds`     | 決まり秒記録                 |

## UI (`features/game/components/` + `app/game/`)

- ゲームロジックを**直接書かない**
- `useGameEngine` hook 経由でエンジンを操作
- Server Components は静的な画面（トップ・準備画面など）に使用
- 対戦画面はインタラクティブなため Client Component

## データ (`features/game/data/`)

- `KarutaCard[]` 型の仮データ（約 25 枚）
- 将来 Supabase から取得する場合はここをリポジトリ関数に差し替え
- `getDeck(deckId: string): Promise<KarutaCard[]>` の形を目指す

## 音声 (`lib/audio/`)

- `playAudio(card: KarutaCard): Promise<void>` を抽象化
- `audioUrl` があれば `<audio>` 要素で再生
- なければ `SpeechSynthesis` で `displayText` を読み上げ
- 音声が使えなくてもゲームが止まらない設計

## CPU ロジック (`features/game/engine/cpu.ts`)

- `CpuCardConfig` に基づく確率的回答
- 回答時間 = `baseRecognitionMs ± variationMs`
- `mistakeRate` で誤答を決定
- 沼札補正・空札補正あり
- 難易度設定は定数オブジェクト（Easy / Normal / Hard）で分離済み

## テスト

- Vitest + React Testing Library
- ゲームエンジンの純粋関数：単体テスト中心
- UI：主要操作のみ（レンダリング + ユーザー操作）

## 状態管理

- React `useState` / `useReducer` + Context
- `GameContext` でゲーム状態をツリーに共有
- エンジン関数はすべて純粋なので Zustand / Redux への移行が容易
