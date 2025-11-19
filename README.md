# Computer Vision Analysis App

Aplikasi analisis gambar menggunakan kamera perangkat dengan integrasi Google Gemini API untuk melakukan analisis visual yang canggih.

## Fitur

- 📷 Akses kamera perangkat (depan/belakang)
- 🤖 Analisis gambar menggunakan Google Gemini AI
- 📊 Panel hasil analisis yang interaktif
- 🎨 UI modern dengan Nuxt UI

## Setup

### 1. Install Dependencies

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

### 2. Setup Gemini API Key

1. Dapatkan API key dari [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Buat file `.env` di root project dengan isi:

```env
NUXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

3. Ganti `your_gemini_api_key_here` dengan API key yang Anda dapatkan

## Cara Menggunakan

1. **Mulai Development Server** (lihat bagian Development Server di bawah)
2. **Berikan izin kamera** saat browser meminta akses
3. **Klik tombol "Analyze"** untuk menganalisis gambar dari kamera
4. **Lihat hasil analisis** di panel sebelah kanan

### Fitur Kamera
- **Start/Stop**: Mulai atau hentikan kamera
- **Switch Camera**: Ganti antara kamera depan dan belakang
- **Pause/Resume**: Jeda atau lanjutkan video stream
- **Restart**: Restart kamera
- **Screenshot**: Ambil screenshot dari kamera
- **Analyze**: Analisis gambar saat ini menggunakan Gemini AI

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
