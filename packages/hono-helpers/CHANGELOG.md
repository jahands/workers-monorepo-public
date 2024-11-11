# @repo/hono-helpers

## 1.6.1

### Patch Changes

- Updated dependencies [e797c62]
  - @repo/logging@1.3.10

## 1.6.0

### Minor Changes

- 4b1f076: feat: Add shared Sentry init functions

### Patch Changes

- bb74a7d: fix: use logger.flushAndStop() after handler is complete
- Updated dependencies [a8cbd3d]
- Updated dependencies [994b3ee]
  - @repo/logging@1.3.9
  - @repo/cftrace@1.0.8
  - @repo/eslint-config@0.1.24
  - @repo/otel@0.1.11

## 1.5.18

### Patch Changes

- d204e73: chore: update deps
- Updated dependencies [096715a]
- Updated dependencies [d204e73]
- Updated dependencies [d204e73]
  - @repo/logging@1.3.8
  - @repo/otel@0.1.11
  - @repo/eslint-config@0.1.24
  - @repo/cftrace@1.0.8

## 1.5.17

### Patch Changes

- bd875c8: chore: update deps
- 81a510e: fix: Add missing test scripts
- Updated dependencies [b2aaf52]
- Updated dependencies [bd875c8]
- Updated dependencies [8d26c04]
- Updated dependencies [81a510e]
  - @repo/eslint-config@0.1.23
  - @repo/otel@0.1.10
  - @repo/cftrace@1.0.8
  - @repo/logging@1.3.7

## 1.5.16

### Patch Changes

- 1831e2e: chore: update deps
- Updated dependencies [1831e2e]
  - @repo/eslint-config@0.1.22
  - @repo/logging@1.3.6
  - @repo/otel@0.1.9

## 1.5.15

### Patch Changes

- 8e5691a: chore: update deps
- Updated dependencies [8e5691a]
  - @repo/otel@0.1.8
  - @repo/cftrace@1.0.7
  - @repo/eslint-config@0.1.21
  - @repo/logging@1.3.5

## 1.5.14

### Patch Changes

- Updated dependencies [44174d4]
  - @repo/otel@0.1.7
  - @repo/cftrace@1.0.7
  - @repo/eslint-config@0.1.21
  - @repo/logging@1.3.5

## 1.5.13

### Patch Changes

- c0388aa: chore: update deps (http-codex)
  - @repo/cftrace@1.0.7
  - @repo/eslint-config@0.1.21
  - @repo/logging@1.3.5
  - @repo/otel@0.1.6

## 1.5.12

### Patch Changes

- Updated dependencies [89a46cc]
  - @repo/eslint-config@0.1.21

## 1.5.11

### Patch Changes

- Updated dependencies [94a98c7]
  - @repo/eslint-config@0.1.20
  - @repo/cftrace@1.0.7
  - @repo/logging@1.3.5
  - @repo/otel@0.1.6

## 1.5.10

### Patch Changes

- 21f8e11: chore: update deps
- Updated dependencies [21f8e11]
  - @repo/eslint-config@0.1.19
  - @repo/logging@1.3.5
  - @repo/otel@0.1.6
  - @repo/cftrace@1.0.7

## 1.5.9

### Patch Changes

- bd3f849: Use http-codex for http statuses in middleware

## 1.5.8

### Patch Changes

- c14503d: Switch to ULID for all invocation ids to add sortability
- Updated dependencies [bf87f7c]
  - @repo/logging@1.3.4

## 1.5.7

### Patch Changes

- Updated dependencies [ab280ca]
- Updated dependencies [04d5289]
  - @repo/logging@1.3.3
  - @repo/eslint-config@0.1.18
  - @repo/cftrace@1.0.7
  - @repo/otel@0.1.5

## 1.5.6

### Patch Changes

- Updated dependencies [a2a60ef]
  - @repo/otel@0.1.5

## 1.5.5

### Patch Changes

- Updated dependencies [3be161d]
  - @repo/eslint-config@0.1.17
  - @repo/otel@0.1.4

## 1.5.4

### Patch Changes

- 14dd3b9: Allow passing in an initSentry that returns undefined

  This made it easier to use initSentry functions that return undefined based on conditions like environment. Probably not needed in most cases, but the consistency is probably helpful.

- b8f55c9: fix: Use Axiom logger
- Updated dependencies [618937e]
  - @repo/logging@1.3.2

## 1.5.3

### Patch Changes

- b60e8a1: chore: update deps
- Updated dependencies [b60e8a1]
  - @repo/eslint-config@0.1.16
  - @repo/logging@1.3.1
  - @repo/cftrace@1.0.7
  - @repo/otel@0.1.3

## 1.5.2

### Patch Changes

- Updated dependencies [734489f]
  - @repo/otel@0.1.3

## 1.5.1

### Patch Changes

- Updated dependencies [9acbf33]
- Updated dependencies [a713a3d]
  - @repo/otel@0.1.2
  - @repo/cftrace@1.0.7
  - @repo/eslint-config@0.1.15
  - @repo/logging@1.3.0

