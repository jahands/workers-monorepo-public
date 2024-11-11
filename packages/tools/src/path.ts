import memoizeOne from 'memoize-one'
import { z } from 'zod'

export const getRepoRoot = memoizeOne(async () =>
	z
		.string()
		.trim()
		.startsWith('/')
		.parse(await $`git rev-parse --show-toplevel`.text())
)
