# turbo-cache

## 0.5.9

### Patch Changes

- Updated dependencies [e797c62]
  - @repo/logging@1.3.10
  - @repo/hono-helpers@1.6.1

## 0.5.8

### Patch Changes

- Updated dependencies [bb74a7d]
- Updated dependencies [a8cbd3d]
- Updated dependencies [994b3ee]
- Updated dependencies [4b1f076]
  - @repo/hono-helpers@1.6.0
  - @repo/logging@1.3.9
  - @repo/cftrace@1.0.8
  - @repo/otel@0.1.11

## 0.5.7

### Patch Changes

- 60e07e5: chore: Add wrangler as dependency to all Worekrs packages

  In the future, we want to pull types from Wrangler which requires adding wrangler as a dep to the package

- d204e73: chore: update deps
- Updated dependencies [096715a]
- Updated dependencies [d204e73]
- Updated dependencies [d204e73]
  - @repo/logging@1.3.8
  - @repo/otel@0.1.11
  - @repo/hono-helpers@1.5.18
  - @repo/cftrace@1.0.8

## 0.5.6

### Patch Changes

- bd875c8: chore: update deps
- Updated dependencies [bd875c8]
- Updated dependencies [8d26c04]
- Updated dependencies [81a510e]
  - @repo/hono-helpers@1.5.17
  - @repo/otel@0.1.10
  - @repo/cftrace@1.0.8
  - @repo/logging@1.3.7

## 0.5.5

### Patch Changes

- 1831e2e: chore: update deps
- Updated dependencies [1831e2e]
  - @repo/hono-helpers@1.5.16
  - @repo/logging@1.3.6
  - @repo/otel@0.1.9

## 0.5.4

### Patch Changes

- 8e5691a: chore: update deps
- Updated dependencies [8e5691a]
  - @repo/hono-helpers@1.5.15
  - @repo/otel@0.1.8
  - @repo/cftrace@1.0.7
  - @repo/logging@1.3.5

## 0.5.3

### Patch Changes

- Updated dependencies [44174d4]
  - @repo/otel@0.1.7
  - @repo/cftrace@1.0.7
  - @repo/hono-helpers@1.5.14
  - @repo/logging@1.3.5

## 0.5.2

### Patch Changes

- c0388aa: chore: update deps (http-codex)
- Updated dependencies [c0388aa]
  - @repo/hono-helpers@1.5.13
  - @repo/cftrace@1.0.7
  - @repo/logging@1.3.5
  - @repo/otel@0.1.6

## 0.5.1

### Patch Changes

- @repo/hono-helpers@1.5.12

## 0.5.0

### Minor Changes

- 8c04073: feat: Add all time stats for artifact hits/misses/etc.

## 0.4.5

### Patch Changes

- d4a7665: chore: add .env.example files
  - @repo/cftrace@1.0.7
  - @repo/hono-helpers@1.5.11
  - @repo/logging@1.3.5
  - @repo/otel@0.1.6

## 0.4.4

### Patch Changes

- 21f8e11: chore: update deps
- Updated dependencies [21f8e11]
  - @repo/hono-helpers@1.5.10
  - @repo/logging@1.3.5
  - @repo/otel@0.1.6
  - @repo/cftrace@1.0.7

## 0.4.3

### Patch Changes

- Updated dependencies [bd3f849]
  - @repo/hono-helpers@1.5.9

## 0.4.2

### Patch Changes

- c14503d: Switch to ULID for all invocation ids to add sortability
- Updated dependencies [bf87f7c]
- Updated dependencies [c14503d]
  - @repo/logging@1.3.4
  - @repo/hono-helpers@1.5.8

## 0.4.1

### Patch Changes

- 04d5289: add no-floating-promises rule and fix all eslint warnings
- Updated dependencies [ab280ca]
- Updated dependencies [04d5289]
  - @repo/logging@1.3.3
  - @repo/cftrace@1.0.7
  - @repo/hono-helpers@1.5.7
  - @repo/otel@0.1.5

