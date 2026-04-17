#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="${1:-$HOME/.pi/agent/skills}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SUITE_DIR="$REPO_ROOT/start-work-suite"

SKILLS=(
  "start-work-begin"
  "start-work-plan"
  "start-work-run"
)

mkdir -p "$TARGET_DIR"

echo "Installing symlinks into: $TARGET_DIR"

for skill in "${SKILLS[@]}"; do
  src="$SUITE_DIR/$skill"
  dest="$TARGET_DIR/$skill"

  if [[ ! -d "$src" ]]; then
    echo "[WARN] Missing source skill directory: $src"
    continue
  fi

  if [[ -L "$dest" || -e "$dest" ]]; then
    rm -rf "$dest"
  fi

  ln -s "$src" "$dest"
  echo "[OK] $dest -> $src"
done

echo
echo "Done. If Pi is already running, use /reload"
