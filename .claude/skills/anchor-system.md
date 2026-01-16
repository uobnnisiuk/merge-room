# Anchor System Skill

When working with the anchor/staleness system in merge-room:

## Concept
Anchors are stable references to diff positions. They store:
- `filePath`: The file in the diff
- `hunkIndex`: Which hunk (0-indexed)
- `startLine`, `endLine`: Line range within the hunk
- `excerpt`: The actual code text at time of creation
- `stale`: Boolean flag (computed client-side)

## Staleness Detection
Client-side in `ThreadPanel.tsx`:
```typescript
const isAnchorStale = (anchor) => {
  // Find file in parsed diff
  // Extract current excerpt at same position
  // Compare normalized excerpts
  // Return true if different or not found
};
```

## Key Files
- `web/src/components/ThreadPanel.tsx` - Staleness UI & logic
- `web/src/utils/diffParser.ts` - Diff parsing, `extractExcerpt()`
- `web/server/db/anchors.ts` - Server-side staleness check
- `web/server/migrations/002_add_anchor_stale.sql` - Schema

## UI Elements
- `.stale-label` - Red "STALE" badge
- `.stale-message` - Inline warning text
- `.thread.has-stale` - Left red border on thread card
- `.stale-filter-bar` - Counter and filter toggle
- `.copy-location-btn` - Copy anchor location

## Testing Staleness
1. Create task with demo repo
2. Create anchored comment
3. Modify file to change the anchored excerpt
4. Refresh diff
5. Verify anchor shows as stale
