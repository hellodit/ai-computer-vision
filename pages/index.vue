<script setup lang="ts">
import { ref } from 'vue'
import CameraPreview from '~/components/analysis/CameraPreview.vue'
import type { AnalysisCategory } from '~/types/analysis'
import type { GeminiAnalysisResult } from '~/composables/useGemini'

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

// State untuk hasil analisis
const analysisResult = ref<GeminiAnalysisResult | null>(null)
const analysisError = ref<string | null>(null)

/**
 * Handle analysis result dari CameraPreview
 */
const handleAnalysisResult = (result: GeminiAnalysisResult): void => {
  analysisResult.value = result
  analysisError.value = null
}

/**
 * Handle analysis error dari CameraPreview
 */
const handleAnalysisError = (error: string): void => {
  analysisError.value = error
  analysisResult.value = null
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

      <div class="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div class="col-span-1 grid grid-cols-1 gap-4"> 
          <ClientOnly>
            <CameraPreview
              :analysis-items="analyses"
              @analysis-result="handleAnalysisResult"
              @analysis-error="handleAnalysisError"
            />
            <template #fallback>
              <div
                class="flex min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-400"
              >
                Memuat kamera...
              </div>
            </template>
          </ClientOnly>
        </div>

        <AnalysisResultPanel
          :categories="analysisCategories"
          :analysis-result="analysisResult"
          :analysis-error="analysisError"
        />
      </div>
    </div>
  </div>
</template>
