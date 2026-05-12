export function MapLegend() {
  return (
    <div className="absolute right-3 bottom-3 z-[500] rounded-md border border-slate-200 bg-white/95 p-3 text-xs text-slate-700 shadow-sm">
      <p className="font-semibold text-slate-900">창업 적합도</p>
      <div className="mt-2 grid gap-1">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-city-700" aria-hidden="true" /> 높음
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rail-500" aria-hidden="true" /> 보통
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-warning-600" aria-hidden="true" /> 주의
        </span>
      </div>
    </div>
  )
}
