import type { BusinessType } from '@/shared/types/business'

export const mockBusinessTypes: BusinessType[] = [
  {
    id: 'cafe-dessert',
    label: '카페/디저트',
    category: 'food-service',
    description: '유동인구와 체류 시간이 중요한 음료·디저트 업종',
  },
  {
    id: 'restaurant',
    label: '음식점',
    category: 'food-service',
    description: '배후 주거와 업무 수요를 함께 보는 외식 업종',
  },
  {
    id: 'convenience-store',
    label: '편의점',
    category: 'retail',
    description: '역 접근성과 생활 동선이 중요한 근린 소매 업종',
  },
  {
    id: 'pharmacy',
    label: '약국',
    category: 'health',
    description: '의료시설 접근성과 고정 생활 수요를 함께 보는 업종',
  },
  {
    id: 'beauty-salon',
    label: '미용실',
    category: 'life-service',
    description: '주거지 반복 방문 수요가 중요한 생활 서비스 업종',
  },
  {
    id: 'academy',
    label: '학원',
    category: 'education',
    description: '학령 인구와 주거 배후 수요를 함께 보는 교육 업종',
  },
  {
    id: 'health-beauty',
    label: '헬스/뷰티',
    category: 'health-beauty',
    description: '젊은 생활인구와 소비 트렌드 변화에 민감한 업종',
  },
  {
    id: 'life-service',
    label: '생활서비스',
    category: 'life-service',
    description: '근린 생활권의 안정적 반복 수요를 보는 업종',
  },
  {
    id: 'retail',
    label: '소매',
    category: 'retail',
    description: '도보 접근성과 상권 집객력을 함께 고려하는 판매 업종',
  },
]