## 0.4.0

### Minor Changes

- 5c6dd19: Switch to R2 because of size limitations of KV

  At some point, it would be cool to do tiered storage so that smaller objects can be stored in KV. However, I think for now it probably isn't worth the effort as I have other things I want to do. Oh well :(

### Patch Changes

- 0e41a7c: fix: don't read body twice
- 29a0567: bulk delete keys to improve speed
- 7c7054e: fix: await promise and pre-read buffer for smaller files
- 5646f9f: feat: add max_size to stats
- Updated dependencies [a2a60ef]
  - @repo/otel@0.1.5
  - @repo/hono-helpers@1.5.6

## 0.3.1

### Patch Changes

- bc60047: fix: use async callback in p-queue to improve traces
- 3be161d: chore: update deps
- dbce9e4: Add additional logging for purging
- Updated dependencies [3be161d]
  - @repo/otel@0.1.4
  - @repo/hono-helpers@1.5.5

## 0.3.0

### Minor Changes

- c70b93b: feat: add stats endpoint
- b6a1549: feat: Switch to KV for artifacts
- b83e7d1: feat: Add artifact size to db
- 14dd3b9: Use TurboCache DO to purge from KV

  - Deleted all existing data and dropped the value column now that we're using KV
  - Added logger + sentry

- dfcc6ed: feat: Auto purge cache every hour
- 2e58e70: Write to DB on puts

### Patch Changes

- db04718: Add option to purge all and add api integration tests
- f4081a7: Add test to read artifact via api
- 26109b5: feat: add db size
- 8d88a6a: fix: Get using correct id
- 304dfce: fix: optimize list endpoint
- 786c320: fix: move rest of setup into blockConcurrencyWhile and fix test
- af78335: Add total hits stat
- aee0f1e: Rename insertArtifact to upsertArtifact to align with new behavior
- f70c252: fix: Use correct span name
- 4aeb15b: auto purge after 10 seconds
- d34d5b5: fix: add indexes to improve performance
- cca0bc1: fix: make total_hits nullable
- 98eadea: Remove debug log from getTurboCache
- 618937e: chore: Assert KV gets purged in tests
- cf197e0: fix: read from kv as arrayBuffer
- 6230a12: fix: await stats before returning
- 70f0931: Use correct name for p-retry options type
- dbb5341: fix: Allow upserting artifacts
- 47a5146: List via TurboCache instead of KV
- Updated dependencies [14dd3b9]
- Updated dependencies [618937e]
- Updated dependencies [b8f55c9]
  - @repo/hono-helpers@1.5.4
  - @repo/logging@1.3.2

## 0.2.0

### Minor Changes

- 5d27288: feat: Switch to SQL Durable Objects for cache storage

### Patch Changes

- b60e8a1: chore: update deps
- Updated dependencies [b60e8a1]
  - @repo/hono-helpers@1.5.3
  - @repo/logging@1.3.1
  - @repo/cftrace@1.0.7
  - @repo/otel@0.1.3

## 0.1.63

### Patch Changes

- d367b9e: chore: remove unused dependency
- Updated dependencies [734489f]
  - @repo/otel@0.1.3
  - @repo/hono-helpers@1.5.2

## 0.1.62

### Patch Changes

- Updated dependencies [9acbf33]
- Updated dependencies [a713a3d]
  - @repo/otel@0.1.2
  - @repo/cftrace@1.0.7
  - @repo/hono-helpers@1.5.1
  - @repo/logging@1.3.0

## 0.1.61

### Patch Changes

