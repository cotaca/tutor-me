import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages liefert das Projekt unter https://cotaca.github.io/tutor-me/ aus.
  base: '/tutor-me/',
  plugins: [react()],
  // exceljs wird erst beim Export per import() geladen. Ohne Vorab-Bündelung entdeckt der
  // Dev-Server es erst beim Klick und lädt die Seite neu, der Export geht dabei verloren.
  optimizeDeps: { include: ['exceljs'] },
})
