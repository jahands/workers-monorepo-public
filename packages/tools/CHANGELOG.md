# @repo/tools

## 0.10.0

### Minor Changes

- bf29dd3: feat: Add command to add @repo/ prefix to all apps/packages

  There's some weirdness with things like syncpack from not having this prefix so I'm finally fixing it.

### Patch Changes

- f309076: fix: remove unused imports and disable cmd

## 0.9.0

### Minor Changes

- 35edc3a: feat: Add command to run command in all packages with specified pattern

### Patch Changes

- a0d17bc: chore: update deps
- d204e73: chore: update deps

## 0.8.0

### Minor Changes

- 0fbc076: feat: Add script to write API tokens directly from 1Password

### Patch Changes

- 81a510e: fix: Add missing test scripts
- 192ee38: fix: only write secret if we successfully got the secret

## 0.7.6

### Patch Changes

- e8f5286: fix: pass in version via flag instead
- 4d5f2dd: fix: remove --bytecode
- 19530a8: fix: only use version if non empty string
- e8f30fe: Move bun compile to runx
- ebc59c7: fix: Only get version when NODE_ENV=production
- 22fe457: fix: don't allow empty version

## 0.7.5

### Patch Changes

- 8e5691a: chore: update deps

## 0.7.4

### Patch Changes

- 44174d4: Remove bun from dependencies to speed up pnpm install time

  I originally added bun as a dep here for "correctness", but it made pnpm install time go from 5 -> 15 seconds. We already have bun in `.mise.toml`, which is good enough for me.

- b939427: Ensure we're on the main branch before publishing images

## 0.7.3

### Patch Changes

- c0388aa: fix: Strip out unnecessary \_routes.json exclude for file that never gets uploaded
- 30ba765: Always minify workers even without output

## 0.7.2

### Patch Changes

- e694cf3: fix: Rename to --no-output to also disable output flags
- 25700ab: fix: Add option to skip cleaning dist

## 0.7.1

### Patch Changes

- 21f8e11: chore: update deps

## 0.7.0

### Minor Changes

- 90e37d2: refactor versioning scripts into multiple files

### Patch Changes

- d01c7bb: fix: update regex for new version format
- 5874b68: Add script to get docker version only if it's changed

## 0.6.8

### Patch Changes

- 21d05b6: fix: store prisma client cache in root node_modules
- 6bfe904: chore: fail eslint warnings in CI

## 0.6.7

### Patch Changes

- 8f6d118: Add run-vitest-ci with --silent flag for less messy logs
- a5d0577: fix: update test snapshots

## 0.6.6

### Patch Changes

- 9acbf33: chore: add Bun as dependency for relevant packages

## 0.6.5

### Patch Changes

- e06e18d: Use node md5 function
- 3c68c34: chore: Remove locking - doesn't seem to be needed
- e6c3b70: fix: Use @repo/otel to work around vitest issues
- fe67a43: fix race condition in getMD5OfDir
- bee28d8: chore: use fs.remove() instead of rm -rf
- 50833df: chore: update deps

## 0.6.4

### Patch Changes

- 8750a04: chore: Add missing quotes in script
- 4103fa9: chore: update deps
- f05748a: use more appropriate name for fn

## 0.6.3

### Patch Changes

- adfbd0c: chore: update deps

## 0.6.2

### Patch Changes

- 622abb1: Clean up scripts

## 0.6.1

### Patch Changes

- d571312: Always skip if it's already generated
- ce12f2b: Ensure Prisma client is only generated when it needs to
- ce12f2b: fix: Increase testTimeout
- f0e5da3: chore: fix formatting

## 0.6.0

### Minor Changes

- 01c3253: feat: Converted scripts to a proper cli (repoctl)
- 756b09a: feat: Add package-specific commands for wci-tracker

### Patch Changes

- 9f2b7d3: Moved deploy commands to subcommands
- 6a3ec20: Add prisma generate command
- 99e302b: fix: Add postinstall script to generate prisma client
- 66c1566: fix: Add separate command to generate prisma client
- bda967c: Add --org to other sentry cmds
- 5306385: Add support to run runx via tsx when bun is not available
- 6b961af: Refactor lib into multiple files
- af9fcf4: Check for GITHUB_ACTIONS instead of CI
- a4d69bb: Always build prisma client before running tests and fix db query
- b1bcb71: Rename repoctl -> runx
- e120505: fix: only check for changes in wci-tracker
- d7e2eff: chore: Use repoctl instead of run scripts
- 2deab61: chore: Move run-wrangler-build to runx build wrangler
- c17699d: Move org option to parent cmd
- 5ae2d3b: switch vitest back to pnpm
- 4553264: Stop importing globals everywhere
- 190dd5f: Only generate prisma client once in CI
- 1df2f66: fix: Remove git requirement for postinstall script
- b51222b: Switch to bun for tests
- a5fc5db: Move sentry commands to subcommand of runx
- 269d3d5: Add option to specify org

## 0.5.6

### Patch Changes

- 276abef: Stop using pnpm exec (no need to use exec)

## 0.5.5

### Patch Changes

- fa9f80d: chore: update deps
- d0ae8b4: chore: update deps

## 0.5.4

### Patch Changes

- 49fe81e: Remove duplicate $.verbose call

## 0.5.3

### Patch Changes

- 8ac5a89: Move verbose after lock.acquire() to quiet things down
- ef74bb4: Use $.verbose instead of piping to stdout manually
- 07fb88c: Disable concurrency lock to see if we really need it

## 0.5.2

### Patch Changes

- 9cdcf71: chore: Remove unused var

## 0.5.1

