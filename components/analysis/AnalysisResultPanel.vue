<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AnalysisCategory, AnalysisStatus, AnalysisItemResult } from '~/types/analysis'

interface Props {
  categories?: AnalysisCategory[]
  analysisResults?: AnalysisItemResult[]
  analysisError?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  categories: () => [],
  analysisResults: () => [],
  analysisError: null
})

const notes = ref('')

// Sort results by timestamp (terbaru di bawah seperti chat)
const sortedResults = computed(() => {
  return [...props.analysisResults].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  )
})

const STATUS_LABELS: Record<AnalysisStatus, string> = {
  ready: 'Ready',
  'in-progress': 'In progress',
  planned: 'Planned'
}

const STATUS_COLORS: Record<AnalysisStatus, 'success' | 'warning' | 'neutral'> = {
  ready: 'success',
  'in-progress': 'warning',
  planned: 'neutral'
}

const FALLBACK_STATUS: AnalysisStatus = 'planned'
</script>

<template>
  <UCard class="rounded-2xl border border-gray-200 dark:border-gray-800">
    <div class="flex h-full flex-col gap-5">
      <div>
        <p class="text-lg font-semibold text-gray-900 dark:text-white">Analysis roadmap</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Daftar kapabilitas analisis visual yang ingin didukung oleh sistem.
          Tandai catatan atau temuan penting pada bagian bawah.
        </p>
      </div>

      <div class="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] scroll-smooth">
        <!-- Analysis Results as Chat Bubbles -->
        <div v-if="sortedResults.length > 0" class="space-y-3">
          <div
            v-for="(result, index) in sortedResults"
            :key="`${result.analysisType}-${result.timestamp.getTime()}-${index}`"
            class="flex flex-col gap-2"
          >
            <!-- Chat Bubble -->
            <div
              :class="[
                'rounded-2xl px-4 py-3 shadow-sm transition-all',
                result.error
                  ? 'border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40'
                  : 'border border-primary-200 bg-primary-50 dark:border-primary-900/30 dark:bg-primary-950/40'
              ]"
            >
              <!-- Header dengan nama analisa dan waktu -->
              <div class="mb-2 flex items-center justify-between gap-2">
                <h3
                  :class="[
                    'text-sm font-semibold capitalize',
                    result.error
                      ? 'text-red-900 dark:text-red-200'
                      : 'text-primary-900 dark:text-primary-200'
                  ]"
                >
                  {{ result.analysisType }}
                </h3>
                <span
                  :class="[
                    'text-xs whitespace-nowrap',
                    result.error
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-primary-600 dark:text-primary-400'
                  ]"
                >
                  {{ new Date(result.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </div>

              <!-- Loading State -->
              <div v-if="result.isProcessing" class="flex items-center gap-2 py-2">
                <svg class="h-4 w-4 animate-spin text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-sm text-gray-600 dark:text-gray-400">Menganalisis...</span>
              </div>

              <!-- Error State -->
              <div v-else-if="result.error" class="flex items-start gap-2">
                <svg class="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <p class="text-sm leading-relaxed text-red-800 dark:text-red-100">
                  {{ result.error }}
                </p>
              </div>

              <!-- Success State -->
              <p
                v-else-if="result.text"
                class="text-sm leading-relaxed whitespace-pre-wrap text-primary-800 dark:text-primary-100"
              >
                {{ result.text }}
              </p>
            </div>
          </div>
        </div>

        <!-- Global Error -->
        <div v-if="props.analysisError && sortedResults.length === 0" class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
          <div class="mb-2 flex items-center gap-2">
            <svg class="h-5 w-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <h3 class="text-sm font-semibold text-red-900 dark:text-red-200">
              Error Analisis
            </h3>
          </div>
          <p class="text-sm text-red-800 dark:text-red-100">
            {{ props.analysisError }}
          </p>
        </div>

        <!-- Empty State -->
        <div v-if="sortedResults.length === 0 && !props.analysisError" class="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/40">
          <svg class="mb-3 h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Belum ada hasil analisis
          </p>
          <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Klik tombol "Analyze" pada kamera untuk memulai analisis
          </p>
        </div>
      </div>

      <UTextarea
        v-model="notes"
        placeholder="Catatan hasil analisis..."
        autoresize
        :rows="4"
      />
    </div>
  </UCard>
</template>
