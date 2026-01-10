# merge-room Investment Decision

## Hypotheses Under Validation (3)

### 1. Pre-PR Workspace Reduces Review Friction
Traditional PRs mix iteration with discussion. By separating "private iteration (with AI)" from "synchronous discussion" and using PRs only for finalization, we hypothesize:
- Faster convergence on design decisions
- Clearer rationale preserved in export

### 2. Required Decision Document Improves Approval Quality
Enforcing summary/rationale/risks/rollback fields before approval should:
- Force authors to articulate intent explicitly
- Reduce "LGTM without reading" approvals
- Create audit trail for future debugging

### 3. Line-Anchored Discussions Stay Relevant
Anchoring comments to specific diff lines (hunk-relative indices) should:
- Keep discussions contextual even as code changes
- Enable export to meaningful PR descriptions

## What's Already Working

- **Task Management**: Create tasks linked to local git repositories; status workflow (draft → review → approved → archived)
- **Diff Viewer**: Display staged, unstaged, and untracked changes; collapsible file sections
- **Line Selection**: Select diff line ranges to quote in comments (anchor = filePath + hunkIndex + line indices)
- **Thread Discussions**: Create threads on code selections; reply to existing threads
- **Private AI Notes**: Separate tab for notes excluded from export
- **Decision Gating**: Cannot approve without filling all 4 decision fields (server-enforced, 400 error)
- **PR Draft Export**: Generate markdown with decision + threads + anchors; copy to clipboard + save to docs/pr-drafts/
- **E2E Test**: Automated smoke test covering full workflow including negative approval test

## Intentionally Not Implemented

| Feature | Reason |
|---------|--------|
| Authentication | Single-user spike, local-only |
| Multi-user | No concurrent editing needed for validation |
| Real-time sync | Polling sufficient for spike |
| GitHub API | Focus on workflow, not integration |
| Slack notifications | Out of scope |
| Syntax highlighting | Plain text sufficient for validation |
| Image/binary diffs | Text-only for now |

## Next Validation Steps

1. **Dogfood internally**: Use merge-room for 2-3 real code changes before investment
2. **Collect pain points**: Does the anchor system break when diffs change?
3. **Evaluate GitHub integration value**: Is manual copy-paste acceptable or must we API-sync?
4. **Consider collaboration**: Is single-user sufficient or does review need multi-user?

## Decision

Pending internal validation. See `docs/notes.md` for architecture notes.

---

日本語版: [decision.ja.md](ja/decision.ja.md)
