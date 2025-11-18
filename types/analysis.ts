export type AnalysisStatus = 'ready' | 'in-progress' | 'planned'

export interface AnalysisCategory {
  name: string
  description: string
  status?: AnalysisStatus
}