## 1.5.0

### Minor Changes

- 7dfb6e5: Add workers-tagged-logger logging for all logs

### Patch Changes

- 221abd5: fix: Remove unused ts-expect-error
- e6c3b70: fix: Use @repo/otel to work around vitest issues
- 02aab84: fix: Add rest of logging calls in async context
- 50833df: chore: update deps
- 4cbd0a9: chore: update deps
- 2771478: Update log tags
- Updated dependencies [7dfb6e5]
- Updated dependencies [5418908]
- Updated dependencies [4204d1f]
- Updated dependencies [e6c3b70]
- Updated dependencies [d3cebab]
- Updated dependencies [50833df]
- Updated dependencies [e06e18d]
- Updated dependencies [4cbd0a9]
  - @repo/logging@1.3.0
  - @repo/otel@0.1.1
  - @repo/eslint-config@0.1.15
  - @repo/cftrace@1.0.7

## 1.4.14

### Patch Changes

- Updated dependencies [33d994a]
  - @repo/eslint-config@0.1.14

## 1.4.13

### Patch Changes

- 96adb20: fix: Add workaround for workers types breaking change
- 4103fa9: chore: update deps
- Updated dependencies [4103fa9]
  - @repo/eslint-config@0.1.13
  - @repo/cftrace@1.0.6
  - @repo/logging@1.2.8

## 1.4.12

### Patch Changes

- adfbd0c: chore: update deps
- Updated dependencies [adfbd0c]
  - @repo/eslint-config@0.1.12
  - @repo/cftrace@1.0.6
  - @repo/logging@1.2.8

## 1.4.11

### Patch Changes

- 5fb9e2c: chore: remove version:packages script - this is done by changesets now
- Updated dependencies [5fb9e2c]
  - @repo/cftrace@1.0.6
  - @repo/logging@1.2.8
  - @repo/eslint-config@0.1.11

## 1.4.10

### Patch Changes

- 5b2763c: chore: update deps
- Updated dependencies [5b2763c]
- Updated dependencies [a81ff3d]
  - @repo/eslint-config@0.1.11
  - @repo/cftrace@1.0.5
  - @repo/logging@1.2.7

## 1.4.9

### Patch Changes

- d0ae8b4: chore: update deps
- Updated dependencies [fa9f80d]
  - @repo/eslint-config@0.1.10
  - @repo/cftrace@1.0.5
  - @repo/logging@1.2.7

## 1.4.8

### Patch Changes

- 3dfc58b: Add hono tests to validate behavior between upgrades
- 32dd836: chore: update deps
- Updated dependencies [32dd836]
  - @repo/eslint-config@0.1.9

## 1.4.7

### Patch Changes

- 6c188e1: Apply array-type eslint rule
- 921a663: chore: update deps
- Updated dependencies [6c188e1]
- Updated dependencies [921a663]
- Updated dependencies [f57ca3b]
  - @repo/logging@1.2.7
  - @repo/eslint-config@0.1.8
  - @repo/cftrace@1.0.5

## 1.4.6

### Patch Changes

- 3c163e0: Validate api tokens with zod
- 6be804f: chore: update deps
- b46244d: chore: Format types the same way as other imports
- 93eb7ad: Add success to not found response
- 077b89b: Update a few more tests and add checks to tools/bunapps
- 2b87afc: Validate bindings in sentry/axiom middleware
- bc5f76b: Add cache bust token to turbo-cache
- Updated dependencies [1a779ca]
- Updated dependencies [6be804f]
- Updated dependencies [b46244d]
- Updated dependencies [4a50623]
  - @repo/eslint-config@0.1.7
  - @repo/logging@1.2.6
  - @repo/cftrace@1.0.5

## 1.4.5

### Patch Changes

- Updated dependencies [0978fff]
- Updated dependencies [1937ec0]
  - @repo/eslint-config@0.1.6

## 1.4.4

### Patch Changes

- Updated dependencies [791d367]
  - @repo/eslint-config@0.1.5
  - @repo/cftrace@1.0.5
  - @repo/logging@1.2.5

## 1.4.3

### Patch Changes

- dfb4390: chore: Improve import order
- 820fd18: chore: Use consistent type imports
- 4a3dd33: chore: update deps
- 9079cae: chore: format imports (types on bottom)
- Updated dependencies [dfb4390]
- Updated dependencies [820fd18]
- Updated dependencies [9079cae]
- Updated dependencies [8f98647]
- Updated dependencies [c0786d2]
  - @repo/logging@1.2.5
  - @repo/eslint-config@0.1.4
  - @repo/cftrace@1.0.5

## 1.4.2

### Patch Changes

- a1f718a: chore: Consolidate eslint configs and improve workers config
- 6f1c62c: chore: Formatting (imports + package.json order)
- Updated dependencies [079bd31]
- Updated dependencies [a1f718a]
- Updated dependencies [6f1c62c]
  - @repo/eslint-config@0.1.3
  - @repo/cftrace@1.0.5
  - @repo/logging@1.2.4

