#!/usr/bin/env bash
set -euo pipefail

REPO_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-dir|--r)
      if [[ $# -lt 2 ]]; then
        echo "Error: $1 requires a value" >&2
        exit 1
      fi
      REPO_DIR="$2"
      shift 2
      ;;
    -h|--help)
      cat <<'EOF'
Usage: launch-tmux-workspace.sh --repo-dir <repo-dir>

Example:
  launch-tmux-workspace.sh --repo-dir pi-mono
EOF
      exit 0
      ;;
    *)
      echo "Error: unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$REPO_DIR" ]]; then
  echo "Error: --repo-dir is required" >&2
  exit 1
fi

SESSION="$REPO_DIR"
ROOT="$HOME/dev/$REPO_DIR"

if [[ ! -d "$ROOT" ]]; then
  echo "Error: repo directory does not exist: $ROOT" >&2
  exit 1
fi

if ! tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux new-session -d -s "$SESSION" -n workbench -c "$ROOT" "bash -lc 'nvim .'"
  tmux split-window -v -l 15% -t "$SESSION":workbench.0 -c "$ROOT"
  tmux split-window -h -t "$SESSION":workbench.0 -c "$ROOT" "bash -lc 'lazygit'"

  tmux new-window -t "$SESSION" -n pi-main -c "$ROOT" "bash -lc 'pi'"
  tmux split-window -h -t "$SESSION":pi-main.0 -c "$ROOT" "bash -lc 'pi'"
  tmux select-layout -t "$SESSION":pi-main even-horizontal

  tmux new-window -t "$SESSION" -n cli-alt -c "$ROOT"
  tmux split-window -h -t "$SESSION":cli-alt.0 -c "$ROOT"
  tmux select-layout -t "$SESSION":cli-alt even-horizontal

  tmux select-window -t "$SESSION":workbench
fi

tmux attach -t "$SESSION"
