# Pi Dashboard Extension - Brief

## Vision

Create a rich TUI dashboard extension for pi that integrates developer workflows directly into the agent interface. The dashboard provides at-a-glance session information, todo management, git operations, and session management - all without leaving pi.

## Goals

1. **Single-pane workflow** - Access session stats, todos, git status, and other sessions without context switching
2. **Keyboard-driven** - All features accessible via keyboard shortcuts
3. **Persistent state** - Todos and preferences survive session restarts
4. **Non-intrusive** - Works alongside normal pi usage, optional to use

## Scope

### In Scope
- Multi-tab dashboard (Overview, Todos, Git, Stats, Sessions)
- Todo list with persistence
- Git status panel (status, log, branches, file operations)
- Session management (switch, bookmark, stats)
- Custom footer with session info
- Keyboard shortcuts

### Out of Scope (Future)
- Full LazyVim embedding (requires terminal emulation)
- Full LazyGit embedding (requires terminal emulation)
- Complex git operations (merge, rebase UI)
- File tree browser
- Modal editor (can use pi's built-in editor)
- Plugin system

## Architecture Approach

### Sessions: Session Management Panel
Instead of trying to embed terminal emulators (which requires PTY/terminal emulation), we use pi's built-in session APIs to provide:
- List all pi sessions with stats
- Quick switch between sessions
- Bookmark favorite sessions
- View token usage per session

**Tradeoff:** Can't embed full applications, but provides seamless session management integrated with pi.

### Git: Custom Git UI
Instead of embedding LazyGit, we'll build a git panel using:
- Direct `git` command execution
- Custom components for status, log, branches
- Quick actions (checkout, create/delete branches, stage/unstage)

**Tradeoff:** Less visual polish than LazyGit, but integrated and scriptable.

### Tabs
Horizontal tabs at the top of dashboard:
1. **Overview** - Session, model, todo summary
2. **Todos** - Full todo management
3. **Git** - Status, log, branches, file operations
4. **Stats** - Token usage, costs, context
5. **Sessions** - Session list, switch, bookmarks

## Key Features

### Dashboard (`/dashboard` or Ctrl+Shift+D)
- Full-screen overlay with tabs
- Real-time stats update
- Context-aware (shows git info only in git repos)

### Todo System (`/todo`)
- Quick add: `/todo Buy milk`
- Full UI for manage/completion
- Persistent across sessions
- Widget showing top 3 todos below editor

### Git Panel (Standard Scope)
- Repo detection
- Status summary (modified, staged, untracked)
- **Stage/unstage files**
- Recent commits (last 10)
- Branch list with current
- **Create new branches**
- **Delete local branches**
- Quick checkout

### Session Management
- List all pi sessions
- Switch between sessions
- Bookmark favorite sessions
- View token usage and costs per session
- Quick session stats

## Success Criteria

- [ ] Dashboard opens in < 100ms
- [ ] All tabs switchable via keyboard (1-5 or arrows)
- [ ] Todos persist across `/reload` and session restore
- [ ] Git panel shows accurate status and supports branch/file operations
- [ ] Session panel lists sessions and allows switching
- [ ] Bookmarks persist across sessions
- [ ] Custom footer shows session stats

## Future Enhancements

- Git diff view
- Session search/filter
- Custom themes
- Plugin API
- Export session data
