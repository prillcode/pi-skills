# Pi Dashboard Extension

A TUI dashboard extension for pi with integrated workflows.

## Features

- **Dashboard** (`/dashboard`) - Multi-tab dashboard with session stats
- **Todo Management** (`/todo`) - Persistent todo list with widget
- **Git Integration** - Git status, commits, branch management (Phase 02)
- **Session Management** - Switch between pi sessions (Phase 03)
- **Custom Footer** - Session stats and context

## Tabs

1. **Overview** - Session info, model details, todo summary
2. **Todos** - Full todo management
3. **Stats** - Token usage, cost tracking, context window
4. **Git** - Repository status, commits, branches (Phase 02)
5. **Sessions** - Session list, switch, bookmarks (Phase 03)

## Installation

```bash
# From the pi-skills repo
ln -s "$(pwd)/extensions/dashboard" ~/.pi/agent/extensions/dashboard
```

## Commands

- `/dashboard` - Open the dashboard
- `/todo [text]` - Add or manage todos
- `/footer` - Toggle custom footer

## Shortcuts

- `Ctrl+Shift+D` - Quick dashboard shortcut

## Architecture

```
dashboard/
├── index.ts              # Main extension entry
├── types.ts              # Shared types
├── components/
│   └── Dashboard.ts      # Main dashboard component
├── utils/                # Utility functions (populated in later phases)
└── README.md
```

## Development

This extension is developed in phases:

- **Phase 01** (Current): Foundation - Basic dashboard with Overview, Todos, Stats tabs
- **Phase 02**: Git Integration - Git panel with status, commits, branches, file operations
- **Phase 03**: Session Management - Session switcher and bookmarks
- **Phase 04**: Polish - Enhanced tabs, shortcuts, styling
