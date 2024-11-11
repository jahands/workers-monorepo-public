# @repo/docker-restic-backup

## 0.2.4

### Patch Changes

- 50d98a8: chore: disable restic-backup nightly

## 0.2.3

### Patch Changes

- 324064c: Update log_output logic to maybe work

## 0.2.2

### Patch Changes

- f9e2857: Try not passing args when getting version to cut down on duplicate project setup

  I'm pretty sure nothing bad will happen when we don't pass args here. Passing args makes us re-process setup-project target for every docker container which seems excessive.

- 0b0895d: fix: Default to logging prefix on backup as well
- d9bfc39: Move +version to docker/common to prevent passing package arg to +setup-project

  We were still duplicating most layers because once you pass args to one target in a file, it passes args to all other targets. Creating a separate package purely to prevent passing args feels like a bit of a hack, but I think I'm ok with it. Might be useful for other things in the future to have docker/common anyway.

## 0.2.1

### Patch Changes

- e49a2e4: chore: update readme

## 0.2.0

### Minor Changes

- ff2f691: feat: Add Sentry cron monitoring support

### Patch Changes

- 571f73e: Use snake_case instead of camelCase in scripts for consistency

  - seems like this makes it harder to mess up var names
  - i like it better tbh
  - it was bothering me

## 0.1.4

### Patch Changes

- 98cbdd1: fix: use correct backup script path

## 0.1.3

### Patch Changes

- 5708e85: fix docker tag being used as part of repo name

## 0.1.2

### Patch Changes

- 4652e21: chore: update readme
- fc79664: fix: formatting

## 0.1.1

### Patch Changes

- 1d93e9d: feat: Add restic-backup container

  - Timezone is now defaulted to CST
  - LOG_RESTIC_OUTPUT is now opt-out since I always use it

- 6efc2ed: fix: Remove unused Dockerfile and fix formatting
