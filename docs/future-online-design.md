# 信者カルタ — オンライン対戦 将来設計

## 概要

MVP のローカル CPU 戦の後、以下のオンライン機能を追加する想定で設計方針を記載します。
**現在これらの機能は実装しません。**

---

## Supabase 構成

### Auth

- メール / ソーシャル認証（Google, Twitter/X）
- `users` テーブルと紐付け

### Postgres（スキーマ案）

```sql
users         -- プロフィール、レート
decks         -- カルタデッキ（配信者ごと）
cards         -- デッキに属するカード
matches       -- 試合履歴
match_rounds  -- ラウンド単位の記録
```

### Realtime Broadcast

- ゲームの進行イベント（ラウンド開始・回答・結果）を双方向送信
- チャンネル例：`game:{matchId}`

### Presence

- ルーム内のプレイヤーの接続状態（接続中 / 切断）を監視

### Storage

- カード音声ファイル（`.mp3` / `.aac`）
- カード画像ファイル

---

## アーキテクチャ変更点

### ゲームエンジンの再利用

MVP のゲームエンジン（純粋関数）はそのままサーバーサイドで利用可能。
Supabase Edge Functions または Next.js Route Handlers でエンジンを呼び出す。

### サーバー基準の回答判定

```
Client A → Broadcast "answer" → Supabase Channel
Client B → Broadcast "answer" → Supabase Channel
Server   → 受信時刻でどちらが先か判定
         → 結果を Broadcast
```

- クライアント時刻はズレるためサーバー受信時刻を基準にする
- `SIMULTANEOUS_THRESHOLD_MS` はサーバー側で評価

### データフローの変更

```
現在 (MVP):
  KarutaCard[] ← features/game/data/ (仮データ)

将来 (Online):
  KarutaCard[] ← lib/repositories/cardRepository.ts
                  ← Supabase Postgres
```

`cardRepository.ts` を差し替えるだけでデータソースが変わる設計にする。

---

## マッチング

- ランダムマッチ：待機キューに入り、相手が見つかれば `matches` レコード作成
- リマッチ：結果画面から同じ相手と再戦
- 友人対戦：ルームコードを共有して入室（将来検討）

---

## レート戦

- ELO レーティング相当のレート計算
- `users.rate` を試合ごとに更新
- ランク（例：見習い信者 → 古参信者 → 推し活神）

---

## 対戦履歴

- `matches` テーブルに勝敗・決まり秒・お手つき数を保存
- プロフィール画面で過去戦績を閲覧

---

## 現在の設計が将来に対応している理由

| 現在の設計               | 将来対応できる理由                             |
| ------------------------ | ---------------------------------------------- |
| 純粋関数エンジン         | サーバー側で再利用可能                         |
| `deckId` でカード分離   | マルチテナント・デッキ課金に対応               |
| `audioUrl?` の抽象化    | Supabase Storage URL に差し替えるだけ          |
| Repository 境界          | データソースを DB に切り替えるだけ             |
| Context ベースの状態管理 | Realtime イベントを Context に注入できる       |
| `SIMULTANEOUS_THRESHOLD_MS` 定数 | サーバー側でも同じ値を参照できる    |
