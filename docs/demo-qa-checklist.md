# MetroPick AI Demo QA Checklist

Use this checklist before a demo or deployment handoff. The goal is to confirm
that existing pages still render, mock fallback behavior remains available, and
FastAPI-connected surfaces show connected status when the local backend is on.

## Route checklist

| Route | Expected heading | Key action | Expected result | Backend off fallback status | Backend on connected status |
| --- | --- | --- | --- | --- | --- |
| `/` | `MetroPick AI` / `광주 2호선 상권 변화 대시보드` | Click login or signup CTA. | Navigates to the selected auth route. | No backend badge expected. Static/mock landing content renders. | No backend badge expected. Static/mock landing content renders. |
| `/login` | `로그인` | Click `로그인`. | Mock login stores auth state and moves to onboarding. | No backend badge expected. | No backend badge expected. |
| `/signup` | `회원가입!` | Click `회원가입 완료`. | Mock signup stores auth state and moves to onboarding. | No backend badge expected. | No backend badge expected. |
| `/onboarding` | `초기 설정` | Review defaults and continue. | Interest setup remains selectable and summary is visible. | No backend badge expected. | No backend badge expected. |
| `/onboarding/stations` | `관심 역세권 설정` | Select or deselect a station, change radius. | Selected count and preview summary update. | No backend badge expected. | No backend badge expected. |
| `/onboarding/business-type` | `분석 업종 설정` | Select or deselect business types. | Selected count and saved business setup update. | No backend badge expected. | No backend badge expected. |
| `/onboarding/notifications` | `알림 설정` | Toggle notification item and complete setup. | Notification summary updates and dashboard navigation works. | No backend badge expected. | No backend badge expected. |
| `/dashboard` | `광주 2호선 상권 변화 대시보드` | Open navigation links and review dashboard cards. | Map image, charts, saved reports, and insights render. | No backend badge expected. Dashboard uses mock/static content. | No backend badge expected. Dashboard uses mock/static content. |
| `/commercial-analysis` | `역세권 상권 분석` | Click `리포트로 저장`. | Report is saved to localStorage and success toast appears. | Shows `백엔드 미연결 · 목업 데이터 표시`. | Shows `FastAPI 샘플 데이터 연결됨`. |
| `/ai-prediction` | `AI 매출 변동 시뮬레이션` | Click `시뮬레이션 실행`. | Result card appears and prediction result is saved to localStorage. | Shows `백엔드 미연결 · 목업 예측 결과 표시`. | Shows `FastAPI 예측 결과 연결됨` and `창업 적합도 점수`. |
| `/recommendation` | `창업 유망 지역 추천` | Review Top 5 list and save a location. | Saved interest location appears in localStorage. | Shows `백엔드 미연결 · 목업 추천 표시`. | Shows `FastAPI 샘플 추천 연결됨`. |
| `/report` | `미래 매출 예측 리포트` | Click copy/share or download/export controls. | Toast or expected report action feedback appears. | No backend badge expected. Report uses local/mock state. | No backend badge expected. Report uses local/mock state. |
| `/mypage` | `마이페이지` | Search saved reports and update notification settings. | Search filters results and localStorage settings update. | No backend badge expected. | No backend badge expected. |

## Mobile viewport check

- Test at a narrow viewport such as `390 x 844`.
- Confirm no horizontal page scrolling beyond intentional chart/table overflow.
- Confirm primary buttons remain visible and text does not overlap.
- Confirm onboarding and dashboard cards stack cleanly.

## Image asset check

- Confirm hero, login, signup, onboarding, dashboard, commercial-analysis,
  AI-prediction, recommendation, and report images load.
- Confirm image fallback text is not visible during normal local demo.
- Confirm no image is stretched or cropped in a way that hides the subject.

## localStorage reset check

Before a clean demo, open browser DevTools and run:

```js
localStorage.clear()
location.reload()
```

There is no dedicated demo seed/reset utility at this time. Demo state is
created through the normal login, onboarding, prediction, recommendation, and
report-save flows.

## FastAPI status check

With the backend running locally, verify:

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/api/commercial-analysis/summary`
- `http://127.0.0.1:8000/api/commercial-analysis/store-summary`
- `http://127.0.0.1:8000/api/recommendations`

Expected local demo behavior:

- Backend on: connected badges appear on the integrated pages.
- Backend off: pages still render with existing mock fallback data.

## Vercel deployed URL check

- Open the deployed Vercel URL.
- Hard-refresh deep routes such as `/dashboard`, `/commercial-analysis`,
  `/ai-prediction`, and `/recommendation`.
- Confirm Vercel rewrites serve the React app instead of a 404.
- Confirm local FastAPI-only features remain fallback-safe on the deployed
  frontend until a production backend is configured.
