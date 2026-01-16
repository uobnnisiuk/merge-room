Reset the merge-room database to a clean state.

Execute these commands:
1. Remove the database: `rm -rf web/data`
2. Reseed demo repo: `cd web && pnpm demo:seed`

The database will be recreated with fresh migrations on next server start.
