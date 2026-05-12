import { Button } from '@/shared/components/Button'
import {
  scenarioOptions,
  type OpeningScenario,
  type ScenarioOption,
} from '@/shared/types/scenario'

type ScenarioSelectorProps = {
  value: OpeningScenario
  onChange: (value: OpeningScenario) => void
  options?: readonly ScenarioOption[]
}

export function ScenarioSelector({
  value,
  onChange,
  options = scenarioOptions,
}: ScenarioSelectorProps) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-semibold text-slate-800">개통 시나리오</legend>
      <div className="grid gap-2 md:grid-cols-3">
        {options.map((option) => (
          <Button
            key={option.id}
            aria-pressed={value === option.id}
            className="h-full items-start justify-start px-4 py-3 text-left"
            variant={value === option.id ? 'primary' : 'secondary'}
            onClick={() => onChange(option.id)}
          >
            <span>
              <span className="block text-sm">{option.label}</span>
              <span
                className={[
                  'mt-1 block text-xs font-medium',
                  value === option.id ? 'text-city-50' : 'text-slate-500',
                ].join(' ')}
              >
                {option.description}
              </span>
            </span>
          </Button>
        ))}
      </div>
    </fieldset>
  )
}
