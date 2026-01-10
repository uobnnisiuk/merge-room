# merge-room Runbook

Quick start guide for evaluating the spike.

## Minimum Demo (5 minutes)

### 1. Setup

```bash
cd merge-room/web
pnpm install
pnpm demo:seed    # creates docs/demo-repo with staged/unstaged/untracked changes
pnpm dev          # starts frontend :5173 + backend :3001
```

Open http://localhost:5173

### 2. Create Task

1. Click **"New Task"**
2. Fill in:
   - Title: `Demo task`
   - Repo Path: `/full/path/to/merge-room/docs/demo-repo`
3. Click **Create**

### 3. Refresh Diff

1. Click **"Refresh Diff"** button
2. Verify 3 sections appear: Staged, Unstaged, Untracked

### 4. Quote Code

1. In the diff viewer, click on a line with `+` prefix
2. Drag to select 2-3 lines
3. Click **"Quote in Thread"**
4. Add a comment, submit

### 5. Fill Decision

1. In the Decision panel (right side), fill all 4 fields:
   - Summary, Rationale, Risks, Rollback
2. Click **Save**

### 6. Approve & Export

1. Change status to **Review**, then **Approved**
2. Click **"Export PR Draft"**
3. Verify markdown appears with decision + threads

---

## Troubleshooting Top 3

### 1. `Could not locate the bindings file` (SQLite)

The native module needs compilation for your platform:

```bash
cd web
pnpm sqlite:rebuild
```

Requires C++ build tools:
- Linux: `sudo apt install build-essential`
- macOS: `xcode-select --install`
- Windows: Visual Studio Build Tools ("Desktop development with C++")

### 2. `Invalid git repository: <path>`

The `repoPath` must be an **absolute path** to a directory containing `.git/`:

```bash
# Wrong
docs/demo-repo

# Correct
/home/user/merge-room/docs/demo-repo
```

Run `pnpm demo:seed` first to create the demo repository.

### 3. Export file not created

PR drafts are saved to `docs/pr-drafts/`. If this directory doesn't exist or isn't writable, the export still returns markdown in the response (copy from clipboard works), but the file write may fail silently.

Check:
```bash
ls -la docs/pr-drafts/
```

---

## Success Criteria (5 checks)

Run these to validate the spike works:

| # | Check | How to verify |
|---|-------|---------------|
| 1 | **Diff displays** | Refresh diff shows Staged/Unstaged/Untracked sections |
| 2 | **Line quoting works** | Select lines → "Quote in Thread" creates anchored comment |
| 3 | **Decision required** | Try to Approve without filling Decision → should fail with error |
| 4 | **Export includes decision** | Export markdown contains Summary, Rationale, Risks, Rollback |
| 5 | **Private notes excluded** | Add comment with "Private" checked → should NOT appear in export |

### Automated Verification

```bash
cd web
pnpm test:e2e
```

Expected output includes:
```
[e2e] Negative approval test passed - correctly rejected
...
=== All E2E Tests Passed ===
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start dev server (frontend + backend) |
| `pnpm demo:seed` | Create demo git repo with changes |
| `pnpm test:e2e` | Run automated smoke test |
| `pnpm typecheck` | Verify TypeScript |
| `pnpm build` | Production build |
| `pnpm sqlite:rebuild` | Recompile native SQLite module |

---

日本語版: [runbook.ja.md](ja/runbook.ja.md)
