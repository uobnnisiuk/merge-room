# CLAUDE.md - merge-room

## Overview

merge-room is a pre-PR workspace for handling GitHub PR discussions in a single screen. It maintains stable anchors (diff references) so discussion context survives diff refreshes.

**Scope:** This is a spike/prototype. Single-user, local-only, no auth.

## Quick Start

```bash
cd web
pnpm install
pnpm demo:seed      # Creates docs/demo-repo with staged/unstaged changes
pnpm dev            # Frontend: localhost:5173, Backend: localhost:3001
```

## Project Structure

```
web/
├── src/                 # React frontend (Vite + TypeScript)
│   ├── components/      # UI components (DiffViewer, ThreadPanel, etc.)
│   ├── pages/           # Route pages (TaskList, TaskWorkspace)
│   ├── store/           # Zustand state management
│   └── api/             # API client + types
├── server/              # Express backend
│   ├── db/              # SQLite operations (better-sqlite3)
│   ├── migrations/      # SQL schema migrations
│   ├── routes/          # API endpoints
│   └── services/        # Git, export logic
├── scripts/             # E2E tests, demo seeding
└── data/                # SQLite database (gitignored)
```

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Zustand, React Router
- **Backend:** Express, TypeScript (tsx)
- **Database:** SQLite (better-sqlite3, native module)
- **Package Manager:** pnpm

## Key Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start dev server (client + server) |
| `pnpm build` | Production build |
| `pnpm test:e2e` | Run E2E smoke tests |
| `pnpm demo:seed` | Create demo repository |
| `pnpm sqlite:rebuild` | Rebuild native SQLite module |
| `pnpm typecheck` | TypeScript type checking |

## Database

Migrations run automatically on server start. Schema in `server/migrations/`.

**Tables:** tasks, diffs, threads, comments, anchors, decisions

**Status workflow:** `draft` → `review` → `approved` → `archived`

## Anchor System

Anchors reference **parsed diff positions**, not source file lines:
- `filePath`, `hunkIndex`, `startLine`, `endLine`, `excerpt`
- Anchors become **stale** when diff refreshes and excerpt no longer matches
- Client-side `isAnchorStale()` computes staleness by comparing excerpts

## API Endpoints

- `GET/POST /api/tasks` - List/create tasks
- `GET /api/tasks/:id` - Task detail with threads/decision
- `POST /api/tasks/:id/refresh-diff` - Refresh diff from git
- `POST /api/tasks/:id/threads` - Create thread
- `POST /api/tasks/threads/:id/comments` - Add comment (with optional anchor)
- `PUT /api/tasks/:id/decision` - Update decision fields
- `POST /api/tasks/:id/export` - Generate PR draft markdown

## Testing

E2E tests in `scripts/e2e-smoke.js`:
```bash
pnpm test:e2e
```

Tests cover: Task creation → Diff refresh → Anchored comment → Decision → Export

## Development Notes

### Adding a new API endpoint
1. Add route in `server/routes/tasks.ts`
2. Add DB function in `server/db/`
3. Update types in `src/api/types.ts`
4. Add store action in `src/store/taskStore.ts`

### Modifying schema
1. Create new migration file: `server/migrations/00N_description.sql`
2. Restart server (migrations auto-apply)

### Troubleshooting

**SQLite native module errors:**
```bash
pnpm sqlite:rebuild
```

**Database reset:**
```bash
rm -rf web/data && pnpm dev
```

## Conventions

- TypeScript strict mode
- No CSS framework (plain CSS per component)
- Zustand for state (single store)
- Express error handling with try/catch
- Boolean fields in SQLite: 0/1, convert with `Boolean()`

## Documentation

- `docs/architecture.md` - Data model, API reference
- `docs/runbook.md` - Quick start, troubleshooting
- `docs/notes.md` - Design decisions, future work
- `docs/ja/` - Japanese translations

## Rules

1. **Always run typecheck after editing .ts/.tsx files**
2. **Run E2E tests before committing significant changes**
3. **Never commit web/data/ (database) - it's gitignored**
4. **Use existing patterns** - follow code style in nearby files
5. **Keep spike scope** - no auth, no multi-user, no real-time
6. **Anchors are diff-relative** - not source file line numbers
7. **Boolean in SQLite** - store as 0/1, convert with `Boolean()`
8. **Japanese docs** - update docs/ja/ when updating docs/

## Slash Commands

| Command | Description |
|---------|-------------|
| `/dev` | Start development server |
| `/test` | Run E2E smoke tests |
| `/check` | Run typecheck + build + e2e |
| `/reset-db` | Reset database to clean state |
| `/add-endpoint` | Interactive API endpoint creation |

## Agent Skills

| Skill | Use When |
|-------|----------|
| `e2e-test` | Running or debugging E2E tests |
| `anchor-system` | Working with anchors/staleness |
| `database` | Database schema or queries |

