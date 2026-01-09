# merge-room

A workspace where code changes are discussed, reviewed, and *decided* before becoming a pull request.

This project explores a workflow where:
- Fast iteration happens privately (with AI)
- Discussion happens synchronously
- Pull requests are used as a finalization step, not a discussion space

## Quick Start

```bash
# Prerequisites: Node.js 20+, pnpm, C++ build tools (for native SQLite module)

cd web
pnpm install
pnpm dev
```

Open http://localhost:5173 in your browser.

- Frontend: http://localhost:5173 (Vite)
- Backend: http://localhost:3001 (Express)

### Troubleshooting: Native SQLite Module

If you get "Could not locate the bindings file" error after `pnpm install`, the native module needs to be compiled for your platform:

```bash
cd web
pnpm sqlite:rebuild
```

This runs `npm run build-release` inside `node_modules/better-sqlite3` and requires C++ build tools:
- **Linux**: `sudo apt install build-essential` (or equivalent)
- **macOS**: `xcode-select --install`
- **Windows**: Visual Studio Build Tools with "Desktop development with C++"

### Demo Repository

To quickly test the application with sample data:

```bash
cd web
pnpm demo:seed   # Creates docs/demo-repo with staged/unstaged/untracked changes
```

Then create a Task using the path shown in the output (e.g., `/path/to/merge-room/docs/demo-repo`).

### Running E2E Tests

Verify the core workflow programmatically:

```bash
cd web
pnpm test:e2e
```

This creates a demo repo, starts the server, and tests: Task → Diff → Comment with Anchor → Decision → Export.

## Features

### Task Management
- Create tasks linked to local git repositories
- Track task status: Draft → Review → Approved → Archived

### Diff Viewer
- View working tree changes (`git diff`)
- Select line ranges to quote in comments
- Collapsible file sections
- Shows staged, unstaged, and untracked files

### Discussion Threads
- Create comment threads on code selections
- Quote specific lines with file/line references
- Reply to existing threads

### Private AI Notes
- Separate tab for notes not included in exports
- Useful for AI conversation history, scratch notes
- Stored in DB but excluded from PR draft

### Decision Tracking
- Required fields before approval: Summary, Rationale, Risks, Rollback
- Status workflow enforcement

### Export PR Draft
- Generate markdown suitable for PR description
- Includes: overview, decision, code discussions
- Copies to clipboard + saves to `docs/pr-drafts/`

## Project Structure

```
merge-room/
├── web/                    # Main application
│   ├── src/               # React frontend
│   │   ├── api/          # API client
│   │   ├── components/   # UI components
│   │   ├── pages/        # Route pages
│   │   ├── store/        # Zustand state
│   │   ├── styles/       # Global CSS
│   │   └── utils/        # Utilities (diff parser)
│   ├── server/           # Express backend
│   │   ├── db/           # SQLite database layer
│   │   ├── migrations/   # SQL migrations
│   │   ├── routes/       # API routes
│   │   └── services/     # Business logic (git, export)
│   └── data/             # SQLite database (gitignored)
├── docs/
│   ├── notes.md          # Implementation notes
│   └── pr-drafts/        # Exported PR drafts
└── ide/                   # Reserved for IDE integration
```

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **State**: Zustand
- **Routing**: React Router
- **Backend**: Express
- **Database**: SQLite (better-sqlite3)
- **Styling**: Custom CSS (no framework)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks | List all tasks |
| POST | /api/tasks | Create task |
| GET | /api/tasks/:id | Get task detail |
| POST | /api/tasks/:id/refresh-diff | Refresh diff from git |
| GET | /api/tasks/:id/diff | Get latest diff |
| POST | /api/tasks/:id/threads | Create thread |
| POST | /api/tasks/threads/:id/comments | Add comment |
| PATCH | /api/tasks/:id/status | Update status |
| PUT | /api/tasks/:id/decision | Update decision |
| POST | /api/tasks/:id/export | Export PR draft |

## Spike Scope (What This Is NOT)

This is a spike/proof-of-concept. The following are intentionally not implemented:

- **Authentication** - Single user, local only
- **Multi-user** - No concurrent editing, no user accounts
- **Real-time sync** - Polling-based, no WebSocket
- **GitHub integration** - No API connection, no PR creation
- **Slack integration** - No notifications
- **CI/CD** - No automated workflows
- **Syntax highlighting** - Plain monospace diff display
- **Image/binary diffs** - Text only

See `docs/notes.md` for architecture notes and `docs/decision.md` for investment decision criteria.

## Database

SQLite database stored at `web/data/merge-room.db`. Migrations run automatically on server start.

Tables:
- `tasks` - Task metadata
- `diffs` - Git diff snapshots
- `threads` - Discussion threads
- `comments` - Thread comments
- `anchors` - Code line references
- `decisions` - Decision documents

### Anchor Line Numbers

When selecting code in the diff viewer, anchors store **display-relative** indices:

| Field | Description |
|-------|-------------|
| `filePath` | The file path from the diff header |
| `hunkIndex` | Index of the hunk within the file (0-based) |
| `startLine` / `endLine` | Line indices within the hunk's lines array (0-based, inclusive) |
| `excerpt` | The selected diff text with `+`/`-` prefixes preserved |

**Important**: These are indices within the parsed diff structure, not source file line numbers. If the working tree changes and you refresh the diff, existing anchors may point to different lines or become invalid.

## License

MIT
