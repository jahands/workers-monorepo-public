# Workers Monorepo

This is a sample of my personal monorepo that contains 40+ Cloudflare Workers.

- Uses Turborepo for running tasks across packages.
- Uses GitHub Actions + Earthly for CI/CD

## Usage

Install dependencies:

```shell
pnpm install
```

Generate a new Worker:

```shell
pnpm wrangler login # required to check if Worker already exists on your account
pnpm turbo gen
```

If you want to skip the duplicate Worker check, run this instead:

```shell
ALLOW_DUPES=1 pnpm turbo gen
```
