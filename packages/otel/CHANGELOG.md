# @repo/otel

## 0.1.11

### Patch Changes

- d204e73: fix: Make it private
- d204e73: chore: update deps

## 0.1.10

### Patch Changes

- bd875c8: chore: update deps
- 8d26c04: chore: add sourcemaps

## 0.1.9

### Patch Changes

- 1831e2e: chore: update deps

## 0.1.8

### Patch Changes

- 8e5691a: chore: update deps

## 0.1.7

### Patch Changes

- 44174d4: Remove bun from dependencies to speed up pnpm install time

  I originally added bun as a dep here for "correctness", but it made pnpm install time go from 5 -> 15 seconds. We already have bun in `.mise.toml`, which is good enough for me.

## 0.1.6

### Patch Changes

- 21f8e11: chore: update deps

## 0.1.5

### Patch Changes

- a2a60ef: chore: update readme

## 0.1.4

### Patch Changes

- 3be161d: chore: update deps

## 0.1.3

### Patch Changes

- 734489f: Improve function name

## 0.1.2

### Patch Changes

- 9acbf33: chore: add Bun as dependency for relevant packages
- a713a3d: Disable platform as it doesn't seem to be needed

## 0.1.1

### Patch Changes

- 5418908: feat: Add @repo/otel to work around issues with otel lib
- 4204d1f: chore: Remove unused tests
