#!/bin/bash

# Get list of changed files (both staged and unstaged)
FILES=$(git diff --name-only --diff-filter=ACMRTUXB && git diff --name-only --diff-filter=ACMRTUXB --cached)

# Filter for actual test files only (not README or other files)
FILTERED_FILES=$(echo "$FILES" | grep -E '^src/.*\.test\.(ts|js)$' || echo "")

# Only run deno test if there are test files to test
if [ ! -z "$FILTERED_FILES" ]; then
  echo "Testing changed files: $FILTERED_FILES"
  deno test --no-check $FILTERED_FILES
else
  echo "No test files changed"
fi