- e6c3b70: fix: Use @repo/otel to work around vitest issues
- dce1b58: chore: Add types to handler exports
- 4cbd0a9: chore: update deps
- 8d052d0: Enable Workers Logs
- Updated dependencies [221abd5]
- Updated dependencies [7dfb6e5]
- Updated dependencies [5418908]
- Updated dependencies [4204d1f]
- Updated dependencies [e6c3b70]
- Updated dependencies [02aab84]
- Updated dependencies [d3cebab]
- Updated dependencies [50833df]
- Updated dependencies [e06e18d]
- Updated dependencies [4cbd0a9]
- Updated dependencies [2771478]
  - @repo/hono-helpers@1.5.0
  - @repo/logging@1.3.0
  - @repo/otel@0.1.1
  - @repo/cftrace@1.0.7

## 0.1.60

### Patch Changes

- @repo/hono-helpers@1.4.14

## 0.1.59

### Patch Changes

- 4103fa9: chore: update deps
- Updated dependencies [96adb20]
- Updated dependencies [4103fa9]
  - @repo/hono-helpers@1.4.13
  - @repo/cftrace@1.0.6
  - @repo/logging@1.2.8

## 0.1.58

### Patch Changes

- 3b667fd: chore: bump wrangler compat date to 2024-09-02
- adfbd0c: chore: update deps
- Updated dependencies [adfbd0c]
  - @repo/hono-helpers@1.4.12
  - @repo/cftrace@1.0.6
  - @repo/logging@1.2.8

## 0.1.57

### Patch Changes

- 5fb9e2c: chore: remove version:packages script - this is done by changesets now
- Updated dependencies [5fb9e2c]
  - @repo/hono-helpers@1.4.11
  - @repo/cftrace@1.0.6
  - @repo/logging@1.2.8

## 0.1.56

### Patch Changes

- 9f2b7d3: Moved deploy commands to subcommands
- b1bcb71: Rename repoctl -> runx
- d7e2eff: chore: Use repoctl instead of run scripts
- 2deab61: chore: Move run-wrangler-build to runx build wrangler
- a5fc5db: Move sentry commands to subcommand of runx
  - @repo/cftrace@1.0.5
  - @repo/hono-helpers@1.4.10
  - @repo/logging@1.2.7

## 0.1.55

### Patch Changes

- 5b2763c: chore: update deps
- Updated dependencies [5b2763c]
  - @repo/hono-helpers@1.4.10
  - @repo/cftrace@1.0.5
  - @repo/logging@1.2.7

## 0.1.54

### Patch Changes

- fa9f80d: chore: update deps
- d0ae8b4: chore: update deps
- Updated dependencies [d0ae8b4]
  - @repo/hono-helpers@1.4.9
  - @repo/cftrace@1.0.5
  - @repo/logging@1.2.7

## 0.1.53

### Patch Changes

- 6a143a3: chore: update deps

## 0.1.52

### Patch Changes

- 32dd836: chore: update deps
- Updated dependencies [3dfc58b]
- Updated dependencies [32dd836]
  - @repo/hono-helpers@1.4.8

## 0.1.51

### Patch Changes

- 921a663: chore: update deps
- Updated dependencies [6c188e1]
- Updated dependencies [921a663]
  - @repo/hono-helpers@1.4.7
  - @repo/logging@1.2.7
  - @repo/cftrace@1.0.5

## 0.1.50

### Patch Changes

- 1a779ca: chore: update deps
- 6be804f: chore: update deps
- b46244d: chore: Format types the same way as other imports
- 077b89b: Update a few more tests and add checks to tools/bunapps
- bc5f76b: Add cache bust token to turbo-cache
- d453b33: Remove turbo cache buster token - decided I don't need it
- Updated dependencies [3c163e0]
- Updated dependencies [6be804f]
- Updated dependencies [b46244d]
- Updated dependencies [93eb7ad]
- Updated dependencies [077b89b]
- Updated dependencies [2b87afc]
- Updated dependencies [bc5f76b]
  - @repo/hono-helpers@1.4.6
  - @repo/logging@1.2.6
  - @repo/cftrace@1.0.5

