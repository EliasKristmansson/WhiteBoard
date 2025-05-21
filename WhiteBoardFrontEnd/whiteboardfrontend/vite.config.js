import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    base: "/", // leave as root if not using subdirectory
    plugins: [react()],
});
