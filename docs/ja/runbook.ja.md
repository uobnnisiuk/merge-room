# merge-room 運用手順書

> **英語版（正）**: [runbook.md](../runbook.md)

spikeを評価するためのクイックスタートガイド。

## 最短デモ（5分）

### 1. セットアップ

```bash
cd merge-room/web
pnpm install
pnpm demo:seed    # docs/demo-repo にstaged/unstaged/untrackedの変更を含むリポジトリを作成
pnpm dev          # frontend :5173 + backend :3001 を起動
```

http://localhost:5173 を開く

### 2. タスク（Task）作成

1. **"New Task"** をクリック
2. 入力:
   - Title: `Demo task`
   - Repo Path: `/full/path/to/merge-room/docs/demo-repo`
3. **Create** をクリック

### 3. 差分を更新

1. **"Refresh Diff"** ボタンをクリック
2. 3つのセクションが表示されることを確認: Staged, Unstaged, Untracked

### 4. コードを引用

1. 差分ビューアで `+` プレフィックスのある行をクリック
2. ドラッグして2〜3行を選択
3. **"Quote in Thread"** をクリック
4. コメント（Comment）を追加して送信

### 5. 決定（Decision）を記入

1. 決定パネル（右側）で4項目すべてを記入:
   - Summary, Rationale, Risks, Rollback
2. **Save** をクリック

### 6. 承認（Approved）& エクスポート（Export）

1. ステータスを **Review** に変更、次に **Approved** に変更
2. **"Export PR Draft"** をクリック
3. 決定＋スレッド（Thread）を含むMarkdownが表示されることを確認

---

## トラブルシューティング Top 3

### 1. `Could not locate the bindings file` (SQLite)

ネイティブモジュールをプラットフォーム向けにコンパイルする必要がある：

```bash
cd web
pnpm sqlite:rebuild
```

C++ビルドツールが必要：
- Linux: `sudo apt install build-essential`
- macOS: `xcode-select --install`
- Windows: Visual Studio Build Tools（"Desktop development with C++"）

### 2. `Invalid git repository: <path>`

`repoPath` は `.git/` を含むディレクトリへの**絶対パス**である必要がある：

```bash
# 間違い
docs/demo-repo

# 正しい
/home/user/merge-room/docs/demo-repo
```

先に `pnpm demo:seed` を実行してデモリポジトリを作成すること。

### 3. エクスポートファイルが作成されない

PRドラフトは `docs/pr-drafts/` に保存される。このディレクトリが存在しないか書き込み不可の場合、エクスポートはレスポンスでMarkdownを返す（クリップボードからのコピーは機能する）が、ファイル書き込みはサイレントに失敗する可能性がある。

確認：
```bash
ls -la docs/pr-drafts/
```

---

## 成功判定（5項目）

spikeが機能することを検証するチェック：

| # | チェック項目 | 確認方法 |
|---|-------------|----------|
| 1 | **差分が表示される** | 差分更新でStaged/Unstaged/Untrackedセクションが表示される |
| 2 | **行引用が機能する** | 行を選択 → "Quote in Thread" でアンカー（Anchor）付きコメントが作成される |
| 3 | **決定が必須** | 決定を記入せずにApprovedにしようとする → エラーで失敗すべき |
| 4 | **エクスポートに決定が含まれる** | エクスポートMarkdownにSummary, Rationale, Risks, Rollbackが含まれる |
| 5 | **プライベートノートが除外される** | "Private"チェック付きでコメント追加 → エクスポートに含まれないべき |

### 自動検証

```bash
cd web
pnpm test:e2e
```

期待される出力：
```
[e2e] Negative approval test passed - correctly rejected
...
=== All E2E Tests Passed ===
```

---

## クイックリファレンス

| コマンド | 用途 |
|----------|------|
| `pnpm install` | 依存関係をインストール |
| `pnpm dev` | 開発サーバーを起動（frontend + backend） |
| `pnpm demo:seed` | 変更を含むデモgitリポジトリを作成 |
| `pnpm test:e2e` | 自動スモークテストを実行 |
| `pnpm typecheck` | TypeScriptを検証 |
| `pnpm build` | プロダクションビルド |
| `pnpm sqlite:rebuild` | ネイティブSQLiteモジュールを再コンパイル |
