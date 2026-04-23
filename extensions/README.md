# Pi Dashboard Extension

A TUI dashboard extension for pi with integrated editor and git workflows.

## Features

- **Dashboard** (`/dashboard`) - Multi-tab dashboard with session stats
- **Todo Management** (`/todo`) - Persistent todo list with widget
- **Git Integration** - Custom git UI (status, log, branches)
- **Modal Editor** - Vim-like editing mode
- **Custom Footer** - Session stats and context

## Tabs

1. **Overview** - Session info, model details, todo summary
2. **Todos** - Full todo management
3. **Git** - Git status, recent commits, branch list
4. **Stats** - Token usage, cost tracking, context window
5. **Editor** - Simple file browser + vim-like editor

## Installation

```bash
# Symlink to pi extensions directory
ln -s "$(pwd)/pi-skills/extensions/dashboard" ~/.pi/agent/extensions/dashboard
```

## Commands

- `/dashboard` - Open the dashboard
- `/todo [text]` - Add or manage todos
- `/footer` - Toggle custom footer
- `Ctrl+Shift+D` - Quick dashboard shortcut

## Architecture

```
extensions/
├── dashboard/
│   ├── index.ts          # Main extension entry
│   ├── components/
│   │   ├── Dashboard.ts  # Main dashboard component
│   │   ├── GitPanel.ts   # Git integration panel
│   │   ├── Editor.ts     # Vim-like editor component
│   │   └── TodoList.ts   # Todo management UI
│   ├── utils/
│   │   ├── git.ts        # Git command helpers
│   │   └── format.ts     # Formatting utilities
│   └── README.md
```
