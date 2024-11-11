import { z } from 'zod'

export type ValidatorPreset = keyof typeof presets
const presets = {
	stringMin1: z.string().min(1),

	durableObject: z.object({
		get: z.function(),
		idFromName: z.function(),
		idFromString: z.function(),
	}),

	r2Bucket: z.object({
		get: z.function(),
		put: z.function(),
		createMultipartUpload: z.function(),
	}),

	aiBinding: z.object({
		run: z.function(),
	}),

	kvNamespace: z.object({
		get: z.function(),
		put: z.function(),
		getWithMetadata: z.function(),
	}),

	/** E.g. https://discord.com/api/webhooks/1263133993239445616/CX0dUadR3lBy65Eg-XMGxYmgRQdAFJo8SR8234EU5FZ1U9FCWaWx7ZVSsC3EeZC2KXnB */
	discordWebhook: z
		.string()
		.regex(/^https:\/\/discord.com\/api\/webhooks\/[0-9]+\/[a-zA-Z0-9_-]+$/)
		.describe('discord webhook'),

	url: z.string().url(),
}

export type EnvValidator = [
	envVar: string | object,
	validator: z.ZodTypeAny | ValidatorPreset,
	description: string,
]

export function validateEnv(envValidators: EnvValidator[]): void {
	if (envValidators.length === 0) throw new Error('no validators provided')

	for (const [envVar, validator, description] of envValidators) {
		const validate = typeof validator === 'string' ? presets[validator] : validator
		validate.parse(envVar, { errorMap: () => ({ message: `invalid ${description}` }) })
	}
}
