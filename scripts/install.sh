#!/usr/bin/env bash
# Install the prompt-refinery skill into this machine's DSH home.
#
# dsh-skill-filesystem scans these roots (lower rank number wins):
#   <project>/.dsh/skills -> <project>/.agents/skills -> customSkillDirs
#   -> $DSH_HOME/skills -> $HOME/.agents/skills
# Installing into $DSH_HOME/skills is user level: every session and every agent
# preset sees it, and no restart is needed because the root is watched.
#
# usage: bash scripts/install.sh [--verify-only] [SOURCE_DIR]

set -euo pipefail

NAME="prompt-refinery"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
VERIFY_ONLY=0
SOURCE=""

for arg in "$@"; do
  case "$arg" in
    --verify-only) VERIFY_ONLY=1 ;;
    -*) echo "unknown flag: $arg" >&2; exit 2 ;;
    *) SOURCE="$arg" ;;
  esac
done

if [ -z "$SOURCE" ]; then
  SOURCE="$(cd "$(dirname "$0")/.." && pwd)"
fi
TARGET="$DSH_HOME/skills/$NAME"

validate() {
  local dir="$1" skill="$1/SKILL.md"
  [ -f "$skill" ] || { echo "missing SKILL.md under: $dir" >&2; return 1; }
  local first
  first="$(head -n 1 "$skill")"
  [ "$first" = "---" ] || { echo "frontmatter must start with ---" >&2; return 1; }
  grep -qE '^name:[[:space:]]*prompt-refinery[[:space:]]*$' "$skill" || { echo "name must be exactly: prompt-refinery" >&2; return 1; }
  local desc
  desc="$(grep -m1 '^description:' "$skill" || true)"
  [ -n "$desc" ] || { echo "description is missing" >&2; return 1; }
  local body="${desc#description:}"
  body="${body# }"
  body="${body%\"}"; body="${body#\"}"
  local n=${#body}
  [ "$n" -le 500 ] || { echo "description exceeds 500 chars (got $n)" >&2; return 1; }
  local refs
  refs="$(grep -oE 'references/[a-z0-9-]+\.md' "$skill" | sort -u || true)"
  local r
  for r in $refs; do
    [ -f "$dir/$r" ] || { echo "SKILL.md references a missing file: $r" >&2; return 1; }
  done
  echo "VALIDATION: PASS"
  echo "  Dir        : $dir"
  echo "  SkillBytes : $(wc -c < "$skill" | tr -d ' ')"
  echo "  DescChars  : $n"
  echo "  Files      : $(find "$dir" -type f | wc -l | tr -d ' ')"
  echo "  References : $(echo "$refs" | tr '\n' ' ')"
}

echo "DSH_HOME  = $DSH_HOME"
echo "source    = $SOURCE"

if [ "$VERIFY_ONLY" -eq 0 ]; then
  [ -d "$SOURCE" ] || { echo "source bundle not found: $SOURCE" >&2; exit 1; }
  mkdir -p "$DSH_HOME/skills"
  if [ -d "$TARGET" ]; then
    BAK="$DSH_HOME/skill-backups/$NAME.bak-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$DSH_HOME/skill-backups"
    cp -R "$TARGET" "$BAK"
    echo "previous copy backed up to: $BAK"
  fi
  mkdir -p "$TARGET"
  cp "$SOURCE/SKILL.md" "$TARGET/SKILL.md"
  rm -rf "$TARGET/references"
  cp -R "$SOURCE/references" "$TARGET/references"
  echo "installed to = $TARGET"
else
  echo "verify only, target = $TARGET"
fi

validate "$TARGET"
echo "Takes effect without restart: the skills root is watched."
echo "Manual invoke: type /prompt-refinery in the composer."