import { PDFDownloadLink } from '@react-pdf/renderer'
import { FileDown } from 'lucide-react'

import {
  PredictionReportPDF,
  type PredictionReportPDFProps,
} from './PredictionReportPDF'

export function PredictionReportDownloadButton(props: PredictionReportPDFProps) {
  return (
    <PDFDownloadLink
      document={<PredictionReportPDF {...props} />}
      fileName="MetroPick_AI_예측_리포트.pdf"
    >
      {({ loading }) => (
        <button
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-blue-200 bg-white px-3 text-xs font-black whitespace-nowrap text-blue-600"
          type="button"
        >
          <FileDown aria-hidden="true" size={15} />
          {loading ? '리포트 생성 중' : '리포트 다운로드'}
        </button>
      )}
    </PDFDownloadLink>
  )
}

export default PredictionReportDownloadButton
