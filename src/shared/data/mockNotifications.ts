export type MockNotificationId =
  | 'opening-schedule'
  | 'sales-change'
  | 'location-recommendation'
  | 'competition-change'
  | 'weekly-report'

export type MockNotification = {
  id: MockNotificationId
  title: string
  description: string
}

export const mockNotifications: MockNotification[] = [
  {
    id: 'opening-schedule',
    title: '개통 일정 변경 알림',
    description: '광주 2호선 개통 일정 변경 및 구간별 공사·개발 진행 상황 알림',
  },
  {
    id: 'sales-change',
    title: '예상 매출 변동 알림',
    description: '선택한 역세권과 업종의 예상 매출 변동 알림',
  },
  {
    id: 'location-recommendation',
    title: '추천 입지 업데이트',
    description: '새롭게 발견된 유망 입지와 추천 상권 정보 알림',
  },
  {
    id: 'competition-change',
    title: '경쟁도 변화 알림',
    description: '상권 밀집도 및 경쟁 강도 변화 추이 알림',
  },
  {
    id: 'weekly-report',
    title: '주간 요약 리포트',
    description: '주간 상권 변화 요약과 주요 인사이트 리포트',
  },
]
