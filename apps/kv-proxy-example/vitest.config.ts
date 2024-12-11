import { defineWorkersProject } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersProject({
	test: {
		poolOptions: {
			workers: {
				wrangler: { configPath: `${__dirname}/wrangler.toml` },
				miniflare: {
					bindings: {
						ENVIRONMENT: 'VITEST',
						API_KEY: 'password',
					},
				},
			},
		},
	},
})