## 1.4.1

### Patch Changes

- cc0b3d5: fix: Revert hono to 4.4.13 due to breaking change with Variable types
- cf728a0: chore: update deps
  - @repo/cftrace@1.0.4
  - @repo/eslint-config@0.1.2
  - @repo/logging@1.2.3

## 1.4.0

### Minor Changes

- 8052d26: feat: Improve EnvValidator
- d9da386: feat: Add additional validators to hono-helpers and validate allergies bindings
- 8cd782c: feat: Add isSet() helper for validating environment variables

## 1.3.1

### Patch Changes

- 5f8ad92: chore: update deps

## 1.3.0

### Minor Changes

- 515d6c7: feat: Add success property to errors

### Patch Changes

- @repo/cftrace@1.0.4
- @repo/eslint-config@0.1.2
- @repo/logging@1.2.3

## 1.2.4

### Patch Changes

- 2956fbe: chore: update deps (hono)
  - @repo/cftrace@1.0.4
  - @repo/eslint-config@0.1.2
  - @repo/logging@1.2.3

## 1.2.3

### Patch Changes

- b50e27b: chore: Pin dependency versions
- 0f79366: chore: Only allow patches in deps and pin some packages
- ba64bba: chore: format package.json files for consistency

  Ran `npx syncpack format`

- Updated dependencies [a4a9a7b]
- Updated dependencies [0f79366]
- Updated dependencies [ba64bba]
- Updated dependencies [3dbb3d5]
  - @repo/eslint-config@0.1.2
  - @repo/cftrace@1.0.4
  - @repo/logging@1.2.3

## 1.2.2

### Patch Changes

- 2e07f64: chore: Use stricter types in access middleware
- e9b33e0: fix: Correctly check aud based on type

## 1.2.1

### Patch Changes

- 2bd6185: Tighten validation of Access subject
- 434bf73: fix: Service Auth payloads use string aud
- cd1b112: fix: Improve types for Cloudflare Access middleware
- Updated dependencies [1898de1]
  - @repo/logging@1.2.2

## 1.2.0

### Minor Changes

- 1dedd86: feat: Add useCloudflareAccess middleware

### Patch Changes

- 1bf3ab5: fix AccessTeamDomain regex + improve types / logging

  Also reverted to normal errors

- c611f8c: fix: Ensure tokens is set before checking length
- 88b19ff: chore: Clean up Access JWT header parsing
- 5f4a22f: Improve type safety in useCloudflareAccess middleware
- cad3c18: fix: Use correct key type
- Updated dependencies [27610ea]
- Updated dependencies [fb97713]
- Updated dependencies [bf1d463]
  - @repo/logging@1.2.1

## 1.1.7

### Patch Changes

- 2636f8e: chore: update deps

## 1.1.6

### Patch Changes

- cd3891d: chore: update deps
- e895bd0: chore: Update deps
  - @repo/cftrace@1.0.3
  - @repo/logging@1.2.0
  - @repo/eslint-config@0.1.1

## 1.1.5

### Patch Changes

- 7f0d79e: chore: update deps

## 1.1.4

### Patch Changes

- 0cc7a8a: chore: Switch to JRPC for AllergyDO
- Updated dependencies [0cc7a8a]
- Updated dependencies [d155d65]
  - @repo/logging@1.2.0
  - @repo/cftrace@1.0.3
  - @repo/eslint-config@0.1.1

## 1.1.3

### Patch Changes

- d63bfce: chore: update deps
- Updated dependencies [17242c2]
- Updated dependencies [40e623f]
  - @repo/logging@1.1.0

## 1.1.2

### Patch Changes

- 469a23d: chore: Update deps
- a11ff82: chore: Update deps

## 1.1.1

### Patch Changes

- 0cff038: chore: Update deps

## 1.1.0

### Minor Changes

- c5e68f9: feat: Allow multiple tokens in useAuth middleware

## 1.0.9

### Patch Changes

- 16f21bd: chore: Update deps

## 1.0.8

### Patch Changes

- 42caefc: chore(deps): Update deps

  - @cloudflare/vitest-pool-workers@0.2.3
  - @cloudflare/workers-types@4.20240423.0
  - hono@4.2.7
  - wrangler@3.52.0

## 1.0.7

### Patch Changes

- bedab76: chore: Update deps

## 1.0.6

### Patch Changes

- dc4a20c: fix: Improve logic for setting serviceName in tracing
- fae250a: feat: Add optional tag to getTracingConfig

  This enables this helper to work with Durable Objects with a unique name.

  - @repo/cftrace@1.0.3
  - @repo/logging@1.0.3

## 1.0.5

### Patch Changes

- 1e3161f: fix: Return c.body instead of new response in cache middleware

## 1.0.4

### Patch Changes

- 181f4fe: chore: Update hono to 4.2.3
