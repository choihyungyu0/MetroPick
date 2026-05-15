import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'

import type { BackendStartupSuitabilityResponse } from '@/shared/api/backendPredictionApi'
import { aiPredictionAssets } from '@/shared/assets/aiPredictionAssets'

Font.register({
  family: 'NotoSansKR',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/fonts-archive/NotoSansKR/NotoSansKR-Regular.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/fonts-archive/NotoSansKR/NotoSansKR-Bold.ttf',
      fontWeight: 700,
    },
  ],
})

export type PredictionReportGrowthRate = {
  label: string
  value: number
}

export type PredictionReportConfidenceMetric = {
  label: string
  level: string
  score: number
}

export type PredictionReportPDFProps = {
  backendPrediction: BackendStartupSuitabilityResponse | null
  businessType: string
  confidenceMetrics: PredictionReportConfidenceMetric[]
  generatedAt: string
  growthRates: PredictionReportGrowthRate[]
  salesForecastImageSrc?: string
  scenario: string
  stationArea: string
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    backgroundColor: '#f8fbff',
    color: '#0f172a',
    fontFamily: 'NotoSansKR',
    fontSize: 10,
  },
  header: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
  },
  eyebrow: {
    marginBottom: 4,
    color: '#2563eb',
    fontSize: 9,
    fontWeight: 700,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
  },
  metaGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaItem: {
    width: '48%',
    padding: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#ffffff',
  },
  metaLabel: {
    marginBottom: 3,
    color: '#64748b',
    fontSize: 8,
    fontWeight: 700,
  },
  metaValue: {
    fontSize: 10,
    fontWeight: 700,
  },
  section: {
    marginBottom: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    marginBottom: 9,
    fontSize: 13,
    fontWeight: 700,
  },
  chartImage: {
    width: '100%',
    height: 178,
    objectFit: 'contain',
  },
  twoColumn: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  barRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 7,
  },
  barLabel: {
    width: 82,
    color: '#334155',
    fontSize: 8,
    fontWeight: 700,
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#e0f2fe',
  },
  barFill: {
    height: 10,
    backgroundColor: '#2563eb',
  },
  barValue: {
    width: 36,
    color: '#2563eb',
    fontSize: 8,
    fontWeight: 700,
    textAlign: 'right',
  },
  metricGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '48%',
    padding: 9,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricLabel: {
    marginBottom: 4,
    color: '#475569',
    fontSize: 8,
    fontWeight: 700,
  },
  metricScore: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: 700,
  },
  summaryText: {
    marginBottom: 6,
    color: '#334155',
    lineHeight: 1.5,
  },
  reasonItem: {
    marginBottom: 4,
    color: '#475569',
    lineHeight: 1.4,
  },
  disclaimer: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 8,
    lineHeight: 1.4,
  },
})

function formatPercent(value: number) {
  return `+${value.toFixed(1)}%`
}

function getPredictionSummary(
  backendPrediction: BackendStartupSuitabilityResponse | null,
) {
  if (!backendPrediction) {
    return {
      label: '샘플 시뮬레이션 기준',
      score: '47.6%',
      riskLevel: '보통',
      recommendation: '실제 FastAPI 예측 결과가 없을 때 표시되는 예시 요약입니다.',
      reasons: [
        '개통 이후 유동인구 증가 가능성을 기준으로 산출했습니다.',
        '업종별 성장률은 샘플 시나리오 데이터입니다.',
        '실제 매출을 보장하지 않는 참고용 예측 리포트입니다.',
      ],
    }
  }

  return {
    label: 'FastAPI 예측 결과 기준',
    score: `${backendPrediction.predicted_score.toFixed(1)}점`,
    riskLevel: backendPrediction.risk_level,
    recommendation: backendPrediction.recommendation_label,
    reasons: backendPrediction.top_reasons,
  }
}

export function PredictionReportPDF({
  backendPrediction,
  businessType,
  confidenceMetrics,
  generatedAt,
  growthRates,
  salesForecastImageSrc = aiPredictionAssets.salesForecastChart,
  scenario,
  stationArea,
}: PredictionReportPDFProps) {
  const summary = getPredictionSummary(backendPrediction)

  return (
    <Document
      author="MetroPick AI"
      subject="AI prediction report"
      title="MetroPick AI 예측 리포트"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>MetroPick AI</Text>
          <Text style={styles.title}>AI 예측 리포트</Text>
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>선택 역세권</Text>
              <Text style={styles.metaValue}>{stationArea}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>업종</Text>
              <Text style={styles.metaValue}>{businessType}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>시나리오</Text>
              <Text style={styles.metaValue}>{scenario}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>시뮬레이션 날짜</Text>
              <Text style={styles.metaValue}>{generatedAt}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>개통 전·후 매출 전망</Text>
          <Image src={salesForecastImageSrc} style={styles.chartImage} />
        </View>

        <View style={styles.twoColumn}>
          <View style={[styles.section, styles.column]}>
            <Text style={styles.sectionTitle}>업종별 매출 상승률</Text>
            {growthRates.map((item) => (
              <View key={item.label} style={styles.barRow}>
                <Text style={styles.barLabel}>{item.label}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.min(item.value * 1.6, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.barValue}>{formatPercent(item.value)}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.section, styles.column]}>
            <Text style={styles.sectionTitle}>선택 역세권 예측 요약</Text>
            <Text style={styles.summaryText}>기준: {summary.label}</Text>
            <Text style={styles.summaryText}>예측 점수: {summary.score}</Text>
            <Text style={styles.summaryText}>위험 수준: {summary.riskLevel}</Text>
            <Text style={styles.summaryText}>추천 판단: {summary.recommendation}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>핵심 지표 신뢰도</Text>
          <View style={styles.metricGrid}>
            {confidenceMetrics.map((metric) => (
              <View key={metric.label} style={styles.metricCard}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricScore}>
                  {metric.score}% {metric.level}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주요 예측 근거</Text>
          {summary.reasons.map((reason) => (
            <Text key={reason} style={styles.reasonItem}>
              - {reason}
            </Text>
          ))}
          <Text style={styles.disclaimer}>
            이 리포트는 시나리오 기반 예측 자료이며 실제 매출이나 창업 성과를 보장하지
            않습니다. Supabase 서비스 키 또는 API 비밀값은 PDF에 포함하지 않습니다.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
