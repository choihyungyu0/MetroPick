import { describe, expect, it } from 'vitest'

import { mapRawStoreRow, mapRawStoreRows } from './storeMapper'

describe('storeMapper', () => {
  it('maps a raw store row to normalized store fields', () => {
    const store = mapRawStoreRow({
      상가업소번호: ' STORE-1 ',
      상호명: ' 상무 커피 ',
      상권업종대분류명: '음식',
      상권업종중분류명: '커피점/카페',
      상권업종소분류명: '카페',
      상권업종코드: 'Q12A01',
      시도명: '광주광역시',
      시군구명: '서구',
      법정동명: '치평동',
      도로명주소: '광주광역시 서구 상무중앙로',
      지번주소: '광주광역시 서구 치평동',
      위도: '35.1547',
      경도: '126.8497',
    })

    expect(store).toMatchObject({
      id: 'STORE-1',
      storeName: '상무 커피',
      businessCategorySmall: '카페',
      latitude: 35.1547,
      longitude: 126.8497,
    })
  })

  it('falls back for missing id and invalid coordinates in row lists', () => {
    const stores = mapRawStoreRows([
      {
        상호명: '좌표 누락 점포',
        위도: '999',
        경도: 'not-a-coordinate',
      },
    ])

    expect(stores[0]?.id).toBe('store-0')
    expect(stores[0]?.latitude).toBe(0)
    expect(stores[0]?.longitude).toBe(0)
  })
})
