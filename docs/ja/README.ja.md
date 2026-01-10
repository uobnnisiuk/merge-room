# merge-room 日本語ドキュメント

> **英語版（正）**: [README.md](../../README.md)

merge-room は、コード変更がプルリクエストになる前に議論・レビュー・決定を行うワークスペースです。

## コンセプト

- **高速イテレーション**はプライベートに（AIと共に）
- **議論**は同期的に
- **PRは出口（最終確定点）**であり、議論の場ではない

## ドキュメント一覧

| ドキュメント | 内容 |
|-------------|------|
| [runbook.ja.md](./runbook.ja.md) | クイックスタート・トラブルシューティング・成功判定 |
| [architecture.ja.md](./architecture.ja.md) | UI構造・データモデル・API一覧 |
| [decision.ja.md](./decision.ja.md) | 検証仮説・実装済み機能・投資判断 |

## クイックスタート

```bash
# 前提: Node.js 20+, pnpm, C++ビルドツール

cd web
pnpm install
pnpm demo:seed   # デモ用gitリポジトリを作成
pnpm dev         # 開発サーバー起動
```

http://localhost:5173 を開く

詳細な手順は [runbook.ja.md](./runbook.ja.md) を参照。

## 主要機能

- **タスク（Task）管理**: ローカルgitリポジトリに紐付けたタスクを作成
- **差分ビューア**: staged/unstaged/untracked の変更を表示
- **アンカー（Anchor：差分引用）**: 差分の行範囲を選択してコメント（Comment）に引用
- **スレッド（Thread）**: コード選択部分にスレッドを作成、返信
- **プライベートノート**: エクスポート（Export）に含まれないAIメモ用タブ
- **決定（Decision）**: 承認（Approved）前に必須の4項目（Summary/Rationale/Risks/Rollback）
- **PRドラフトエクスポート**: 決定＋スレッドをMarkdownで出力

## ステータスワークフロー

```
下書き（Draft）→ レビュー（Review）→ 承認済み（Approved）→ アーカイブ（Archived）
                                ↑
                        決定（Decision）の4項目が必須
```

## 技術スタック

- **Frontend**: Vite + React + TypeScript + Zustand
- **Backend**: Express + better-sqlite3
- **外部連携なし**: ローカルgitのみ、GitHub API/認証なし

## 関連リンク

- [英語版 README](../../README.md)
- [実装ノート](../notes.md)（英語）
