import { ref, type Ref } from 'vue'

export interface CameraConfig {
  facingMode?: 'user' | 'environment'
  width?: { ideal?: number; min?: number; max?: number }
  height?: { ideal?: number; min?: number; max?: number }
}

export interface UseCameraReturn {
  videoRef: Ref<HTMLVideoElement | null>
  cameraError: Ref<string | null>
  isStreamReady: Ref<boolean>
  isInitializing: Ref<boolean>
  isPaused: Ref<boolean>
  currentFacingMode: Ref<'user' | 'environment'>
  availableDevices: Ref<MediaDeviceInfo[]>
  initCamera: () => Promise<void>
  stopCamera: () => void
  restartCamera: () => Promise<void>
  switchCamera: () => Promise<void>
  pauseCamera: () => void
  resumeCamera: () => void
  captureScreenshot: () => string | null
  getAvailableDevices: () => Promise<void>
}

const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  facingMode: 'user',
  width: { ideal: 1280 },
  height: { ideal: 720 }
}

/**
 * Composable untuk mengelola akses kamera perangkat
 * @param config Konfigurasi kamera (optional)
 * @returns Object berisi refs dan methods untuk mengontrol kamera
 */
export function useCamera(config: CameraConfig = DEFAULT_CAMERA_CONFIG): UseCameraReturn {
  const videoRef = ref<HTMLVideoElement | null>(null)
  const cameraError = ref<string | null>(null)
  const isStreamReady = ref(false)
  const isInitializing = ref(false)
  const isPaused = ref(false)
  const currentFacingMode = ref<'user' | 'environment'>(
    config.facingMode ?? DEFAULT_CAMERA_CONFIG.facingMode ?? 'user'
  )
  const availableDevices = ref<MediaDeviceInfo[]>([])

  let mediaStream: MediaStream | null = null
  let currentConfig: CameraConfig = { ...config }

  /**
   * Memeriksa apakah browser mendukung akses kamera
   */
  const isCameraSupported = (): boolean => {
    return !!navigator.mediaDevices?.getUserMedia
  }

  /**
   * Membersihkan stream media yang sedang aktif
   */
  const cleanupStream = (): void => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        track.stop()
        track.removeEventListener('ended', handleTrackEnded)
      })
      mediaStream = null
    }
    
    if (videoRef.value) {
      videoRef.value.srcObject = null
    }
  }

  /**
   * Handler ketika track media berakhir (misalnya kamera dicabut)
   */
  const handleTrackEnded = (): void => {
    cameraError.value = 'Kamera tidak lagi tersedia.'
    isStreamReady.value = false
    cleanupStream()
  }

  /**
   * Setup event listeners untuk media stream tracks
   */
  const setupTrackListeners = (): void => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        track.addEventListener('ended', handleTrackEnded)
      })
    }
  }

  /**
   * Mendapatkan daftar perangkat kamera yang tersedia
   */
  const getAvailableDevices = async (): Promise<void> => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        return
      }

      const devices = await navigator.mediaDevices.enumerateDevices()
      availableDevices.value = devices.filter((device) => device.kind === 'videoinput')
    } catch (error) {
      console.error('Error enumerating devices:', error)
    }
  }

  /**
   * Inisialisasi dan memulai akses kamera
   */
  const initCamera = async (): Promise<void> => {
    // Cegah inisialisasi ganda
    if (isInitializing.value || mediaStream) {
      return
    }

    // Pastikan video element sudah tersedia
    if (!videoRef.value) {
      return
    }

    isInitializing.value = true
    cameraError.value = null
    isStreamReady.value = false
    isPaused.value = false

    try {
      // Cek dukungan browser
      if (!isCameraSupported()) {
        throw new Error('Perangkat tidak mendukung akses kamera.')
      }

      // Update config dengan current facing mode
      const cameraRequestConfig: MediaStreamConstraints = {
        video: {
          facingMode: currentFacingMode.value,
          width: currentConfig.width ?? DEFAULT_CAMERA_CONFIG.width,
          height: currentConfig.height ?? DEFAULT_CAMERA_CONFIG.height
        },
        audio: false
      }

      // Request akses kamera
      mediaStream = await navigator.mediaDevices.getUserMedia(cameraRequestConfig)

      // Setup event listeners
      setupTrackListeners()

      // Assign stream ke video element
      if (!videoRef.value) {
        throw new Error('Video element tidak ditemukan.')
      }

      videoRef.value.srcObject = mediaStream

      // Tunggu sampai video siap
      videoRef.value.onloadedmetadata = () => {
        if (!videoRef.value) {
          return
        }

        videoRef.value
          .play()
          .then(() => {
            isStreamReady.value = true
            isInitializing.value = false
          })
          .catch((err) => {
            const errorMessage = err instanceof Error ? err.message : 'Gagal memutar video'
            cameraError.value = `Gagal memutar video: ${errorMessage}`
            isInitializing.value = false
            console.error('Video play error:', err)
          })
      }

      // Update available devices setelah mendapatkan permission
      await getAvailableDevices()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Tidak dapat mengakses kamera perangkat.'
      
      cameraError.value = errorMessage
      isInitializing.value = false
      console.error('Camera initialization error:', error)
      
      // Cleanup jika terjadi error
      cleanupStream()
    }
  }

  /**
   * Menghentikan akses kamera dan membersihkan resources
   */
  const stopCamera = (): void => {
    isInitializing.value = false
    isStreamReady.value = false
    isPaused.value = false
    cleanupStream()
  }

  /**
   * Restart kamera (stop lalu start lagi)
   */
  const restartCamera = async (): Promise<void> => {
    stopCamera()
    // Tunggu sebentar sebelum restart
    await new Promise((resolve) => setTimeout(resolve, 300))
    await initCamera()
  }

  /**
   * Switch antara kamera depan dan belakang
   */
  const switchCamera = async (): Promise<void> => {
    if (!availableDevices.value.length) {
      await getAvailableDevices()
    }

    // Toggle facing mode
    currentFacingMode.value = currentFacingMode.value === 'user' ? 'environment' : 'user'
    
    // Restart camera dengan facing mode baru
    await restartCamera()
  }

  /**
   * Pause video stream (video masih berjalan tapi bisa dihentikan)
   */
  const pauseCamera = (): void => {
    if (videoRef.value && isStreamReady.value) {
      videoRef.value.pause()
      isPaused.value = true
    }
  }

  /**
   * Resume video stream
   */
  const resumeCamera = async (): Promise<void> => {
    if (videoRef.value && isPaused.value) {
      try {
        await videoRef.value.play()
        isPaused.value = false
      } catch (error) {
        console.error('Error resuming camera:', error)
        cameraError.value = 'Gagal melanjutkan video'
      }
    }
  }

  /**
   * Capture screenshot dari video stream
   * @returns Data URL dari screenshot atau null jika gagal
   */
  const captureScreenshot = (): string | null => {
    if (!videoRef.value || !isStreamReady.value) {
      return null
    }

    try {
      const canvas = document.createElement('canvas')
      const video = videoRef.value

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return null
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/png')
    } catch (error) {
      console.error('Error capturing screenshot:', error)
      return null
    }
  }

  return {
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
  }
}
