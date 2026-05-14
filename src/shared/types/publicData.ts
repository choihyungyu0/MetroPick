export type PublicDataSourceType = 'open-api' | 'file-data' | 'platform' | 'manual'

export type PublicDataSource = {
  id: string
  name: string
  provider: string
  sourceType: PublicDataSourceType
  purpose: string
  plannedUsage: string[]
  status: 'planned' | 'mocked' | 'connected'
}
