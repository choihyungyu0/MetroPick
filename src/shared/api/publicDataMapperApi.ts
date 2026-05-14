import sampleBusRidershipRows from './fixtures/sampleBusRidershipRows.json'
import sampleBusinessLicenseRows from './fixtures/sampleBusinessLicenseRows.json'
import sampleCommercialGrowthRows from './fixtures/sampleCommercialGrowthRows.json'
import sampleStoreRows from './fixtures/sampleStoreRows.json'
import sampleUrbanRailwayStationRows from './fixtures/sampleUrbanRailwayStationRows.json'

import {
  mapRawBusRidershipRows,
  type NormalizedBusRidership,
} from '@/shared/mappers/busRidershipMapper'
import {
  mapRawBusinessLicenseRows,
  type NormalizedBusinessLicense,
} from '@/shared/mappers/businessLicenseMapper'
import {
  mapRawCommercialGrowthRows,
  type NormalizedCommercialGrowth,
} from '@/shared/mappers/commercialGrowthMapper'
import { mapRawStoreRows, type NormalizedStore } from '@/shared/mappers/storeMapper'
import {
  mapRawUrbanRailwayStationRows,
  type NormalizedUrbanRailwayStation,
} from '@/shared/mappers/urbanRailwayStationMapper'
import type { RawBusRidershipDataRow } from '@/shared/types/raw-public-data/rawBusRidershipData'
import type { RawBusinessLicenseDataRow } from '@/shared/types/raw-public-data/rawBusinessLicenseData'
import type { RawCommercialGrowthDataRow } from '@/shared/types/raw-public-data/rawCommercialGrowthData'
import type { RawStoreDataRow } from '@/shared/types/raw-public-data/rawStoreData'
import type { RawUrbanRailwayStationDataRow } from '@/shared/types/raw-public-data/rawUrbanRailwayStationData'

import { withMockDelay } from './publicDataClient'

const storeRows: RawStoreDataRow[] = sampleStoreRows
const busRidershipRows: RawBusRidershipDataRow[] = sampleBusRidershipRows
const urbanRailwayStationRows: RawUrbanRailwayStationDataRow[] =
  sampleUrbanRailwayStationRows
const businessLicenseRows: RawBusinessLicenseDataRow[] = sampleBusinessLicenseRows
const commercialGrowthRows: RawCommercialGrowthDataRow[] = sampleCommercialGrowthRows

export async function getMappedStoreSamples(): Promise<NormalizedStore[]> {
  return withMockDelay(mapRawStoreRows(storeRows))
}

export async function getMappedBusRidershipSamples(): Promise<
  NormalizedBusRidership[]
> {
  return withMockDelay(mapRawBusRidershipRows(busRidershipRows))
}

export async function getMappedUrbanRailwayStationSamples(): Promise<
  NormalizedUrbanRailwayStation[]
> {
  return withMockDelay(mapRawUrbanRailwayStationRows(urbanRailwayStationRows))
}

export async function getMappedBusinessLicenseSamples(): Promise<
  NormalizedBusinessLicense[]
> {
  return withMockDelay(mapRawBusinessLicenseRows(businessLicenseRows))
}

export async function getMappedCommercialGrowthSamples(): Promise<
  NormalizedCommercialGrowth[]
> {
  return withMockDelay(mapRawCommercialGrowthRows(commercialGrowthRows))
}