### Patch Changes

- 060efcc: Simplify run-update-deps script by always updating all deps

  Now that I use syncpack, it's easier to always check all packages for updates.

- f9acf58: Rename run-tool-script -> run-ts-script
- 077b89b: Update a few more tests and add checks to tools/bunapps
- b9edbf6: Use single quotes in .mise.toml
- 3df7f73: Don't run pnpm install after updating pnpm + update pnpm
- 7a8e44d: fix: Remove hashbang from .ts script
- 91e196b: chore: remove test mode from update-pnpm.ts
- df0c6e5: fix: Don't emit js files when running tsc
- 62a8f91: Make grep quiet and add missing quotes to path

## 0.5.0

### Minor Changes

- 3cfc1c4: Move TypeScript run scripts to .ts files and add eslint

  This feels a lot more realistic for how we'd do it at work, so I wanted to change it here as well. This also allows us to swap bun for tsx easily (which is how we'd do it at work.)

### Patch Changes

- 2835f64: Resolve script path for easier to read not found errors
- 2f7ebf5: Add run-tool-script helper for running ts scripts consistently
- b48e915: chore: Rename FIX env var to FIX_ESLINT
- c35e0c3: chore: fix formatting / lint issues
- 89bcfdb: Lint files based on eslint config rather than passing globs via cli
- c5384e2: Only run fix if deps were actually updated

## 0.4.5

### Patch Changes

- 4575605: fix: Don't error script when there's no package.json changes
- 2f23db7: choe: update deps + fix pnpm install condition
- 3796221: Simplify run-changeset-new command

## 0.4.4

### Patch Changes

- 194b07f: fix: Move logs to node_modules/.cache/logs

## 0.4.3

### Patch Changes

- e2db334: fix: Add default so we don't need +u
- 791d367: fix: inverse condition for fix check
- f63f7ac: fix: Retry Pages deployments to prevent release failures
- c3d4499: fix: Passthrough params to script
- a184e58: Move fix:deps to script file
- 33e8cc7: Update script to show tsx example (for easier copying at work later)

## 0.4.2

### Patch Changes

- dfb4390: chore: Improve import order
- 9079cae: chore: format imports (types on bottom)
- 2b7bf0b: Add "FIX" env to fix lint issues
- f5bc5b1: fix: Ignore unbound variable rathr than errors

## 0.4.1

### Patch Changes

- c527849: fix: Use bash instead of sh
- b29c6c3: feat: Allow passing in additional args to eslint commands
- a1f718a: chore: Consolidate eslint configs and improve workers config
- 6f1c62c: chore: Formatting (imports + package.json order)

## 0.4.0

### Minor Changes

- dc610a0: feat: Add script to update pnpm
- 754e911: feat: Add script + task to quickly create a changeset + commit

## 0.3.8

### Patch Changes

- 377d0fb: fix: Sometimes version hash is 8 characters

## 0.3.7

### Patch Changes

- dc0057b: fix: only count files

## 0.3.6

### Patch Changes

- de11db4: Use zx retry() instead of pRetry to make it a bit more compact

## 0.3.5

### Patch Changes

- 7b461c8: Add logging when command is retried

## 0.3.4

### Patch Changes

- fcabc46: fix: Add retries to improve reliability

## 0.3.3

### Patch Changes

- 39f6f81: Add --all flag to run-update-deps

## 0.3.2

### Patch Changes

- 1b20242: chore: Revert concurrency to 4 because it didn't work
- 49b58b7: fix: Only update dev/prod deps

## 0.3.1

### Patch Changes

- b1a8832: fix: reduce sourcemap concurrency due to error
- 72ba7cb: fix: Use separate concurrency limits across commands

## 0.3.0

### Minor Changes

- 542669b: feat: Only run one instance of sentry commits / finalize

  This should help reduce errors caused by running many instances of these commands. We should only need one anyway.

### Patch Changes

- 5ea436c: fix: revert adding tsconfig / eslint configs due to cyclic dependency
- c93d717: fix: Limit concurrency of run-sentry-sourcemaps

  This will hopefully prevent errors we've been seeing with Sentry.

- 97df00c: chore: Move concurrency logic to shared lib
- 31f58c6: chore: Limit concurrency of finalize as well
- c46e966: chore: Inline tsconfig in tools
- 2d2b26b: fix: always wait for commits to be done before returning
- fb3e3eb: fix: Limit concurrency of run-sentry-commits instead of only running once
- 243cd7f: fix: Use absolute path to lockfiles
- c3a0636: Remove locks in run-sentry-finalize - we need to finalize for each project
- 43bbe2a: chore: formatting
- e4ef1be: fix: trim output of get-version
- 17bfed3: chore: Limit concurrency of wrangler deploys
- 3f1bd5d: fix: Make losers for sentry commits to finish before returning
- 0b77b7c: chore: Add tsconfig and eslint configs
- 75bac49: fix: remove invalid flag form sentry finalize cmd

## 0.2.3

### Patch Changes

- a4a9a7b: chore: fix mismatched deps
- 0f79366: chore: Only allow patches in deps and pin some packages
- ba64bba: chore: format package.json files for consistency

  Ran `npx syncpack format`

## 0.2.2

### Patch Changes

- 27f915a: feat: Add bunapps/geoboxctl for setting up new machines

  Also added --GITHUB_ACTIONS flag to Earthfile to remove GHA output when run locally.

- 9d5d711: chore: Add zod and @hono/zod-validator to auto-updated deps
- e895bd0: chore: Update deps

## 0.2.1

### Patch Changes

- 0cc7a8a: chore: Switch to JRPC for AllergyDO
