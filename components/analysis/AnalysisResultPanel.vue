<script setup lang="ts">
import { ref } from 'vue'
import type { AnalysisCategory, AnalysisStatus } from '~/types/analysis'
import type { GeminiAnalysisResult } from '~/composables/useGemini'

interface Props {
  categories?: AnalysisCategory[]
  analysisResult?: GeminiAnalysisResult | null
  analysisError?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  categories: () => [],
  analysisResult: null,
  analysisError: null
})

const notes = ref('')

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

      <div class="flex-1 space-y-3 overflow-auto">
        <!-- Analysis Result -->
        <div v-if="props.analysisResult" class="space-y-2">
          <div class="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/40">
            <div class="mb-2 flex items-center justify-between">
              <h3 class="text-sm font-semibold text-green-900 dark:text-green-200">
                Hasil Analisis
              </h3>
              <span class="text-xs text-green-600 dark:text-green-400">
                {{ new Date(props.analysisResult.timestamp).toLocaleTimeString('id-ID') }}
              </span>
            </div>
            <p class="text-sm leading-relaxed text-green-800 dark:text-green-100 whitespace-pre-wrap">
              {{ props.analysisResult.text }}
            </p>
          </div>
        </div>

        <!-- Analysis Error -->
        <div v-if="props.analysisError" class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
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
        <div v-if="!props.analysisResult && !props.analysisError" class="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/40">
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
