import { Button } from '@/shared/components/Button'
import { radiusLabels, radiusSchema, type RadiusOption } from '@/shared/types/scenario'

type RadiusFilterProps = {
  value: RadiusOption
  onChange: (value: RadiusOption) => void
}

export function RadiusFilter({ value, onChange }: RadiusFilterProps) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold text-slate-800">분석 반경</legend>
      <div className="grid grid-cols-3 gap-2">
        {radiusSchema.options.map((radius) => (
          <Button
            key={radius}
            aria-pressed={value === radius}
            className="px-3"
            variant={value === radius ? 'primary' : 'secondary'}
            onClick={() => onChange(radius)}
          >
            {radiusLabels[radius]}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}
