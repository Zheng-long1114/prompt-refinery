#!/usr/bin/env bash
# Install prompt-refinery into a project as a committed skill.
#
# Writes to <project>/.agents/skills/prompt-refinery so anyone who clones the
# project gets it. DSH scans that root before the user roots, so the project
# copy wins over a user-level or bundled copy.
#
# usage: bash scripts/install-project.sh [PROJECT_DIR] [--mode clone|copy|link] [--root .agents/skills]
set -euo pipefail

NAME="prompt-refinery"
REPO_URL="https://github.com/Zheng-long1114/prompt-refinery.git"
PROJECT="$(pwd)"
MODE="clone"
ROOT=".agents/skills"
SOURCE="$(cd "$(dirname "$0")/.." && pwd)"

while [ $# -gt 0 ]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --root) ROOT="$2"; shift 2 ;;
    --source) SOURCE="$2"; shift 2 ;;
    -*) echo "unknown flag: $1" >&2; exit 2 ;;
    *) PROJECT="$1"; shift ;;
  esac
done

TARGET="$PROJECT/$ROOT/$NAME"
[ -d "$PROJECT" ] || { echo "project not found: $PROJECT" >&2; exit 1; }
mkdir -p "$(dirname "$TARGET")"

if [ -e "$TARGET" ]; then
  echo "already present: $TARGET"
else
  case "$MODE" in
    clone) git clone -q "$REPO_URL" "$TARGET"; echo "cloned  : $TARGET" ;;
    copy)  cp -R "$SOURCE" "$TARGET"; rm -rf "$TARGET/.git"; echo "copied  : $TARGET" ;;
    link)  ln -s "$SOURCE" "$TARGET"; echo "linked  : $TARGET -> $SOURCE" ;;
    *) echo "unknown mode: $MODE" >&2; exit 2 ;;
  esac
fi

[ -f "$TARGET/SKILL.md" ] || { echo "install failed, no SKILL.md" >&2; exit 1; }
echo
echo "installed: $TARGET"
echo "  SKILL.md $(wc -c < "$TARGET/SKILL.md" | tr -d ' ') bytes"
echo "  project root rank 200 ('.agents/skills') or 100 ('.dsh/skills')"
echo "  takes effect on the next catalog lookup - no restart needed"