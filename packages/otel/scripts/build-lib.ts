import * as esbuild from 'esbuild'

await esbuild.build({
	entryPoints: [`./src/index.ts`],
	outdir: './dist/',
	logLevel: 'warning',
	outExtension: {
		'.js': '.mjs',
	},
	target: 'es2022',
	bundle: true,
	format: 'esm',
	sourcemap: 'both',
	treeShaking: true,
	external: ['node:events', 'node:async_hooks', 'node:buffer'],
})
