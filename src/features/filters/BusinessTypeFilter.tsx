import {
  businessTypeLabels,
  businessTypeSchema,
  type BusinessType,
} from '@/shared/types/station'

type BusinessTypeFilterProps = {
  value: BusinessType
  onChange: (value: BusinessType) => void
}

export function BusinessTypeFilter({ value, onChange }: BusinessTypeFilterProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-800">
      업종
      <select
        className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-city-500 focus:ring-2 focus:ring-city-500 focus:outline-none"
        value={value}
        onChange={(event) => onChange(businessTypeSchema.parse(event.target.value))}
      >
        {businessTypeSchema.options.map((businessType) => (
          <option key={businessType} value={businessType}>
            {businessTypeLabels[businessType]}
          </option>
        ))}
      </select>
    </label>
  )
}
