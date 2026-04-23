# Pi Dashboard Extension - Roadmap

## Overview

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 01 | Foundation | 🔄 Planned | Move existing dashboard, setup structure |
| 02 | Git Integration | ⏳ Planned | Git panel with status, log, branches (Standard scope) |
| 03 | Session Management | ⏳ Planned | Session switcher, bookmarks, stats |
| 04 | Polish | ⏳ Planned | Multi-tabs, shortcuts, styling |

## Phase 01: Foundation

**Goal:** Move existing dashboard to repo, set up proper extension structure, symlink to pi.

**Deliverables:**
- Extension directory structure
- Existing dashboard moved and working
- Symlink setup
- Basic README

**Tasks:**
1. Create `extensions/dashboard/` structure
2. Move existing dashboard code
3. Create symlink to `~/.pi/agent/extensions/`
4. Test `/dashboard` command works

---

## Phase 02: Git Integration (Standard Scope)

**Goal:** Full-featured git panel with status, commits, branches, and file operations.

**Deliverables:**
- Git utility helpers (command wrappers)
- GitPanel component
- Status parsing and display with file actions
- Branch management (list, checkout, create, delete)
- Stage/unstage file operations

**Tasks:**
1. Create `utils/git.ts` with git command wrappers
2. Create `components/GitPanel.ts`
3. Add git tab to dashboard
4. Implement branch checkout via SelectList
5. **Add:** Create new branch flow
6. **Add:** Delete local branch with confirmation
7. **Add:** Stage/unstage files via SelectList

---

## Phase 03: Session Management

**Goal:** Session switcher for managing multiple pi sessions.

**Deliverables:**
- SessionManager component
- List recent pi sessions with stats
- Quick session switching
- Session bookmarks/favorites
- Token usage per session

**Tasks:**
1. Create `utils/sessions.ts` for session discovery
2. Create `components/SessionPanel.ts`
3. Add sessions tab to dashboard
4. Implement session switch via SelectList
5. Add bookmark/favorite functionality

---

## Phase 04: Polish

**Goal:** Multi-tab dashboard, keyboard shortcuts, enhanced styling.

**Deliverables:**
- Tab system in dashboard (Overview, Todos, Git, Stats, Sessions)
- Keyboard navigation (1-5, arrows)
- Enhanced visual styling
- Shortcut registration

**Tasks:**
1. Implement tab bar component
2. Add tab switching logic
3. Register keyboard shortcuts
4. Polish styling with theme integration

---

## Milestones

### v1.0 - Foundation + Git
- Dashboard working
- Git panel functional (standard scope)
- Todos working

### v1.1 - Sessions + Polish
- Session management working
- All tabs functional
- Shortcuts registered

## Current Status

**Active Phase:** 01 - Foundation

**Next Action:** Create directory structure and move existing code.
