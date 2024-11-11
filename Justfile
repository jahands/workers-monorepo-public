set shell := ["zsh", "-c"]

[private]
@help:
  just --list

# Create changeset
@cs:
  bunx changeset

# TODO: Move jctl from my dotfiles to packages/tools

# Fix deps, lint, format, etc.
@fix *flags:
  jctl repo workers fix {{flags}}

# Run test cli
[no-cd]
@test *flags:
  jctl repo workers test {{flags}}

# Run tests for all packages
test-all *flags:
  turbo test:ci --log-order=grouped {{flags}}

build *flags:
  turbo build {{flags}}
# Check for issues with deps/lint/types/format
[no-cd]
@check *flags:
  jctl repo workers check {{flags}}

# Update things in the repo
@update *flags:
  jctl repo workers update {{flags}}
alias up := update

# Create a new Worker
@new-worker:
  bun turbo generate new-worker
alias new := new-worker
