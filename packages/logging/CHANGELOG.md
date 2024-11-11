# @repo/logging

## 1.3.10

### Patch Changes

- e797c62: chore: update comment for LogTags.handlerName

## 1.3.9

### Patch Changes

- a8cbd3d: Add workflow name to logs for named handlers
- 994b3ee: fix: flush and clear timeout after running
  - @repo/cftrace@1.0.8

## 1.3.8

### Patch Changes

- 096715a: feat: Add axiom logger to workflows context
  - @repo/cftrace@1.0.8

## 1.3.7

### Patch Changes

- 81a510e: fix: Add missing test scripts
- Updated dependencies [81a510e]
  - @repo/cftrace@1.0.8

## 1.3.6

### Patch Changes

- 1831e2e: chore: update deps

## 1.3.5

### Patch Changes

- 21f8e11: chore: update deps
  - @repo/cftrace@1.0.7

## 1.3.4

### Patch Changes

- bf87f7c: Log queue batch size

## 1.3.3

### Patch Changes

- ab280ca: add new log type
- 04d5289: add no-floating-promises rule and fix all eslint warnings
  - @repo/cftrace@1.0.7

## 1.3.2

### Patch Changes

- 618937e: fix: Don't flush in tests

## 1.3.1

### Patch Changes

- b60e8a1: chore: update deps
  - @repo/cftrace@1.0.7

## 1.3.0

### Minor Changes

- 7dfb6e5: Add workers-tagged-logger logging for all logs

### Patch Changes

- e6c3b70: fix: Use @repo/otel to work around vitest issues
- d3cebab: fix: Actually log to Workers Logs
- 50833df: chore: update deps
- e06e18d: Send more logs to new logger
- Updated dependencies [e6c3b70]
  - @repo/cftrace@1.0.7

## 1.2.8

### Patch Changes

- 5fb9e2c: chore: remove version:packages script - this is done by changesets now
- Updated dependencies [5fb9e2c]
  - @repo/cftrace@1.0.6

## 1.2.7

### Patch Changes

- 6c188e1: Apply array-type eslint rule
  - @repo/cftrace@1.0.5

## 1.2.6

### Patch Changes

- b46244d: chore: Format types the same way as other imports
  - @repo/cftrace@1.0.5

## 1.2.5

### Patch Changes

- dfb4390: chore: Improve import order
- 820fd18: chore: Use consistent type imports
- 9079cae: chore: format imports (types on bottom)
  - @repo/cftrace@1.0.5

## 1.2.4

### Patch Changes

- a1f718a: chore: Consolidate eslint configs and improve workers config
- 6f1c62c: chore: Formatting (imports + package.json order)
- Updated dependencies [a1f718a]
- Updated dependencies [6f1c62c]
  - @repo/cftrace@1.0.5

## 1.2.3

### Patch Changes

- 0f79366: chore: Only allow patches in deps and pin some packages
- ba64bba: chore: format package.json files for consistency

  Ran `npx syncpack format`

- Updated dependencies [0f79366]
- Updated dependencies [ba64bba]
  - @repo/cftrace@1.0.4

## 1.2.2

### Patch Changes

- 1898de1: Add logWithLevel() and strictly type LogLevel

## 1.2.1

### Patch Changes

- 27610ea: fix: Use any instead of unknown
- fb97713: Improve logging types
- bf1d463: fix: Make error optional

## 1.2.0

### Minor Changes

- d155d65: feat: Add durable object based storage to logger

### Patch Changes

- 0cc7a8a: chore: Switch to JRPC for AllergyDO
  - @repo/cftrace@1.0.3

## 1.1.0

### Minor Changes

- 17242c2: feat: Allow overriding log timestamp
