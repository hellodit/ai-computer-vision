export type AnalysisStatus = 'ready' | 'in-progress' | 'planned'

export interface AnalysisCategory {
  name: string
  description: string
  status?: AnalysisStatus
}

export interface AnalysisItemResult {
  analysisType: string
  text: string
  timestamp: Date
  error?: string
  isProcessing?: boolean
}

