#!/bin/bash

# Get list of changed files (both staged and unstaged)
FILES=$(git diff --name-only --diff-filter=ACMRTUXB && git diff --name-only --diff-filter=ACMRTUXB --cached)

# Filter for relevant file types and exclude certain directories
FILTERED_FILES=$(echo "$FILES" | grep -E '\.(ts|js)$' | grep -v 'node_modules/' | grep -v 'cov_profile/' || echo "")

# Only run deno lint if there are files to lint
if [ ! -z "$FILTERED_FILES" ]; then
  echo "Linting changed files: $FILTERED_FILES"
  deno lint $FILTERED_FILES
else
  echo "No files to lint"
fi