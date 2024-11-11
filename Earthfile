VERSION --raw-output 0.8
PROJECT jahands/docker

setup-workspace:
	FROM node:22-bookworm-slim
	WORKDIR /work
	RUN apt-get update \
		&& apt-get install -y curl jq git unzip \
		&& rm -rf /var/lib/apt/lists/*
	RUN curl -fsSL https://sh.uuid.rocks/install/mise | bash
	ENV PATH="$HOME/.local/share/mise/shims:$HOME/.local/bin:$PATH"
	COPY .mise.toml .
	RUN mise install --yes && mise reshim

setup-project:
	FROM +setup-workspace
	COPY --dir \
		apps \
		docker \
		packages \
		.

	COPY \
		.earthlyignore \
		.eslintrc.cjs \
		.gitignore \
		.npmrc \
		.prettierignore \
		.prettierrc.cjs \
		.sentryclirc \
		.syncpackrc.cjs \
		package.json \
		pnpm-lock.yaml \
		pnpm-workspace.yaml \
		tsconfig.json \
		turbo.json \
		vitest.workspace.ts \
		.

git-repo:
	FROM +setup-workspace
	COPY --dir .git .
	SAVE ARTIFACT .git

install-deps:
	FROM +setup-project
	CACHE /pnpm-store
	RUN pnpm config set store-dir /pnpm-store
	RUN pnpm install --frozen-lockfile --child-concurrency=10

test:
	FROM +install-deps
	LET TURBO_TEAM=team_jahands
	LET FORCE_COLOR=1
	LET DO_NOT_TRACK=1
	ARG GITHUB_ACTIONS
	LET TURBO_LOG_ORDER=grouped
	RUN --raw-output \
		--secret TURBO_TOKEN \
		--secret TURBO_API \
		--secret TURBO_REMOTE_CACHE_SIGNATURE_KEY \
		pnpm turbo check:ci --log-order=grouped

deploy-workers:
	FROM +test
	COPY --dir .git . # Used for Sentry release version
	LET TURBO_TEAM=team_jahands
	LET FORCE_COLOR=1
	LET DO_NOT_TRACK=1
	ARG GITHUB_ACTIONS
	LET TURBO_LOG_ORDER=grouped
	ARG APP_NAME='apps*/*'
	RUN --push \
		--raw-output \
		--secret CLOUDFLARE_API_TOKEN \
		--secret SENTRY_AUTH_TOKEN \
		--secret TURBO_TOKEN \
		--secret TURBO_API \
		--secret TURBO_REMOTE_CACHE_SIGNATURE_KEY \
		--secret AWS_ACCESS_KEY_ID \
		--secret AWS_SECRET_ACCESS_KEY \
		--secret CF_ACCESS_CLIENT_ID \
		--secret CF_ACCESS_CLIENT_SECRET \
		--secret ASTROBLOG_GHOST_API_URL \
		--secret ASTROBLOG_GHOST_CONTENT_API_KEY \
		pnpm turbo deploy --filter="./$APP_NAME"

build-workers:
	FROM +install-deps
	LET TURBO_TEAM=team_jahands
	LET FORCE_COLOR=1
	LET DO_NOT_TRACK=1
	ARG GITHUB_ACTIONS
	LET TURBO_LOG_ORDER=grouped
	RUN	--raw-output \
		--secret TURBO_TOKEN \
		--secret TURBO_API \
		--secret TURBO_REMOTE_CACHE_SIGNATURE_KEY \
		--secret CF_ACCESS_CLIENT_ID \
		--secret CF_ACCESS_CLIENT_SECRET \
		--secret ASTROBLOG_GHOST_API_URL \
		--secret ASTROBLOG_GHOST_CONTENT_API_KEY \
		pnpm turbo build:wrangler

deploy-astroblog:
	FROM +install-deps
	COPY --dir .git . # Used for Sentry release version
	LET FORCE_COLOR=1
	LET DO_NOT_TRACK=1
	ARG GITHUB_ACTIONS
	RUN --push \
		--raw-output \
		--secret CLOUDFLARE_API_TOKEN \
		--secret SENTRY_AUTH_TOKEN \
		--secret CF_ACCESS_CLIENT_ID \
		--secret CF_ACCESS_CLIENT_SECRET \
		--secret ASTROBLOG_GHOST_API_URL \
		--secret ASTROBLOG_GHOST_CONTENT_API_KEY \
		pnpm turbo deploy --filter="./apps/astroblog"

# ==================== #
# ======= all ======== #
# ==================== #
docker:
	BUILD --pass-args ./docker/debian+build
	BUILD --pass-args ./docker/rclone+build
	BUILD --pass-args ./docker/restic-backup+build
	BUILD --pass-args ./docker/caddy+build


build:
	BUILD +docker
	BUILD +build-workers

# Deploy all
deploy:
	BUILD +docker
	BUILD +deploy-workers
