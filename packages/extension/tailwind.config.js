/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/web-view-vite/index.html',
    './src/web-view-vite/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  presets: [require('./ui.preset.js')],
}
