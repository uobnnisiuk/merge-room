# Database Skill

When working with the SQLite database in merge-room:

## Location
`web/data/merge-room.db` (gitignored)

## Schema (6 tables)
```sql
tasks (id, title, repoPath, status, prUrl, createdAt, updatedAt)
diffs (id, taskId, diffText, createdAt)
threads (id, taskId, createdAt)
comments (id, threadId, body, isPrivate, createdAt)
anchors (id, commentId, filePath, hunkIndex, startLine, endLine, excerpt, stale)
decisions (id, taskId, summary, rationale, risks, rollback, updatedAt)
```

## Status Values
`draft` → `review` → `approved` → `archived`

## Migrations
Located in `web/server/migrations/`:
- `001_init.sql` - Base schema
- `002_add_anchor_stale.sql` - Stale flag
- `002_add_pr_url.sql` - PR URL field

Migrations auto-run on server start.

## Adding a Migration
1. Create `web/server/migrations/00N_description.sql`
2. Restart server
3. Check `_migrations` table for applied migrations

## DB Operations
All in `web/server/db/`:
- `tasks.ts` - Task CRUD
- `diffs.ts` - Diff storage
- `threads.ts` - Thread operations
- `comments.ts` - Comment CRUD
- `anchors.ts` - Anchor operations
- `decisions.ts` - Decision CRUD

## Direct Access
```bash
sqlite3 web/data/merge-room.db
.tables
.schema tasks
SELECT * FROM tasks;
```

## Reset Database
```bash
rm -rf web/data
# Restart server - migrations will recreate
```
