# merge-room Architecture

## Overview

merge-room is a local-only, single-user pre-PR workspace. It bundles diff review, threaded discussions, and structured decisions into one screen before code reaches a pull request.

**Core philosophy**: PRs are the finalization step, not the discussion space.

```
┌─────────────────────────────────────────────────────────────┐
│                     merge-room                              │
│  Fast iteration (private) → Sync discussion → PR (exit)    │
└─────────────────────────────────────────────────────────────┘
```

## UI Structure (Single Screen)

```
┌───────────────────────────────────────────────────────────────┐
│ Task Header: Title, Status Badge, Repo Path                   │
├─────────────────────────────┬─────────────────────────────────┤
│                             │  [Threads] [Private] tabs       │
│  Diff Viewer                │  ─────────────────────────       │
│  ├─ Staged Changes          │  Thread list / AI notes         │
│  ├─ Unstaged Changes        │                                 │
│  └─ Untracked Files         │  ─────────────────────────       │
│                             │  Decision Panel                 │
│  (select lines to quote)    │  • Summary    • Rationale       │
│                             │  • Risks      • Rollback        │
│                             │  ─────────────────────────       │
│                             │  [Export PR Draft]              │
└─────────────────────────────┴─────────────────────────────────┘
```

## Data Model

### Tables

| Table | Purpose |
|-------|---------|
| `tasks` | Root entity; links to local git repo, tracks status workflow |
| `diffs` | Snapshot of git diff at refresh time (staged + unstaged + untracked) |
| `threads` | Container for comment chains |
| `comments` | Individual messages; `isPrivate=1` excludes from export |
| `anchors` | Links a comment to specific diff lines |
| `decisions` | Structured fields required before approval |

### Anchor Definition

Anchors reference lines **within the parsed diff structure**, not source file line numbers:

```
anchor = {
  filePath:   "src/utils.js"     // from diff header
  hunkIndex:  0                   // 0-based index of hunk in file
  startLine:  1                   // 0-based index in hunk's lines array
  endLine:    3                   // inclusive
  excerpt:    "+function foo..."  // selected text with +/- prefixes
}
```

**Note**: Anchors may become stale if the working tree changes and diff is refreshed.

### Status Workflow

```
draft → review → approved → archived
                    ↑
            requires all 4 decision fields
```

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create task (title, repoPath required) |
| GET | `/api/tasks/:id` | Get task with threads, comments, decision |
| POST | `/api/tasks/:id/refresh-diff` | Fetch latest git diff |
| GET | `/api/tasks/:id/diff` | Get stored diff |
| PATCH | `/api/tasks/:id/status` | Update status (validates decision for approved) |
| PUT | `/api/tasks/:id/decision` | Update decision fields |
| POST | `/api/tasks/:id/threads` | Create new thread |
| POST | `/api/tasks/threads/:id/comments` | Add comment with optional anchor |
| POST | `/api/tasks/:id/export` | Generate PR draft markdown |

## Tech Stack

- **Frontend**: Vite + React + TypeScript + Zustand
- **Backend**: Express + better-sqlite3
- **No external services**: Local git only, no GitHub API, no auth

## Known Risks

| Risk | Mitigation |
|------|------------|
| Anchor staleness | Document limitation; consider invalidation warning in future |
| Diff refresh overwrites | Only stores latest diff per task |
| Native SQLite build | Provide `pnpm sqlite:rebuild` script |
| Single-user only | By design for spike; not a bug |

## File Layout

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
│   ├── architecture.md   # (this file)
│   ├── decision.md       # investment criteria
│   ├── runbook.md        # quick start guide
│   └── notes.md          # future considerations
└── .github/workflows/    # CI
```
