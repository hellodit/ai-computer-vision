<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useCamera, type CameraConfig } from '~/composables/useCamera'
import { useGemini } from '~/composables/useGemini'
import AnalysisGrid from '~/components/analysis/AnalysisGrid.vue'
import type { AnalysisItemResult } from '~/types/analysis'

interface Props {
  analysisItems?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  analysisItems: () => []
})

interface Emits {
  (e: 'analysis-result', result: AnalysisItemResult): void
  (e: 'analysis-error', error: string): void
  (e: 'analysis-progress', type: string, isProcessing: boolean): void
}

const emit = defineEmits<Emits>()

/**
 * Komponen CameraPreview
 * Menampilkan preview dari kamera perangkat dengan error handling dan loading states
 */

// ========== Konfigurasi ==========

// Konfigurasi kamera - dapat disesuaikan sesuai kebutuhan
const cameraConfig: CameraConfig = {
  facingMode: 'user',
  width: { ideal: 1280 },
  height: { ideal: 720 }
}

// Konstanta untuk delay dan retry
const DOM_STABILIZE_DELAY_MS = 100
const RETRY_DELAY_MS = 200
const MAX_RETRIES = 5

// Pesan UI
const UI_MESSAGES = {
  loading: 'Meminta izin kamera...',
  retryFailed: 'Video element tidak ditemukan setelah beberapa kali percobaan',
  screenshotSuccess: 'Screenshot berhasil diambil!',
  screenshotFailed: 'Gagal mengambil screenshot',
  analyzing: 'Menganalisis gambar...',
  analysisSuccess: 'Analisis berhasil!',
  analysisFailed: 'Gagal menganalisis gambar'
} as const

// State untuk screenshot
const screenshotUrl = ref<string | null>(null)

// State untuk selected analysis items
const selectedAnalysisItems = ref<string[]>([])

// ========== Composable ==========

// Gunakan composable untuk mengelola kamera
const {
  videoRef,
  cameraError,
  isStreamReady,
  isInitializing,
  isPaused,
  currentFacingMode,
  availableDevices,
  initCamera,
  stopCamera,
  restartCamera,
  switchCamera,
  pauseCamera,
  resumeCamera,
  captureScreenshot,
  getAvailableDevices
} = useCamera(cameraConfig)

// Gunakan composable untuk Gemini API
const {
  isAnalyzing,
  error: geminiError,
  analyzeImage
} = useGemini()

// ========== Functions ==========

/**
 * Inisialisasi kamera dengan retry logic jika video element belum tersedia
 * @param retryCount - Jumlah percobaan saat ini
 * @param maxRetries - Maksimal jumlah percobaan
 */
const initializeWithRetry = async (
  retryCount = 0,
  maxRetries = MAX_RETRIES
): Promise<void> => {
  if (videoRef.value) {
    await initCamera()
    return
  }

  if (retryCount >= maxRetries) {
    console.error(UI_MESSAGES.retryFailed)
    return
  }

  await nextTick()

  if (!videoRef.value) {
    console.warn(
      `Video element belum tersedia (attempt ${retryCount + 1}/${maxRetries}), mencoba lagi...`
    )
    setTimeout(() => {
      initializeWithRetry(retryCount + 1, maxRetries)
    }, RETRY_DELAY_MS)
  } else {
    await initCamera()
  }
}

/**
 * Handle screenshot capture
 */
