Run all validation checks for merge-room.

Execute these commands in sequence:
1. TypeScript type check: `cd web && pnpm tsc --noEmit`
2. Production build: `pnpm build`
3. E2E tests: `pnpm test:e2e`

Report the status of each check (pass/fail).
If any check fails, show the error details.
