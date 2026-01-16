Run the E2E smoke tests for merge-room.

Execute the following steps:
1. Seed the demo repository: `cd web && pnpm demo:seed`
2. Run E2E tests: `pnpm test:e2e`

The tests will:
- Create a task with the demo repo
- Refresh diff from git
- Create anchored comments
- Update decision fields
- Export PR draft
- Verify anchor staleness detection

Report any failures with the specific step that failed.
