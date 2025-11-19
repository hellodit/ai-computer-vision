import { ref, type Ref } from 'vue'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface GeminiAnalysisResult {
  text: string
  timestamp: Date
}

export interface UseGeminiReturn {
  isAnalyzing: Ref<boolean>
  error: Ref<string | null>
  lastResult: Ref<GeminiAnalysisResult | null>
  analyzeImage: (imageDataUrl: string, prompt?: string) => Promise<string | null>
  clearResult: () => void
}

/**
 * Composable untuk mengintegrasikan Google Gemini API
 * @param apiKey API key untuk Gemini (optional, akan menggunakan env var jika tidak disediakan)
 * @returns Object berisi refs dan methods untuk menganalisis gambar
 */
export function useGemini(apiKey?: string): UseGeminiReturn {
  const isAnalyzing = ref(false)
  const error = ref<string | null>(null)
  const lastResult = ref<GeminiAnalysisResult | null>(null)

  /**
   * Mendapatkan API key dari parameter atau environment variable
   */
  const getApiKey = (): string => {
    if (apiKey) {
      return apiKey
    }

    const config = useRuntimeConfig()
    const envKey = config.public.geminiApiKey as string | undefined

    if (!envKey) {
      throw new Error(
        'Gemini API key tidak ditemukan. Silakan set NUXT_PUBLIC_GEMINI_API_KEY di .env file atau berikan sebagai parameter.'
      )
    }

    return envKey
  }

  /**
   * Mengkonversi data URL (base64) ke format yang bisa digunakan Gemini
   */
  const dataUrlToBase64 = (dataUrl: string): { mimeType: string; data: string } => {
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/)
    if (!matches || matches.length !== 3) {
      throw new Error('Format data URL tidak valid')
    }

    const mimeType = matches[1]?.trim()
    const data = matches[2]

    if (!mimeType || !data) {
      throw new Error('Format data URL tidak valid: mimeType atau data tidak ditemukan')
    }

    return {
      mimeType,
      data
    }
  }

  /**
   * Menganalisis gambar menggunakan Gemini API
   * @param imageDataUrl Data URL dari gambar (base64)
   * @param prompt Prompt tambahan untuk analisis (optional)
   * @returns Hasil analisis berupa text atau null jika error
   */
  const analyzeImage = async (
    imageDataUrl: string,
    prompt: string = 'Analisis gambar ini secara detail. Berikan deskripsi lengkap tentang apa yang terlihat dalam gambar, termasuk objek, orang, emosi, dan konteks visual lainnya. Jawab dalam bahasa Indonesia.'
  ): Promise<string | null> => {
    isAnalyzing.value = true
    error.value = null

    try {
      // Validasi data URL
      if (!imageDataUrl || !imageDataUrl.startsWith('data:image')) {
        throw new Error('Data URL gambar tidak valid')
      }

      // Konversi data URL ke format Gemini
      const imageParts = dataUrlToBase64(imageDataUrl)

      // Inisialisasi Gemini API
      const apiKey = getApiKey()
      const genAI = new GoogleGenerativeAI(apiKey)

      // Menggunakan model gemini-pro yang stabil dan mendukung vision tasks
      // Model ini tersedia secara luas dan sangat cocok untuk analisis gambar
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

      // Siapkan prompt dengan gambar
      const imagePart = {
        inlineData: {
          data: imageParts.data,
          mimeType: imageParts.mimeType
        }
      }

      // Generate content dengan gambar dan prompt
      const result = await model.generateContent([prompt, imagePart])
      const response = await result.response
      const text = response.text()

      // Simpan hasil
      lastResult.value = {
        text,
        timestamp: new Date()
      }

      return text
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Terjadi kesalahan saat menganalisis gambar'
      error.value = errorMessage
      console.error('Gemini API error:', err)
      return null
    } finally {
      isAnalyzing.value = false
    }
  }

  /**
   * Membersihkan hasil analisis terakhir
   */
  const clearResult = (): void => {
    lastResult.value = null
    error.value = null
  }

  return {
    isAnalyzing,
    error,
    lastResult,
    analyzeImage,
    clearResult
  }
}

