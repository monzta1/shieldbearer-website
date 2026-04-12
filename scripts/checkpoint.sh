#!/bin/bash
# Usage: ./scripts/checkpoint.sh "description of current stable state"

if [ -z "$1" ]; then
  echo "Usage: ./scripts/checkpoint.sh \"description\""
  exit 1
fi

BRANCH=$(git branch --show-current)
LABEL="checkpoint-$(date +%Y%m%d-%H%M)"

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "checkpoint: $1"
fi

git tag -a "$LABEL" -m "$1"
git push origin "$BRANCH" --tags

echo "Checkpoint created: $LABEL"
echo "Branch protected: $BRANCH"
echo "To rollback: git checkout $LABEL"
