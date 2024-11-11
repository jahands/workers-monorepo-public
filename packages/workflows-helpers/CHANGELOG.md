# @repo/workflows-helpers

## 0.4.1

### Patch Changes

- f323d63: Record all errors from c.run() so we can see why it's erroring
- Updated dependencies [e797c62]
  - @repo/logging@1.3.10

## 0.4.0

### Minor Changes

- 4b1f076: feat: Move auth to shared workflows-helpers package
- 4b1f076: feat: Add shared Sentry init functions
- 64484b2: Add Workflow types so we can share across workers
- e30ea57: feat: Add kv to workflows-helpers and specify proper exports

### Patch Changes

- 39e7910: fix: Add missing hono dependency
- a8cbd3d: Add workflow name to logs for named handlers
- 994b3ee: fix: flush and clear timeout after running
- Updated dependencies [a8cbd3d]
- Updated dependencies [994b3ee]
  - @repo/logging@1.3.9
  - @repo/cftrace@1.0.8
  - @repo/eslint-config@0.1.24

## 0.3.0

### Minor Changes

- 096715a: feat: Add axiom logger to workflows context
- bb09554: feat: Add tagged logger context

### Patch Changes

- Updated dependencies [096715a]
- Updated dependencies [d204e73]
  - @repo/logging@1.3.8
  - @repo/eslint-config@0.1.24
  - @repo/cftrace@1.0.8

## 0.2.0

### Minor Changes

- a9fd562: feat: Move WorkflowContext to shared package

### Patch Changes

- fb1045a: mark overloads as async
- 3be5959: fix: retry durable object reset errors
- Updated dependencies [b2aaf52]
- Updated dependencies [81a510e]
  - @repo/eslint-config@0.1.23
  - @repo/cftrace@1.0.8