## 0.1.49

### Patch Changes

- 0978fff: chore: update deps
  - @repo/hono-helpers@1.4.5

## 0.1.48

### Patch Changes

- @repo/cftrace@1.0.5
- @repo/hono-helpers@1.4.4
- @repo/logging@1.2.5

## 0.1.47

### Patch Changes

- dfb4390: chore: Improve import order
- 820fd18: chore: Use consistent type imports
- 4a3dd33: chore: update deps
- 9079cae: chore: format imports (types on bottom)
- Updated dependencies [dfb4390]
- Updated dependencies [820fd18]
- Updated dependencies [4a3dd33]
- Updated dependencies [9079cae]
  - @repo/hono-helpers@1.4.3
  - @repo/logging@1.2.5
  - @repo/cftrace@1.0.5

## 0.1.46

### Patch Changes

- 6f1c62c: chore: Formatting (imports + package.json order)
- Updated dependencies [a1f718a]
- Updated dependencies [6f1c62c]
  - @repo/hono-helpers@1.4.2
  - @repo/cftrace@1.0.5
  - @repo/logging@1.2.4

## 0.1.45

### Patch Changes

- cc0b3d5: fix: Revert hono to 4.4.13 due to breaking change with Variable types
- cf728a0: chore: update deps
- Updated dependencies [cc0b3d5]
- Updated dependencies [cf728a0]
  - @repo/hono-helpers@1.4.1
  - @repo/cftrace@1.0.4
  - @repo/logging@1.2.3

## 0.1.44

### Patch Changes

- Updated dependencies [8052d26]
- Updated dependencies [d9da386]
- Updated dependencies [8cd782c]
  - @repo/hono-helpers@1.4.0

## 0.1.43

### Patch Changes

- 5f8ad92: chore: update deps
- Updated dependencies [5f8ad92]
  - @repo/hono-helpers@1.3.1

## 0.1.42

### Patch Changes

- Updated dependencies [515d6c7]
  - @repo/hono-helpers@1.3.0
  - @repo/cftrace@1.0.4
  - @repo/logging@1.2.3

## 0.1.41

### Patch Changes

- e968389: chore: Remove unused script "clean"
- 2956fbe: chore: update deps (hono)
- Updated dependencies [2956fbe]
  - @repo/hono-helpers@1.2.4
  - @repo/cftrace@1.0.4
  - @repo/logging@1.2.3

## 0.1.40

### Patch Changes

- edab582: chore: bump deps
  - @repo/cftrace@1.0.4
  - @repo/hono-helpers@1.2.3
  - @repo/logging@1.2.3

## 0.1.39

### Patch Changes

- 195717b: chore: format files
  - @repo/cftrace@1.0.4
  - @repo/hono-helpers@1.2.3
  - @repo/logging@1.2.3

## 0.1.38

### Patch Changes

- a4a9a7b: chore: fix mismatched deps
- b50e27b: chore: Pin dependency versions
- ba64bba: chore: format package.json files for consistency

  Ran `npx syncpack format`

- 3dbb3d5: chore: Update deps using syncpack

  Ran `npx syncpack update` and `npx syncpack fix-missmatches`

- f7bac0a: chore: Fix missmatched package versions
- Updated dependencies [b50e27b]
- Updated dependencies [0f79366]
- Updated dependencies [ba64bba]
  - @repo/hono-helpers@1.2.3
  - @repo/cftrace@1.0.4
  - @repo/logging@1.2.3

## 0.1.37

### Patch Changes

- 22f121a: chore: update deps
- Updated dependencies [2e07f64]
- Updated dependencies [e9b33e0]
  - @repo/hono-helpers@1.2.2

## 0.1.36

### Patch Changes

- Updated dependencies [2bd6185]
- Updated dependencies [434bf73]
- Updated dependencies [cd1b112]
- Updated dependencies [1898de1]
  - @repo/hono-helpers@1.2.1
  - @repo/logging@1.2.2

