# 信者カルタ

配信者の名場面や発言を題材にした 1 対 1 のデジタル競技カルタゲームです。

## 技術構成

- **Next.js 16** (App Router)
- **TypeScript 5**
- **Tailwind CSS 4**
- **ESLint 9**
- **Vitest 4** + React Testing Library

## 開発環境のセットアップ

```bash
npm install
npm run dev
```

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm test` | テスト実行 |
| `npm run type-check` | 型チェック |
| `npm run lint` | ESLint 実行 |

## ドキュメント

- [プロダクト概要](docs/product-overview.md)
- [ゲームルール](docs/game-rules.md)
- [MVP スコープ](docs/mvp-scope.md)
- [アーキテクチャ](docs/architecture.md)
- [オンライン対戦 将来設計](docs/future-online-design.md)

## ディレクトリ構成

```
app/                    # Next.js App Router
features/game/
  domain/               # 型定義・定数
  engine/               # 純粋関数ゲームエンジン
  data/                 # 仮カードデータ
  tests/                # 単体テスト
docs/                   # 設計ドキュメント
```
