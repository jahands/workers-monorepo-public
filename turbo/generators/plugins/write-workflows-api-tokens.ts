import { spawn } from 'child_process'

import { slugifyText } from './slugify'

import type { PlopTypes } from '@turbo/gen'
import type { Answers } from '../types'

const didSucceed = (code: number) => `${code}` === '0'

export function writeWorkflowsApiTokens(
	answers: Answers,
	_config: unknown,
	_plop: PlopTypes.NodePlopAPI
) {
	return new Promise((resolve, reject) => {
		const proc = spawn('pnpm', ['-F', `${slugifyText(answers.name)}`, 'write-api-tokens'], {
			cwd: answers.turbo.paths.root,
			stdio: 'inherit',
			shell: true,
		})

		proc.on('close', (code: number) => {
			if (didSucceed(code)) {
				resolve(`pnpm write-api-tokens ran correctly`)
			} else {
				reject(`pnpm write-api-tokens exited with ${code}`)
			}
		})
	})
}
