# workflows-example

Build with Workflows!

## Structure

- `src/workflows/my-workflow` - Initial Workflow in the Worker. Can add multiple!

## Setup

After creating a Worker from this template, be sure to do the following steps:

1. Change route in `wrangler.toml` if needed (defaults to `workflows-example.workflows.uuid.rocks`)
2. Add domain to the Worker in the Cloudflare dashboard
3. Consider adding dedicated api token in `workflows-helpers/src/auth.ts`
