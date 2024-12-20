import { describe, expect, it } from 'vitest'

import { cmdExists, getMD5OfDir, getMD5OfFile, getMD5OfString } from './wci'

describe('cmdExists', () => {
	it('returns true if command exists', async () => {
		expect(await cmdExists('pnpm')).toBe(true)
	})

	it('returns false if command does not exist', async () => {
		expect(await cmdExists('sdfdsfsddsfsdf')).toBe(false)
	})
})

const fixtureDir = `${__dirname}/../../../src/test/fixtures`

describe('getMD5OfString()', () => {
	it('returns the md5 of a string', async () => {
		expect(await getMD5OfString('hello world!')).toMatchInlineSnapshot(
			`"fc3ff98e8c6a0d3087d515c0473f8677"`
		)
	})
})

describe('getMD5OfDir()', () => {
	it('returns the md5 of a directory', async () => {
		expect(await getMD5OfDir(`${fixtureDir}/dir-of-files`)).toMatchInlineSnapshot(
			`"d6b441411dbef1d4999fdc4fbdbc7828"`
		)
	})
})

describe('getMD5OfFile', async () => {
	it('returns the md5 of a file', async () => {
		expect(await getMD5OfFile(`${fixtureDir}/dir-of-files/a.txt`)).toMatchInlineSnapshot(
			`"3b5d5c3712955042212316173ccf37be"`
		)
	})
})
