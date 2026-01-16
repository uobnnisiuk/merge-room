# E2E Test Skill

When asked to run or debug E2E tests for merge-room:

## Running Tests
```bash
cd /home/user/merge-room/web
pnpm demo:seed
pnpm test:e2e
```

## Test Structure
The E2E tests are in `web/scripts/e2e-smoke.js` and test:
1. Task creation with demo repo path
2. PR URL setting
3. Diff refresh from git working tree
4. Thread creation with anchored comment
5. Private AI note creation
6. Export preview generation
7. Decision field updates
8. Status transitions (draft → review → approved)
9. Final PR draft export
10. Anchor staleness detection

## Debugging Failures
- Check server logs for errors
- Verify demo-repo exists: `ls docs/demo-repo`
- Check database: `sqlite3 web/data/merge-room.db ".tables"`
- Reset and retry: `rm -rf web/data && pnpm demo:seed && pnpm test:e2e`

## Adding New Test Steps
Add to `e2e-smoke.js` following the pattern:
```javascript
console.log('[e2e] Step N: Description...');
const response = await fetch(`${BASE_URL}/api/...`);
// assertions
console.log('[e2e] Step N passed');
```
