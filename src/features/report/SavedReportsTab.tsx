import { useMemo, useReducer } from 'react'
import { Download, Edit3, Eye, Save, Search, X } from 'lucide-react'

import { mockEditableSavedReports } from './savedReportsMockData'

type SortKey = 'businessType' | 'createdAt' | 'recommendationScore' | 'stationArea'
type SortDirection = 'asc' | 'desc'

export type EditableSavedReport = {
  businessType: string
  createdAt: string
  description: string
  id: string
  recommendationScore?: number
  stationArea: string
  tags: string[]
  title: string
}

type ReportDraft = {
  description: string
  tagsText: string
}

type SavedReportsState = {
  drafts: Record<string, ReportDraft>
  editingReportId: string | null
  reports: EditableSavedReport[]
  searchQuery: string
  sortDirection: SortDirection
  sortKey: SortKey
}

type SavedReportsAction =
  | { reportId: string; type: 'cancelEdit' }
  | { reportId: string; type: 'saveEdit' }
  | { reportId: string; type: 'startEdit' }
  | { reportId: string; type: 'updateDescription'; value: string }
  | { reportId: string; type: 'updateTags'; value: string }
  | { type: 'setSearchQuery'; value: string }
  | { type: 'setSortDirection'; value: SortDirection }
  | { type: 'setSortKey'; value: SortKey }

const initialState: SavedReportsState = {
  drafts: {},
  editingReportId: null,
  reports: mockEditableSavedReports,
  searchQuery: '',
  sortDirection: 'desc',
  sortKey: 'createdAt',
}

function createDraft(report: EditableSavedReport): ReportDraft {
  return {
    description: report.description,
    tagsText: report.tags.join(', '),
  }
}

function getDraftFallback(
  state: SavedReportsState,
  reportId: string,
): ReportDraft {
  const report = state.reports.find((item) => item.id === reportId)
  if (report) {
    return createDraft(report)
  }

  return {
    description: '',
    tagsText: '',
  }
}

function normalizeTags(tagsText: string): string[] {
  return tagsText
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function savedReportsReducer(
  state: SavedReportsState,
  action: SavedReportsAction,
): SavedReportsState {
  switch (action.type) {
    case 'cancelEdit': {
      const nextDrafts = { ...state.drafts }
      delete nextDrafts[action.reportId]

      return {
        ...state,
        drafts: nextDrafts,
        editingReportId:
          state.editingReportId === action.reportId ? null : state.editingReportId,
      }
    }
    case 'saveEdit': {
      const draft = state.drafts[action.reportId]
      if (!draft) {
        return state
      }

      const nextDrafts = { ...state.drafts }
      delete nextDrafts[action.reportId]

      return {
        ...state,
        drafts: nextDrafts,
        editingReportId: null,
        reports: state.reports.map((report) =>
          report.id === action.reportId
            ? {
                ...report,
                description: draft.description.trim(),
                tags: normalizeTags(draft.tagsText),
              }
            : report,
        ),
      }
    }
    case 'setSearchQuery':
      return {
        ...state,
        searchQuery: action.value,
      }
    case 'setSortDirection':
      return {
        ...state,
        sortDirection: action.value,
      }
    case 'setSortKey':
      return {
        ...state,
        sortKey: action.value,
      }
    case 'startEdit': {
      const report = state.reports.find((item) => item.id === action.reportId)
      if (!report) {
        return state
      }

      return {
        ...state,
        drafts: {
          ...state.drafts,
          [action.reportId]: createDraft(report),
        },
        editingReportId: action.reportId,
      }
    }
    case 'updateDescription':
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [action.reportId]: {
            ...(state.drafts[action.reportId] ?? getDraftFallback(state, action.reportId)),
            description: action.value,
          },
        },
      }
    case 'updateTags':
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [action.reportId]: {
            ...(state.drafts[action.reportId] ?? getDraftFallback(state, action.reportId)),
            tagsText: action.value,
          },
        },
      }
    default:
      return state
  }
}

function matchesSearch(report: EditableSavedReport, query: string): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR')
  if (!normalizedQuery) {
    return true
  }

  return [
    report.title,
    report.stationArea,
    report.businessType,
    report.description,
    ...report.tags,
  ].some((value) => value.toLocaleLowerCase('ko-KR').includes(normalizedQuery))
}

