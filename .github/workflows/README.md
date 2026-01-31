# GitHub Actions Fix: Git Diff with Shallow Checkout

## Problem

GitHub Actions workflows fail with the following error when using git diff commands:

```
fatal: ambiguous argument 'main': unknown revision or path not in the working tree
Use '--' to separate paths from revisions
```

**Exit code**: 128

## Root Cause

By default, `actions/checkout@v4` performs a **shallow clone** with `fetch-depth: 1`, which only fetches the latest commit. This means:

- The `main` branch is not available locally
- Git diff commands like `git diff main...HEAD` fail
- Only the current commit and its files are available

## Solution

### Fix 1: Set fetch-depth to 0 (Recommended)

Update the `actions/checkout` step to fetch all history:

```yaml
- name: Checkout repo
  uses: actions/checkout@v4
  with:
    fetch-depth: 0  # Fetch all history including all branches
```

### Fix 2: Use Proper Git References

Replace problematic git diff commands with proper references:

#### For Pull Request Workflows:

```yaml
# ✅ RECOMMENDED: Use GitHub PR context variables
- name: Check changes
  if: github.event_name == 'pull_request'
  run: |
    git diff --name-only ${{ github.event.pull_request.base.sha }}...${{ github.sha }}

# ✅ ALTERNATIVE: Use origin/main (requires fetch-depth: 0)
- name: Check changes  
  run: |
    git diff --name-only origin/main...HEAD
```

#### For Main Branch Workflows:

```yaml
# ✅ Use origin/main or origin/master
- name: Check changes
  run: |
    git diff --name-only origin/main~1...HEAD
```

### Fix 3: Explicitly Fetch Base Branch

If you want to keep shallow checkout but need the base branch:

```yaml
- name: Checkout repo
  uses: actions/checkout@v4
  with:
    fetch-depth: 1

- name: Fetch base branch
  run: |
    git fetch --depth=1 origin main:main
```

## What NOT to Do

❌ **Avoid these patterns** (they fail with shallow checkout):

```yaml
# ❌ WRONG - 'main' is not available locally
git diff main...HEAD

# ❌ WRONG - Same issue
git diff main..HEAD

# ❌ WRONG - Will fail if base branch not fetched
git diff main
```

## Complete Example

```yaml
name: CI

on:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main

jobs:
  check-changes:
    runs-on: ubuntu-latest
    
    steps:
      # ✅ Fix applied: fetch all history
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      # ✅ Now git diff works correctly
      - name: Check for specific file changes (PR)
        if: github.event_name == 'pull_request'
        run: |
          # Using GitHub context variables (recommended)
          if git diff --name-only ${{ github.event.pull_request.base.sha }}...${{ github.sha }} | grep -q '^src/'; then
            echo "Source files changed"
          fi
          
          # Or using origin/main (works with fetch-depth: 0)
          if git diff --name-only origin/main...HEAD | grep -q '^src/'; then
            echo "Source files changed"
          fi
      
      - name: Check for specific file changes (main)
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: |
          # For main branch, compare with previous commit
          git diff --name-only origin/main~1...HEAD
```

## Applied Fix in This Repository

The workflow file `.github/workflows/main.yml` has been updated with:

1. ✅ `fetch-depth: 0` in the checkout step
2. ✅ Proper git diff references using `origin/main`
3. ✅ GitHub context variables for PR workflows: `${{ github.event.pull_request.base.sha }}...${{ github.sha }}`
4. ✅ Examples of both correct approaches in comments

## Testing the Fix

To verify the fix works:

1. Create a pull request
2. The workflow should now run without the "unknown revision" error
3. Git diff commands will correctly compare against the base branch

## References

- [actions/checkout documentation](https://github.com/actions/checkout#usage)
- [GitHub Actions context variables](https://docs.github.com/en/actions/learn-github-actions/contexts#github-context)
- [Git diff documentation](https://git-scm.com/docs/git-diff)
