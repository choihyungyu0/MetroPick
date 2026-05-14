export type BusinessTypeId =
  | 'cafe-dessert'
  | 'restaurant'
  | 'convenience-store'
  | 'pharmacy'
  | 'beauty-salon'
  | 'academy'
  | 'health-beauty'
  | 'life-service'
  | 'retail'

export type BusinessType = {
  id: BusinessTypeId
  label: string
  category: string
  description: string
}
