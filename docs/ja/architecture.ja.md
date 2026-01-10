# merge-room アーキテクチャ

> **英語版（正）**: [architecture.md](../architecture.md)

## 概要

merge-room はローカル専用・シングルユーザーのPre-PRワークスペース。差分レビュー、スレッド（Thread）議論、構造化された決定（Decision）を1画面にまとめ、コードがプルリクエストに到達する前に処理する。

**コア哲学**: PRは出口（最終確定点）であり、議論の場ではない。

```
┌─────────────────────────────────────────────────────────────┐
│                     merge-room                              │
│  高速イテレーション（私的）→ 同期議論 → PR（出口）          │
└─────────────────────────────────────────────────────────────┘
```

## UI構造（1画面）

```
┌───────────────────────────────────────────────────────────────┐
│ タスクヘッダー: タイトル、ステータスバッジ、リポジトリパス      │
├─────────────────────────────┬─────────────────────────────────┤
│                             │  [Threads] [Private] タブ       │
│  差分ビューア               │  ─────────────────────────       │
│  ├─ Staged Changes          │  スレッド一覧 / AIノート        │
│  ├─ Unstaged Changes        │                                 │
│  └─ Untracked Files         │  ─────────────────────────       │
│                             │  決定パネル                      │
│  （行を選択して引用）        │  • Summary    • Rationale       │
│                             │  • Risks      • Rollback        │
│                             │  ─────────────────────────       │
│                             │  [Export PR Draft]              │
└─────────────────────────────┴─────────────────────────────────┘
```

## データモデル

### テーブル

| テーブル | 用途 |
|----------|------|
| `tasks` | ルートエンティティ。ローカルgitリポジトリにリンク、ステータスワークフローを追跡 |
| `diffs` | 更新時点のgit diffスナップショット（staged + unstaged + untracked） |
| `threads` | コメント（Comment）チェーンのコンテナ |
| `comments` | 個別メッセージ。`isPrivate=1` はエクスポートから除外 |
| `anchors` | コメントを特定の差分行にリンク |
| `decisions` | 承認前に必須の構造化フィールド |

### アンカー（Anchor：差分引用）定義

アンカーはソースファイルの行番号ではなく、**パースされた差分構造内**の行を参照する：

```
anchor = {
  filePath:   "src/utils.js"     // diffヘッダーから
  hunkIndex:  0                   // ファイル内hunkの0ベースインデックス
  startLine:  1                   // hunkのlines配列内の0ベースインデックス
  endLine:    3                   // inclusive
  excerpt:    "+function foo..."  // +/-プレフィックス付きの選択テキスト
}
```

**注意**: ワーキングツリーが変更されて差分を更新すると、アンカーが古くなる可能性がある。

### ステータスワークフロー

```
draft → review → approved → archived
（下書き）（レビュー）（承認済み）（アーカイブ）
                    ↑
            決定の4項目すべてが必須
```

## APIエンドポイント

| Method | Path | 用途 |
|--------|------|------|
| GET | `/api/tasks` | 全タスク一覧 |
| POST | `/api/tasks` | タスク作成（title, repoPath必須） |
| GET | `/api/tasks/:id` | タスク詳細（threads, comments, decision含む） |
| POST | `/api/tasks/:id/refresh-diff` | 最新のgit diffを取得 |
| GET | `/api/tasks/:id/diff` | 保存済み差分を取得 |
| PATCH | `/api/tasks/:id/status` | ステータス更新（approvedは決定を検証） |
| PUT | `/api/tasks/:id/decision` | 決定フィールドを更新 |
| POST | `/api/tasks/:id/threads` | 新規スレッド作成 |
| POST | `/api/tasks/threads/:id/comments` | コメント追加（アンカー任意） |
| POST | `/api/tasks/:id/export` | PRドラフトMarkdownを生成 |

## 技術スタック

- **Frontend**: Vite + React + TypeScript + Zustand
- **Backend**: Express + better-sqlite3
- **外部サービスなし**: ローカルgitのみ、GitHub API/認証なし

## 既知のリスク

| リスク | 軽減策 |
|--------|--------|
| アンカーの陳腐化 | 制限事項として文書化。将来的に無効化警告を検討 |
| 差分更新で上書き | タスクごとに最新の差分のみ保存 |
| ネイティブSQLiteビルド | `pnpm sqlite:rebuild` スクリプトを提供 |
| シングルユーザーのみ | spikeの設計として意図的。バグではない |

## ファイル構成

```
merge-room/
├── web/
│   ├── src/              # React frontend
│   ├── server/           # Express backend
│   │   ├── db/           # SQLite access
│   │   ├── routes/       # API handlers
│   │   └── services/     # git, export logic
│   └── scripts/          # demo:seed, e2e
├── docs/
│   ├── architecture.md   # (英語版)
│   ├── decision.md       # 投資判断基準
│   ├── runbook.md        # クイックスタート
│   ├── notes.md          # 将来検討事項
│   └── ja/               # 日本語ドキュメント
└── .github/workflows/    # CI
```
