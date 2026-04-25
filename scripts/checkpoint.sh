#!/bin/bash
# Usage: ./scripts/checkpoint.sh "description of current stable state"

if [ -z "$1" ]; then
  echo "Usage: ./scripts/checkpoint.sh \"description\""
  exit 1
fi

# Refresh the merch rotation pool from Shopify's public sitemap.
# Non-blocking: if Shopify is unreachable, keep the existing data/merch.json.
echo "Refreshing merch rotation pool..."
if ! bash scripts/fetch-merch.sh; then
  echo "WARN: merch refresh failed; continuing with existing data/merch.json"
fi

# Run structural tests before checkpointing
echo "Running pre-commit tests..."
bash scripts/test.sh
if [ $? -ne 0 ]; then
  echo "Tests failed. Fix issues before creating checkpoint."
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
