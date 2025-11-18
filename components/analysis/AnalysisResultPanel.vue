<script setup lang="ts">
import type { AnalysisCategory, AnalysisStatus } from '~/types/analysis'

const props = withDefaults(
  defineProps<{
    categories?: AnalysisCategory[]
  }>(),
  {
    categories: () => []
  }
)

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
   
      </div>

      <UTextarea
        placeholder="Catatan hasil analisis..."
        autoresize
        :rows="4"
      />
    </div>
  </UCard>
</template>
