Help create a new API endpoint for merge-room.

Ask the user for:
1. HTTP method (GET, POST, PUT, PATCH, DELETE)
2. Route path (e.g., /api/tasks/:id/something)
3. Purpose/description
4. Request body schema (if applicable)
5. Response schema

Then implement:
1. Add route handler in `web/server/routes/tasks.ts`
2. Add DB function in `web/server/db/` if needed
3. Update types in `web/src/api/types.ts`
4. Add store action in `web/src/store/taskStore.ts`
5. Run typecheck to verify

Follow existing patterns in the codebase.
