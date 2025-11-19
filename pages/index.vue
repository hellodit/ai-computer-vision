<script setup lang="ts">
import { ref } from 'vue'
import CameraPreview from '~/components/analysis/CameraPreview.vue'
import type { AnalysisCategory, AnalysisItemResult } from '~/types/analysis'

const analysisCategories: AnalysisCategory[] = [
  {
    name: 'General Analysis',
    description: 'Overall scene interpretation and context',
    status: 'planned'
  },
  {
    name: 'Emotion Detection',
    description: 'Facial expression and emotional state analysis',
    status: 'planned'
  },
  {
    name: 'Fatigue Analysis',
    description: 'Signs of tiredness using facial indicators',
    status: 'planned'
  },
  {
    name: 'Gender Presentation',
    description: 'Analysis of apparent gender presentation',
    status: 'planned'
  },
  {
    name: 'Person Description',
    description: 'Detailed physical characteristics',
    status: 'planned'
  },
  {
    name: 'Accessories',
    description: 'Detection of worn items and accessories',
    status: 'planned'
  },
  {
    name: 'Gaze Analysis',
    description: 'Eye tracking and attention direction',
    status: 'planned'
  },
  {
    name: 'Hair Analysis',
    description: 'Detailed hair characteristics assessment',
    status: 'planned'
  },
  {
    name: 'Crowd Analysis',
    description: 'Group dynamics and demographic patterns',
    status: 'planned'
  }
]

const analyses = analysisCategories.map((category) => category.name)

// State untuk hasil analisis per item
const analysisResults = ref<AnalysisItemResult[]>([])
const analysisError = ref<string | null>(null)
const processingItems = ref<Set<string>>(new Set())

/**
 * Handle analysis result dari CameraPreview (per item)
 */
const handleAnalysisResult = (result: AnalysisItemResult): void => {
  // Cari apakah sudah ada hasil untuk analisa ini
  const existingIndex = analysisResults.value.findIndex(
    (r) => r.analysisType === result.analysisType && 
           Math.abs(r.timestamp.getTime() - result.timestamp.getTime()) < 1000 // Dalam 1 detik
  )

  if (existingIndex >= 0) {
    // Update existing result
    analysisResults.value[existingIndex] = result
  } else {
    // Tambah result baru
    analysisResults.value.push(result)
  }

  analysisError.value = null
}

/**
 * Handle analysis progress dari CameraPreview
 */
const handleAnalysisProgress = (analysisType: string, isProcessing: boolean): void => {
  if (isProcessing) {
    processingItems.value.add(analysisType)
    
    // Tambahkan placeholder jika belum ada
    const existing = analysisResults.value.find(
      (r) => r.analysisType === analysisType && r.isProcessing
    )
    
    if (!existing) {
      analysisResults.value.push({
        analysisType,
        text: '',
        timestamp: new Date(),
        isProcessing: true
      })
    }
  } else {
    processingItems.value.delete(analysisType)
    
    // Update isProcessing flag
    const existing = analysisResults.value.find(
      (r) => r.analysisType === analysisType && r.isProcessing
    )
    if (existing) {
      existing.isProcessing = false
    }
  }
}

/**
 * Handle analysis error dari CameraPreview
 */
const handleAnalysisError = (error: string): void => {
  analysisError.value = error
}
</script>

<template>
  <div class="min-h-screen  py-2 px-2  my-auto">
    
    <div class="flex flex-col gap-2 max-w-6xl mx-auto justify-center items-center mb-8"> 
      <h1 class="text-2xl font-bold">Computer Vision Analysis</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Analyze the scene and identify the objects and people in the image.
      </p>
    </div>
    
    <div
      class="mx-auto flex w-full max-w-6xl flex-col gap-8 rounded-[32px] border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900"
    >

      <div class="grid grid-cols-4 gap-4">
        <div class="col-span-2 col-span-1 grid grid-cols-1 gap-4"> 
          <ClientOnly>
            <CameraPreview
              :analysis-items="analyses"
              @analysis-result="handleAnalysisResult"
              @analysis-error="handleAnalysisError"
              @analysis-progress="handleAnalysisProgress"
            />
            <template #fallback>
              <div
                class="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-400"
              >
                Memuat kamera...
              </div>
            </template>
          </ClientOnly>
        </div>

        <div class="col-span-2">
          <AnalysisResultPanel
            :categories="analysisCategories"
            :analysis-results="analysisResults"
            :analysis-error="analysisError"
          />
        </div>

      </div>
    </div>
  </div>
</template>
