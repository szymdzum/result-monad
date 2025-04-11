# Publishing to JSR Registry

This document outlines the steps taken to prepare this package for publication to the
[JSR Registry](https://jsr.io/).

## Completed Steps

1. **Package Configuration**
   - Updated `deno.json` with proper JSR metadata:
     - Package name: `@kumak/result-monad`
     - Version: `0.1.0`
     - Entry point: `./mod.ts`
   - Added tasks for testing, linting, formatting, and publishing
   - Added publication configuration to control included files

2. **Code Structure**
   - Created a proper `mod.ts` entry point that re-exports from source files
   - Fixed relative imports to use `.ts` extensions (changed from `.js` to `.ts`)
   - Addressed "slow types" issues by adding explicit return types to exported functions

3. **Testing Setup**
   - Created a basic test utilities file (`tests/test_utils.ts`)
   - Created a sample test file (`tests/result_test.ts`) using Deno's testing patterns
   - Added a test task in `deno.json`

4. **Project Files**
   - Created appropriate `.gitignore` file for Deno projects
   - Added documentation about the library in `README.md`
   - Included MIT license

## Next Steps

1. **Test the Package:**
   ```bash
   deno task test     # Run Deno tests
   deno check mod.ts  # Verify types are correct
   ```

2. **Dry Run Publication:**
   ```bash
   deno publish --dry-run
   ```
   This will check for any remaining issues before actual publication.

3. **Publish to JSR Registry:**
   ```bash
   deno publish
   ```
   This will prompt you to login and approve the publication.

4. **GitHub Actions Setup (Optional):** You can set up automated publishing using GitHub Actions.
   Create a workflow file at `.github/workflows/publish.yml`:

   ```yaml
   name: Publish

   on:
     push:
       branches:
         - main

   jobs:
     publish:
       runs-on: ubuntu-latest
       permissions:
         contents: read
         id-token: write
       steps:
         - uses: actions/checkout@v4
         - run: deno publish
   ```

   Remember to link your GitHub repository in the JSR package settings.

## Troubleshooting

If you encounter issues during publication:

1. **Slow Types Errors:** Use `--allow-slow-types` flag if you don't want to fix all return type
   issues
2. **Import Errors:** Ensure all imports use proper `.ts` extensions
3. **Module Errors:** Verify your `mod.ts` properly exports all intended functionality

For more information, see the [JSR documentation](https://jsr.io/docs/publishing-packages).
