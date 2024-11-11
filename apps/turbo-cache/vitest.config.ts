import { defineWorkersProject } from '@cloudflare/vitest-pool-workers/config'

import type { Bindings } from './src/types'

export default defineWorkersProject({
	test: {
		poolOptions: {
			workers: {
				wrangler: { configPath: `${__dirname}/wrangler.toml` },
				isolatedStorage: false,
				singleWorker: true,
				miniflare: {
					bindings: {
						ENVIRONMENT: 'VITEST',
						TURBO_TOKEN: 'wrkr_password',
						UPSTASH_REDIS_REST_TOKEN: 'srh_redis_token',
					} satisfies Partial<Bindings>,
				},
			},
		},
	},
})
