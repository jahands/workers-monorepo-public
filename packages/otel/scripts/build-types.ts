import 'zx/globals'

import { inspect } from 'util'
import ts from 'typescript'

function buildDeclarationFiles(fileNames: string[], options: ts.CompilerOptions): void {
	options = {
		...options,
		declaration: true,
		emitDeclarationOnly: true,
		outDir: './dist/',
	}
	const program = ts.createProgram(fileNames, options)
	program.emit()
}

const config = ts.readConfigFile('./tsconfig.json', ts.sys.readFile)
if (config.error) throw new Error(`failed to read tsconfig: ${inspect(config)}`)

buildDeclarationFiles(['./src/index.ts'], config.config)

await fs.move('./dist/index.d.ts', './dist/index.d.mts')
