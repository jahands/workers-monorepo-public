import { z } from 'zod'

import { workflowsKV } from '@repo/workflows-helpers/kv'

type NotionDBIcons = z.infer<typeof NotionDBIcons>
const NotionDBIcons = z.object({
	name: z.string(),
	dbs: z.string().array().describe('database UUIDs'),
	iconsListPath: z.string().describe('path in KV for icons list'),
})
export const IconsList = z.array(z.string().url())

const kvPath = workflowsKV('Notion_AddPageIcon')

export const mcIconsPath = kvPath('icons/notion/minecraft/iconslist.json')
export const notionDBIcons: NotionDBIcons[] = [
	{
		name: 'Minecraft',
		dbs: [
			'e68fc1b2c26c461bbb1aff800e78e5fc', // Minecraft: Task List
			'e6c40e45941642aabccf20e7b910afec', // Minecraft: Task Screenshots
			'a8792b3b732d4181a2984570cb32ea3e', // Minecraft: All Screenshots (MC)
			'a95dc3ff51e545baae17d39c35be8d23', // Minecraft: ATM8: AE2 P2P Tunnels
			'5e1405c94f5f4a57af160a5cefa1a717', // Minecraft: ATM8: AE2 P2P Endpoints
		],
		iconsListPath: mcIconsPath,
	},
]

export function getIconsListPath(dbID: string): string | null {
	const icons = notionDBIcons.find((n) => n.dbs.includes(dbID))
	if (!icons) {
		return null
	}
	return icons.iconsListPath
}
