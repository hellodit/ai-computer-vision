<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useCamera, type CameraConfig } from '~/composables/useCamera'
import AnalysisGrid from '~/components/analysis/AnalysisGrid.vue'

interface Props {
  analysisItems?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  analysisItems: () => []
})

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
  screenshotFailed: 'Gagal mengambil screenshot'
} as const

// State untuk screenshot
const screenshotUrl = ref<string | null>(null)

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
      <AnalysisGrid :items="props.analysisItems" />
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

