@AGENTS.md

# 信者カルタ — プロジェクト概要

1対1のデジタルかるたゲーム（プレイヤー vs CPU）。

## 技術スタック

- **Next.js 16** (App Router) + TypeScript strict
- **Tailwind CSS v4** (`@tailwindcss/postcss`)
- **Vitest 4** + jsdom + React Testing Library（34テスト、全パス）
- パス alias: `@/` → プロジェクトルート

## ディレクトリ構成

```
app/
  layout.tsx          # ルートレイアウト（GameProvider をここに配置）
  page.tsx            # 起動時に自動でゲーム開始
  game/
    layout.tsx
    memorize/page.tsx # 暗記フェーズ（20秒カウントダウン）
    play/page.tsx     # プレイフェーズ（札を押す）
    result/page.tsx   # 結果画面
features/game/
  domain/
    types.ts          # 全ドメイン型
    constants.ts      # 定数・CPU難易度設定
  engine/
    boardEngine.ts    # 純粋関数のゲームエンジン
    cpuEngine.ts      # CPU行動決定ロジック
    simultaneousJudge.ts
    utils.ts
  data/
    demoCards.ts      # デモ用25枚（リポジトリ境界）
  context/
    GameContext.tsx   # ゲーム状態管理（React Context）
  tests/
    boardEngine.test.ts
docs/                 # 設計ドキュメント（日本語）
```

## アーキテクチャのポイント

- `GameProvider` は `app/layout.tsx` のルートに1つだけ置く（複数インスタンスNG）
- ナビゲーションは `gameState.phase` の変化を監視する `useEffect` で行う（コールバック内で `router.push` しない）
- ゲームエンジンは副作用なしの純粋関数のみ
- `gsRef` で最新状態をクロージャから参照（タイマー内で使用）
- `beginNextRoundRef` で循環依存を回避（forward reference パターン）

## 現在の実装状況

- [x] ゲームエンジン全機能（正解/誤答/同着/空札/送り）
- [x] CPU対戦（Easy難易度：反応約2〜3秒、お手つき率高め）
- [x] 暗記フェーズ → プレイフェーズ → 結果画面の遷移
- [x] 結果画面（正解数・お手つき・平均決まり秒・最速決まり秒）
- [ ] 音声読み上げ
- [ ] オンライン対戦

## 開発ルール

- **pushは明示的に「pushして」と指示されたときだけ行う**
- コミットは作業区切りごとに行う
- コメントは原則書かない（WHYが非自明な場合のみ）
- 新機能・リファクタは指示されたもの以外追加しない

## GitHub

- リポジトリ: `alingen/shinja_karuta`
- 開発ブランチ: `claude/exciting-feynman-7zzcw5`
- mainブランチへ直接pushしている（PRなし運用）
- pushには Classic PAT（`ghp_...`）が必要（CCR環境の場合）
