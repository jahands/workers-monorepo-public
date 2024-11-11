import { defineWorkspace } from 'vitest/config'
import { glob } from 'zx'

const projects = await glob([
	// All vitest projects
	'{apps,docker,packages}/*/vitest.config.ts',
])

const isolated: string[] = [
	// Some projects require running vitest separately for some reason
]

export default defineWorkspace([
	// Run all non-isolated projects together.
	...projects.filter((p) => !isolated.includes(p)),
])