## 0.1.35

### Patch Changes

- Updated dependencies [1dedd86]
- Updated dependencies [27610ea]
- Updated dependencies [fb97713]
- Updated dependencies [1bf3ab5]
- Updated dependencies [c611f8c]
- Updated dependencies [88b19ff]
- Updated dependencies [bf1d463]
- Updated dependencies [5f4a22f]
- Updated dependencies [cad3c18]
  - @repo/hono-helpers@1.2.0
  - @repo/logging@1.2.1

## 0.1.34

### Patch Changes

- 2636f8e: chore: update deps
- Updated dependencies [2636f8e]
  - @repo/hono-helpers@1.1.7

## 0.1.33

### Patch Changes

- cd3891d: chore: update deps
- 9a4c33d: chore: Remove 'schema' suffix from Zod types
- e895bd0: chore: Update deps
- Updated dependencies [cd3891d]
- Updated dependencies [e895bd0]
  - @repo/hono-helpers@1.1.6
  - @repo/cftrace@1.0.3
  - @repo/logging@1.2.0

## 0.1.32

### Patch Changes

- 7f0d79e: chore: update deps
- Updated dependencies [7f0d79e]
  - @repo/hono-helpers@1.1.5

## 0.1.31

### Patch Changes

- Updated dependencies [0cc7a8a]
- Updated dependencies [d155d65]
  - @repo/hono-helpers@1.1.4
  - @repo/logging@1.2.0
  - @repo/cftrace@1.0.3

## 0.1.30

### Patch Changes

- d63bfce: chore: update deps
- Updated dependencies [d63bfce]
- Updated dependencies [17242c2]
- Updated dependencies [40e623f]
  - @repo/hono-helpers@1.1.3
  - @repo/logging@1.1.0

## 0.1.29

### Patch Changes

- 469a23d: chore: Update deps
- a11ff82: chore: Update deps
- Updated dependencies [469a23d]
- Updated dependencies [a11ff82]
  - @repo/hono-helpers@1.1.2

## 0.1.28

### Patch Changes

- 0cff038: chore: Update deps
- Updated dependencies [0cff038]
  - @repo/hono-helpers@1.1.1

## 0.1.27

### Patch Changes

- Updated dependencies [c5e68f9]
  - @repo/hono-helpers@1.1.0

## 0.1.26

### Patch Changes

- 16f21bd: chore: Update deps
- Updated dependencies [16f21bd]
  - @repo/hono-helpers@1.0.9

## 0.1.25

### Patch Changes

- ace1c98: chore: Format files
  - @repo/cftrace@1.0.3
  - @repo/hono-helpers@1.0.8
  - @repo/logging@1.0.3

## 0.1.24

### Patch Changes

- 42caefc: chore(deps): Update deps

  - @cloudflare/vitest-pool-workers@0.2.3
  - @cloudflare/workers-types@4.20240423.0
  - hono@4.2.7
  - wrangler@3.52.0

- Updated dependencies [42caefc]
  - @repo/hono-helpers@1.0.8

## 0.1.23

### Patch Changes

- bedab76: chore: Update deps
- Updated dependencies [bedab76]
  - @repo/hono-helpers@1.0.7

## 0.1.22

### Patch Changes

- 4fadafc: chore: Bump compatibility date to 2024-04-03
- Updated dependencies [dc4a20c]
- Updated dependencies [fae250a]
  - @repo/hono-helpers@1.0.6
  - @repo/cftrace@1.0.3
  - @repo/logging@1.0.3

## 0.1.21

### Patch Changes

- Updated dependencies [1e3161f]
  - @repo/hono-helpers@1.0.5

## 0.1.20

### Patch Changes

- 181f4fe: chore: Update hono to 4.2.3
- Updated dependencies [181f4fe]
  - @repo/hono-helpers@1.0.4