function compareReports(
  first: EditableSavedReport,
  second: EditableSavedReport,
  sortKey: SortKey,
): number {
  if (sortKey === 'createdAt') {
    return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
  }

  if (sortKey === 'recommendationScore') {
    return (first.recommendationScore ?? -1) - (second.recommendationScore ?? -1)
  }

  return first[sortKey].localeCompare(second[sortKey], 'ko-KR')
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export function SearchControls({
  onSearchChange,
  searchQuery,
}: {
  onSearchChange: (value: string) => void
  searchQuery: string
}) {
  return (
    <label className="flex h-10 min-w-[260px] items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 max-sm:min-w-0">
      <Search aria-hidden="true" className="text-slate-400" size={16} />
      <input
        className="w-full border-none bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="리포트 제목, 역세권, 업종, 태그 검색"
        value={searchQuery}
      />
    </label>
  )
}

export function SortControls({
  onDirectionChange,
  onSortKeyChange,
  sortDirection,
  sortKey,
}: {
  onDirectionChange: (value: SortDirection) => void
  onSortKeyChange: (value: SortKey) => void
  sortDirection: SortDirection
  sortKey: SortKey
}) {
  return (
    <div className="flex items-center gap-2 max-sm:flex-col max-sm:items-stretch">
      <label className="sr-only" htmlFor="saved-report-sort-key">
        정렬 기준
      </label>
      <select
        className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-black text-slate-700"
        id="saved-report-sort-key"
        onChange={(event) => onSortKeyChange(event.target.value as SortKey)}
        value={sortKey}
      >
        <option value="createdAt">생성일</option>
        <option value="stationArea">역세권</option>
        <option value="businessType">업종</option>
        <option value="recommendationScore">추천 점수</option>
      </select>

      <label className="sr-only" htmlFor="saved-report-sort-direction">
        정렬 순서
      </label>
      <select
        className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-black text-slate-700"
        id="saved-report-sort-direction"
        onChange={(event) => onDirectionChange(event.target.value as SortDirection)}
        value={sortDirection}
      >
        <option value="desc">내림차순</option>
        <option value="asc">오름차순</option>
      </select>
    </div>
  )
}

export function ReportItem({
  draft,
  isEditing,
  onCancelEdit,
  onDescriptionChange,
  onDownload,
  onSaveEdit,
  onStartEdit,
  onTagsChange,
  onView,
  report,
}: {
  draft?: ReportDraft
  isEditing: boolean
  onCancelEdit: () => void
  onDescriptionChange: (value: string) => void
  onDownload: () => void
  onSaveEdit: () => void
  onStartEdit: () => void
  onTagsChange: (value: string) => void
  onView: () => void
  report: EditableSavedReport
}) {
  return (
    <article className="grid gap-4 rounded-[13px] border border-blue-100 bg-white px-4 py-4 shadow-[0_8px_22px_rgba(20,55,90,0.04)]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 max-md:grid-cols-1">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-[17px] font-black text-slate-900">
              {report.title}
            </h3>
            {typeof report.recommendationScore === 'number' ? (
              <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-600">
                추천 {report.recommendationScore}
              </span>
            ) : null}
          </div>

          <dl className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-slate-500">
            <div className="flex gap-1">
              <dt>역세권</dt>
              <dd className="m-0 text-slate-900">{report.stationArea}</dd>
            </div>
            <div className="flex gap-1">
              <dt>업종</dt>
              <dd className="m-0 text-slate-900">{report.businessType}</dd>
            </div>
            <div className="flex gap-1">
              <dt>생성일</dt>
              <dd className="m-0 text-slate-900">{formatDate(report.createdAt)}</dd>
            </div>
          </dl>
        </div>

        <div className="flex items-start justify-end gap-2 max-md:justify-start max-sm:flex-wrap">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 max-sm:flex-1 max-sm:justify-center"
            onClick={onView}
            type="button"
          >
            <Eye aria-hidden="true" size={16} />
            보기
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 max-sm:flex-1 max-sm:justify-center"
            onClick={onDownload}
            type="button"
          >
            <Download aria-hidden="true" size={16} />
            다운로드
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="grid gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
          <label className="grid gap-1.5">
            <span className="text-xs font-black text-slate-700">설명</span>
            <textarea
              className="min-h-[82px] resize-y rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-500"
              onChange={(event) => onDescriptionChange(event.target.value)}
              value={draft?.description ?? report.description}
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-black text-slate-700">
              태그, 쉼표로 구분
            </span>
            <input
              className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500"
              onChange={(event) => onTagsChange(event.target.value)}
              value={draft?.tagsText ?? report.tags.join(', ')}
            />
          </label>

          <div className="flex justify-end gap-2">
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700"
              onClick={onCancelEdit}
              type="button"
            >
              <X aria-hidden="true" size={15} />
              취소
            </button>
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-black text-white"
              onClick={onSaveEdit}
              type="button"
            >
              <Save aria-hidden="true" size={15} />
              저장
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          <p className="m-0 text-sm leading-relaxed font-bold text-slate-500">
            {report.description}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {report.tags.map((tag) => (
              <span
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600"
                key={tag}
              >
                #{tag}
              </span>
            ))}
            <button
              className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-blue-100 bg-white px-3 text-xs font-black text-blue-600 max-sm:ml-0"
              onClick={onStartEdit}
              type="button"
            >
              <Edit3 aria-hidden="true" size={14} />
              설명·태그 편집
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

export function ReportList({
  drafts,
  editingReportId,
  onCancelEdit,
  onDescriptionChange,
  onDownloadReport,
  onSaveEdit,
  onStartEdit,
  onTagsChange,
  onViewReport,
  reports,
}: {
  drafts: Record<string, ReportDraft>
  editingReportId: string | null
  onCancelEdit: (reportId: string) => void
  onDescriptionChange: (reportId: string, value: string) => void
  onDownloadReport: (report: EditableSavedReport) => void
  onSaveEdit: (reportId: string) => void
  onStartEdit: (reportId: string) => void
  onTagsChange: (reportId: string, value: string) => void
  onViewReport: (report: EditableSavedReport) => void
  reports: EditableSavedReport[]
}) {
  if (reports.length === 0) {
    return (
      <div className="grid min-h-[260px] place-items-center rounded-xl border border-dashed border-blue-100 bg-slate-50 text-sm font-black text-slate-500">
        검색 조건에 맞는 리포트가 없습니다.
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {reports.map((report) => (
        <ReportItem
          draft={drafts[report.id]}
          isEditing={editingReportId === report.id}
          key={report.id}
          onCancelEdit={() => onCancelEdit(report.id)}
          onDescriptionChange={(value) => onDescriptionChange(report.id, value)}
          onDownload={() => onDownloadReport(report)}
          onSaveEdit={() => onSaveEdit(report.id)}
          onStartEdit={() => onStartEdit(report.id)}
          onTagsChange={(value) => onTagsChange(report.id, value)}
          onView={() => onViewReport(report)}
          report={report}
        />
      ))}
    </div>
  )
}

export function SavedReportsTab({
  initialReports = mockEditableSavedReports,
  onDownloadReport,
  onViewReport,
}: {
  initialReports?: EditableSavedReport[]
  onDownloadReport?: (report: EditableSavedReport) => void
  onViewReport?: (report: EditableSavedReport) => void
}) {
  // The reducer owns the list, current edit draft, sort state, and search query.
  const [state, dispatch] = useReducer(savedReportsReducer, {
    ...initialState,
    reports: initialReports,
  })

  const visibleReports = useMemo(() => {
    const directionMultiplier = state.sortDirection === 'asc' ? 1 : -1

    return state.reports
      .filter((report) => matchesSearch(report, state.searchQuery))
      .sort(
        (first, second) =>
          compareReports(first, second, state.sortKey) * directionMultiplier,
      )
  }, [state.reports, state.searchQuery, state.sortDirection, state.sortKey])

  const handleViewReport = (report: EditableSavedReport) => {
    onViewReport?.(report)
  }

  const handleDownloadReport = (report: EditableSavedReport) => {
    onDownloadReport?.(report)
  }

  return (
    <section className="grid gap-4 px-5 py-4">
      <div className="flex items-center justify-between gap-4 max-xl:flex-col max-xl:items-stretch">
        <SearchControls
          onSearchChange={(value) =>
            dispatch({ type: 'setSearchQuery', value })
          }
          searchQuery={state.searchQuery}
        />
        <SortControls
          onDirectionChange={(value) =>
            dispatch({ type: 'setSortDirection', value })
          }
          onSortKeyChange={(value) => dispatch({ type: 'setSortKey', value })}
          sortDirection={state.sortDirection}
          sortKey={state.sortKey}
        />
      </div>

      <ReportList
        drafts={state.drafts}
        editingReportId={state.editingReportId}
        onCancelEdit={(reportId) => dispatch({ reportId, type: 'cancelEdit' })}
        onDescriptionChange={(reportId, value) =>
          dispatch({ reportId, type: 'updateDescription', value })
        }
        onDownloadReport={handleDownloadReport}
        onSaveEdit={(reportId) => dispatch({ reportId, type: 'saveEdit' })}
        onStartEdit={(reportId) => dispatch({ reportId, type: 'startEdit' })}
        onTagsChange={(reportId, value) =>
          dispatch({ reportId, type: 'updateTags', value })
        }
        onViewReport={handleViewReport}
        reports={visibleReports}
      />
    </section>
  )
}
