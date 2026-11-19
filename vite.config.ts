import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // exceljs wird erst beim Export per import() geladen. Ohne Vorab-Bündelung entdeckt der
  // Dev-Server es erst beim Klick und lädt die Seite neu, der Export geht dabei verloren.
  optimizeDeps: { include: ['exceljs'] },
})
