# merge-room: Implementation Notes

## Spike Scope

This is a spike implementation to validate the "pre-PR workspace" concept.
The goal is to prove the workflow, not to build production-ready software.

## Current Limitations

- Single user only (no concurrent editing)
- Local only (no cloud sync, no GitHub API integration)
- No authentication
- Polling-based refresh (no WebSocket real-time sync)

## Future Considerations

### Multi-user Support
- Add user table with session tokens
- WebSocket for real-time comment sync
- Optimistic locking on decisions

### GitHub Integration
- OAuth flow for GitHub authentication
- Use GitHub API to fetch PR diff instead of local git
- Post comments back to GitHub PR
- Sync decision status with PR labels

### Slack Integration
- Webhook for decision status changes
- Link sharing with preview

### Enhanced Diff Viewer
- Syntax highlighting per language
- Side-by-side diff mode
- Image diff support

## Architecture Decisions

### Why SQLite?
- Zero configuration
- Single file, easy backup
- Fast enough for single-user local use
- Easy to migrate to PostgreSQL later if needed

### Why no ORM?
- Spike simplicity
- Direct SQL gives more control
- Easy to see exactly what's happening

### Why Zustand?
- Minimal boilerplate
- No provider wrapper needed
- TypeScript-friendly
- Easy to understand

## Known Issues

(Add issues discovered during testing here)
