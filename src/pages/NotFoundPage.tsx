import { Link } from 'react-router-dom'

import { Card } from '@/shared/components/Card'

export function NotFoundPage() {
  return (
    <Card className="mx-auto max-w-xl text-center">
      <p className="text-sm font-bold text-city-700">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-950">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        요청한 화면이 없거나 아직 MVP에 연결되지 않았습니다.
      </p>
      <Link
        className="mt-6 inline-flex min-h-10 items-center justify-center rounded-md bg-city-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-city-500 focus-visible:ring-2 focus-visible:ring-city-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        to="/dashboard"
      >
        대시보드로 돌아가기
      </Link>
    </Card>
  )
}
