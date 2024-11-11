# @repo/docker-debian

## 0.3.0

### Minor Changes

- 1275b70: feat: Add wcurl to debian-12-slim

## 0.2.1

### Patch Changes

- f9e2857: Try not passing args when getting version to cut down on duplicate project setup

  I'm pretty sure nothing bad will happen when we don't pass args here. Passing args makes us re-process setup-project target for every docker container which seems excessive.

- d9bfc39: Move +version to docker/common to prevent passing package arg to +setup-project

  We were still duplicating most layers because once you pass args to one target in a file, it passes args to all other targets. Creating a separate package purely to prevent passing args feels like a bit of a hack, but I think I'm ok with it. Might be useful for other things in the future to have docker/common anyway.

## 0.2.0

### Minor Changes

- 7c8f632: feat: Add latest tag for an easy to use default

## 0.1.6

### Patch Changes

- 0369bd4: chore: add readme's

## 0.1.5

### Patch Changes

- a2d55f6: Disable nightly images by default to speed up build
- 773588a: Add nightly docker release
- e1bf915: fix: use valid tag format

## 0.1.4

### Patch Changes

- f6e458d: fix: set latest to same docker ref

## 0.1.3

### Patch Changes

- b2e9caf: fix: make docker images private in package.json

## 0.1.2

### Patch Changes

- ebce072: Improve docker tag format
- f771965: Move version to separate target for easier reusability

## 0.1.1

### Patch Changes

- add8d38: feat: Add docker images from apps-monorepo
- 6bc1244: Use new base image and other minor fixes
- d1e2b1f: fix: disable auto-skip due to issues and enable raw output in all Earthfiles
- 92aa421: fix: stop preferencing Earthfiles inside node_modules - it did not go well