const handleScreenshot = (): void => {
  const dataUrl = captureScreenshot()
  if (dataUrl) {
    screenshotUrl.value = dataUrl
    // Download screenshot
    const link = document.createElement('a')
    link.download = `screenshot-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  } else {
    console.error(UI_MESSAGES.screenshotFailed)
  }
}

/**
 * Generate prompt berdasarkan selected analysis items
 */
const generatePrompt = (selectedItems: string[]): string => {
  // Mapping untuk setiap jenis analisa
  const analysisPrompts: Record<string, string> = {
    'General Analysis': 'Analisis keseluruhan gambar secara detail. Berikan deskripsi lengkap tentang apa yang terlihat dalam gambar, termasuk objek, orang, latar belakang, dan konteks visual lainnya.',
    'Emotion Detection': 'Analisis ekspresi wajah dan emosi orang-orang dalam gambar. Identifikasi emosi yang terlihat (senang, sedih, marah, netral, dll) dan tingkat kepercayaan deteksi.',
    'Fatigue Analysis': 'Analisis tanda-tanda kelelahan pada wajah. Perhatikan indikator seperti mata mengantuk, lingkaran hitam, ekspresi lelah, dan tanda fisik lainnya yang menunjukkan kelelahan.',
    'Gender Presentation': 'Analisis presentasi gender yang terlihat pada orang-orang dalam gambar. Deskripsikan karakteristik yang terlihat tanpa membuat asumsi definitif.',
    'Person Description': 'Beri deskripsi detail karakteristik fisik orang-orang dalam gambar, termasuk usia perkiraan, tinggi badan, bentuk wajah, dan fitur fisik lainnya yang terlihat.',
    'Accessories': 'Identifikasi dan deskripsikan aksesori atau item yang dikenakan oleh orang-orang dalam gambar, seperti kacamata, topi, perhiasan, jam tangan, tas, atau item lainnya.',
    'Gaze Analysis': 'Analisis arah pandangan mata dan fokus perhatian. Tentukan ke mana orang-orang dalam gambar sedang melihat atau fokus.',
    'Hair Analysis': 'Analisis karakteristik rambut orang-orang dalam gambar, termasuk warna rambut, panjang, gaya, tekstur, dan detail lainnya yang terlihat.',
    'Crowd Analysis': 'Analisis dinamika kelompok dan pola demografis. Hitung jumlah orang, distribusi usia dan gender, interaksi antar orang, dan pola perilaku kelompok.'
  }

  // Jika tidak ada item yang dipilih, gunakan general analysis
  if (!selectedItems || selectedItems.length === 0) {
    return 'Analisis gambar ini secara detail. Berikan deskripsi lengkap tentang apa yang terlihat dalam gambar, termasuk objek, orang, emosi, dan konteks visual lainnya. Jawab dalam bahasa Indonesia.'
  }

  // Buat prompt berdasarkan item yang dipilih
  const prompts: string[] = []
  
  selectedItems.forEach((item) => {
    const prompt = analysisPrompts[item]
    if (prompt) {
      prompts.push(prompt)
    }
  })

  // Jika tidak ada prompt yang cocok, gunakan default
  if (prompts.length === 0) {
    return 'Analisis gambar ini secara detail. Berikan deskripsi lengkap tentang apa yang terlihat dalam gambar. Jawab dalam bahasa Indonesia.'
  }

  // Gabungkan semua prompt
  const combinedPrompt = `
Analisis gambar ini dengan fokus pada aspek-aspek berikut:

${prompts.map((p, index) => `${index + 1}. ${p}`).join('\n\n')}

Berikan hasil analisis yang terstruktur dan detail untuk setiap aspek yang diminta. Jawab dalam bahasa Indonesia.
`.trim()

  return combinedPrompt
}

/**
 * Generate prompt untuk satu jenis analisa
 */
const generateSinglePrompt = (analysisType: string): string => {
  // Mapping untuk setiap jenis analisa
  const analysisPrompts: Record<string, string> = {
    'General Analysis': 'Analisis keseluruhan gambar secara detail. Berikan deskripsi lengkap tentang apa yang terlihat dalam gambar, termasuk objek, orang, latar belakang, dan konteks visual lainnya. Jawab dalam bahasa Indonesia.',
    'Emotion Detection': 'Analisis ekspresi wajah dan emosi orang-orang dalam gambar. Identifikasi emosi yang terlihat (senang, sedih, marah, netral, dll) dan tingkat kepercayaan deteksi. Jawab dalam bahasa Indonesia.',
    'Fatigue Analysis': 'Analisis tanda-tanda kelelahan pada wajah. Perhatikan indikator seperti mata mengantuk, lingkaran hitam, ekspresi lelah, dan tanda fisik lainnya yang menunjukkan kelelahan. Jawab dalam bahasa Indonesia.',
    'Gender Presentation': 'Analisis presentasi gender yang terlihat pada orang-orang dalam gambar. Deskripsikan karakteristik yang terlihat tanpa membuat asumsi definitif. Jawab dalam bahasa Indonesia.',
    'Person Description': 'Beri deskripsi detail karakteristik fisik orang-orang dalam gambar, termasuk usia perkiraan, tinggi badan, bentuk wajah, dan fitur fisik lainnya yang terlihat. Jawab dalam bahasa Indonesia.',
    'Accessories': 'Identifikasi dan deskripsikan aksesori atau item yang dikenakan oleh orang-orang dalam gambar, seperti kacamata, topi, perhiasan, jam tangan, tas, atau item lainnya. Jawab dalam bahasa Indonesia.',
    'Gaze Analysis': 'Analisis arah pandangan mata dan fokus perhatian. Tentukan ke mana orang-orang dalam gambar sedang melihat atau fokus. Jawab dalam bahasa Indonesia.',
    'Hair Analysis': 'Analisis karakteristik rambut orang-orang dalam gambar, termasuk warna rambut, panjang, gaya, tekstur, dan detail lainnya yang terlihat. Jawab dalam bahasa Indonesia.',
    'Crowd Analysis': 'Analisis dinamika kelompok dan pola demografis. Hitung jumlah orang, distribusi usia dan gender, interaksi antar orang, dan pola perilaku kelompok. Jawab dalam bahasa Indonesia.'
  }

  return analysisPrompts[analysisType] || 'Analisis gambar ini secara detail. Jawab dalam bahasa Indonesia.'
}

/**
 * Handle image analysis dengan Gemini API - melakukan request terpisah untuk setiap analisa
 */
const handleAnalyzeImage = async (): Promise<void> => {
  if (!isStreamReady.value || isPaused.value) {
    return
  }

  // Validasi: harus ada minimal 1 item yang dipilih
  if (!selectedAnalysisItems.value || selectedAnalysisItems.value.length === 0) {
    emit('analysis-error', 'Silakan pilih minimal satu jenis analisa yang ingin dilakukan.')
    return
  }

  const dataUrl = captureScreenshot()
  if (!dataUrl) {
    const errorMsg = 'Gagal mengambil gambar untuk dianalisis'
    emit('analysis-error', errorMsg)
    return
  }

  // Lakukan request secara terpisah untuk setiap analisa
  const analysisPromises = selectedAnalysisItems.value.map(async (analysisType: string) => {
    // Emit progress untuk setiap analisa
    emit('analysis-progress', analysisType, true)

    try {
      // Generate prompt untuk analisa ini saja
      const prompt = generateSinglePrompt(analysisType)
      
      const result = await analyzeImage(dataUrl, prompt)
      
      if (result) {
        emit('analysis-result', {
          analysisType,
          text: result,
          timestamp: new Date()
        })
      } else if (geminiError.value) {
        emit('analysis-result', {
          analysisType,
          text: '',
          timestamp: new Date(),
          error: geminiError.value
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : UI_MESSAGES.analysisFailed
      emit('analysis-result', {
        analysisType,
        text: '',
        timestamp: new Date(),
        error: errorMessage
      })
    } finally {
      // Emit progress selesai untuk analisa ini
      emit('analysis-progress', analysisType, false)
    }
  })

  // Jalankan semua request secara paralel
  await Promise.all(analysisPromises)
}

/**
 * Toggle camera (start/stop)
 */
const handleToggleCamera = async (): Promise<void> => {
  if (isStreamReady.value) {
    stopCamera()
  } else {
    await initCamera()
  }
}

/**
 * Handle pause/resume
 */
const handleTogglePause = async (): Promise<void> => {
  if (isPaused.value) {
    await resumeCamera()
  } else {
    pauseCamera()
  }
}

// ========== Watchers ==========

/**
 * Watch untuk videoRef - inisialisasi otomatis ketika ref tersedia
 */
watch(
  videoRef,
  (newVal) => {
    if (newVal && !isInitializing.value && !isStreamReady.value && !cameraError.value) {
      // Delay sedikit untuk memastikan DOM sudah stabil
      setTimeout(() => {
        initCamera()
      }, DOM_STABILIZE_DELAY_MS)
    }
  },
  { immediate: true }
)

// ========== Lifecycle Hooks ==========

onMounted(() => {
  nextTick(() => {
    if (videoRef.value) {
      initCamera()
    } else {
      // Retry jika video element belum tersedia
      initializeWithRetry()
    }
  })
})

onBeforeUnmount(() => {
  // Cleanup resources saat component unmount
  stopCamera()
  // Cleanup screenshot URL
  if (screenshotUrl.value) {
    URL.revokeObjectURL(screenshotUrl.value)
  }
})
</script>

<template>
  <div class="space-y-4">
    <UCard
      class="min-h-[360px] rounded-2xl border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40"
    >
      <div class="flex h-full items-center justify-center">
        <!-- Error State -->
        <div
          v-if="cameraError"
          class="max-w-sm rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
          aria-live="polite"
        >
          {{ cameraError }}
        </div>

        <!-- Camera Container -->
        <!-- Video element selalu dirender untuk mendapatkan ref, bahkan saat loading -->
        <div
          v-else
          class="relative aspect-video w-full max-w-3xl overflow-hidden rounded-2xl bg-black shadow-inner"
        >
          <video
            ref="videoRef"
            autoplay
            muted
            playsinline
            class="h-full w-full object-cover transition-opacity duration-300"
            :class="{ 'opacity-0': !isStreamReady }"
            aria-label="Camera preview"
          />

          <!-- Loading Overlay -->
          <Transition
            name="fade"
            enter-active-class="transition-opacity duration-300"
            leave-active-class="transition-opacity duration-300"
          >
            <div
              v-if="!isStreamReady"
              class="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white"
              role="status"
              aria-live="polite"
            >
              {{ UI_MESSAGES.loading }}
            </div>
          </Transition>

          <!-- Analyzing Overlay -->
          <Transition
            name="fade"
            enter-active-class="transition-opacity duration-300"
            leave-active-class="transition-opacity duration-300"
          >
            <div
              v-if="isAnalyzing"
              class="absolute inset-0 flex items-center justify-center bg-black/60 text-white"
            >
              <div class="text-center">
                <svg
                  class="mx-auto mb-2 h-12 w-12 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p class="text-sm font-medium">{{ UI_MESSAGES.analyzing }}</p>
              </div>
            </div>
          </Transition>

          <!-- Pause Overlay -->
          <Transition
            name="fade"
            enter-active-class="transition-opacity duration-300"
            leave-active-class="transition-opacity duration-300"
          >
            <div
              v-if="isPaused && isStreamReady"
              class="absolute inset-0 flex items-center justify-center bg-black/60 text-white"
            >
              <div class="text-center">
                <svg
                  class="mx-auto mb-2 h-12 w-12"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
                <p class="text-sm font-medium">Paused</p>
              </div>
            </div>
          </Transition>

          <!-- Controls Overlay -->
          <div class="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
            <div
              class="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-full bg-black/40 p-2 backdrop-blur"
            >
              <UButton
                :icon="isStreamReady ? 'i-heroicons-stop' : 'i-heroicons-play'"
                :color="isStreamReady ? 'error' : 'success'"
                variant="solid"
                size="lg"
                :loading="isInitializing"
                :disabled="isInitializing"
                @click="handleToggleCamera"
                aria-label="Toggle camera"
                :title="isStreamReady ? 'Stop camera' : 'Start camera'"
              />

              <UButton
                v-if="isStreamReady && availableDevices.length > 1"
                icon="i-heroicons-arrow-left-right"
                color="neutral"
                variant="solid"
                size="lg"
                :disabled="isInitializing || isPaused"
                @click="switchCamera"
                aria-label="Switch camera"
                title="Switch camera"
              />

              <UButton
                v-if="isStreamReady"
                :icon="isPaused ? 'i-heroicons-play' : 'i-heroicons-pause'"
                color="neutral"
                variant="solid"
                size="lg"
                :disabled="isInitializing"
                @click="handleTogglePause"
                aria-label="Pause or resume"
                :title="isPaused ? 'Resume camera' : 'Pause camera'"
              />

              <UButton
                v-if="isStreamReady"
                icon="i-heroicons-arrow-path"
                color="neutral"
                variant="solid"
                size="lg"
                :loading="isInitializing"
                :disabled="isInitializing || isPaused"
                @click="restartCamera"
                aria-label="Restart camera"
                title="Restart camera"
              />

              <UButton
                v-if="isStreamReady && !isPaused"
                icon="i-heroicons-camera"
                color="neutral"
                variant="solid"
                size="lg"
                :disabled="isPaused"
                @click="handleScreenshot"
                aria-label="Capture screenshot"
                title="Capture screenshot"
              />

              <UButton
                v-if="isStreamReady && !isPaused"
                icon="i-heroicons-sparkles"
                :color="selectedAnalysisItems.length > 0 ? 'primary' : 'neutral'"
                variant="solid"
                size="lg"
                :loading="isAnalyzing"
                :disabled="isPaused || isAnalyzing || selectedAnalysisItems.length === 0"
                @click="handleAnalyzeImage"
                :aria-label="selectedAnalysisItems.length > 0 ? 'Analyze image with Gemini' : 'Pilih jenis analisa terlebih dahulu'"
                :title="selectedAnalysisItems.length > 0 ? `Analyze dengan ${selectedAnalysisItems.length} jenis analisa` : 'Pilih minimal satu jenis analisa terlebih dahulu'"
              >
                <span v-if="!isAnalyzing">
                  Analyze
                  <span v-if="selectedAnalysisItems.length > 0" class="ml-1 text-xs opacity-75">
                    ({{ selectedAnalysisItems.length }})
                  </span>
                </span>
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Camera Info -->
    <div
      v-if="isStreamReady"
      class="flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400"
    >
      <span class="font-medium">{{ currentFacingMode === 'user' ? 'Front' : 'Back' }} Camera</span>
      <span v-if="availableDevices.length > 1" class="text-gray-500 dark:text-gray-500">
        • {{ availableDevices.length }} cameras available
      </span>
    </div>

    <!-- Analysis Grid -->
    <div v-if="props.analysisItems.length > 0">
      <AnalysisGrid
        v-model="selectedAnalysisItems"
        :items="props.analysisItems"
      />
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

