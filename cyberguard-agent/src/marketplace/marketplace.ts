import { findSkills, installSkill, type SkillInfo } from '../plugins/skillsDiscovery.js'

export interface MarketplaceItem {
  id: string
  name: string
  description: string
  type: 'skill' | 'plugin'
  author: string
  version: string
  downloads: number
  rating: number
  tags: string[]
  source: 'skills.sh' | 'github' | 'npm' | 'custom'
  installCommand: string
}

export async function searchMarketplace(query: string): Promise<MarketplaceItem[]> {
  const results: MarketplaceItem[] = []

  // Search skills.sh
  const skills = await findSkills(query)
  for (const skill of skills) {
    results.push({
      id: skill.name,
      name: skill.name,
      description: skill.description,
      type: 'skill',
      author: '',
      version: skill.version || 'latest',
      downloads: skill.installs,
      rating: 0,
      tags: [],
      source: 'skills.sh',
      installCommand: skill.name,
    })
  }

  return results
}

export async function installFromMarketplace(item: MarketplaceItem): Promise<boolean> {
  switch (item.source) {
    case 'skills.sh':
      return installSkill(item.installCommand)
    default:
      return false
  }
}
